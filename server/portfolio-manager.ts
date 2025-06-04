import { storage } from './storage';
import { advancedAnalytics } from './advanced-analytics';

export interface PositionSizing {
  baseSize: number;
  adjustedSize: number;
  riskPercent: number;
  maxPositions: number;
  leverageMultiplier: number;
}

export interface Portfolio {
  totalValue: number;
  availableBalance: number;
  exposedAmount: number;
  pnl: number;
  dailyPnl: number;
  positions: Position[];
}

export interface Position {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
}

export interface RiskManagement {
  maxDailyLoss: number;
  maxDrawdown: number;
  positionSizeLimit: number;
  correlationLimit: number;
  volatilityThreshold: number;
}

export class PortfolioManager {
  private riskSettings: RiskManagement = {
    maxDailyLoss: 500, // $500 max daily loss
    maxDrawdown: 0.15, // 15% max drawdown
    positionSizeLimit: 0.25, // 25% of portfolio per position
    correlationLimit: 0.7, // Max correlation between positions
    volatilityThreshold: 0.05 // 5% volatility threshold
  };

  async calculateOptimalPositionSize(
    currentPrice: number,
    stopLoss: number,
    portfolioValue: number,
    volatility: number,
    confidence: number
  ): Promise<PositionSizing> {
    const riskPercent = Math.min(
      0.02 + (confidence - 70) * 0.0005, // Base 2% risk, increase with confidence
      0.05 // Max 5% risk per trade
    );

    // Kelly Criterion-inspired sizing
    const winRate = 0.65; // Historical win rate
    const avgWin = 0.015; // 1.5% average win
    const avgLoss = 0.01; // 1% average loss
    const kellyPercent = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
    
    // Volatility adjustment
    const volatilityAdjustment = Math.max(0.3, 1 - volatility * 10);
    
    // Risk per dollar calculation
    const riskPerShare = Math.abs(currentPrice - stopLoss);
    const dollarsAtRisk = portfolioValue * riskPercent;
    const baseShares = dollarsAtRisk / riskPerShare;
    
    // Apply Kelly and volatility adjustments
    const adjustedShares = baseShares * Math.min(kellyPercent, 0.25) * volatilityAdjustment;
    
    const baseSize = Math.max(0.001, baseShares * currentPrice); // Min $0.001
    const adjustedSize = Math.max(0.001, adjustedShares * currentPrice);

    return {
      baseSize,
      adjustedSize,
      riskPercent: riskPercent * 100,
      maxPositions: 5,
      leverageMultiplier: Math.min(2, 1 + confidence / 200) // Max 2x leverage
    };
  }

  async evaluateRisk(
    prices: number[],
    currentPositions: Position[],
    proposedTrade: { type: 'BUY' | 'SELL'; size: number; price: number }
  ): Promise<{ approved: boolean; reason: string; adjustments?: any }> {
    const riskMetrics = AdvancedAnalytics.calculateRiskMetrics(prices, await storage.getTrades());
    
    // Check daily loss limit
    const todayTrades = await storage.getTradesByDateRange(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      new Date()
    );
    const dailyPnl = todayTrades.reduce((sum, trade) => {
      return sum + (trade.profit ? parseFloat(trade.profit) : 0);
    }, 0);

    if (dailyPnl < -this.riskSettings.maxDailyLoss) {
      return {
        approved: false,
        reason: `Daily loss limit exceeded: $${Math.abs(dailyPnl).toFixed(2)}`
      };
    }

    // Check volatility threshold
    if (riskMetrics.volatility > this.riskSettings.volatilityThreshold * 100) {
      return {
        approved: true,
        reason: 'High volatility detected',
        adjustments: {
          reducedSize: proposedTrade.size * 0.5,
          widerStops: true
        }
      };
    }

    // Check maximum drawdown
    if (riskMetrics.drawdown > this.riskSettings.maxDrawdown * 100) {
      return {
        approved: false,
        reason: `Drawdown limit exceeded: ${riskMetrics.drawdown.toFixed(1)}%`
      };
    }

    return {
      approved: true,
      reason: 'Risk parameters within acceptable limits'
    };
  }

  async getPortfolioSummary(): Promise<Portfolio> {
    const trades = await storage.getTrades();
    const settings = await storage.getBotSettings();
    
    // Calculate total PnL
    const realizedPnl = trades.reduce((sum, trade) => {
      return sum + (trade.profit ? parseFloat(trade.profit) : 0);
    }, 0);

    // Get today's PnL
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTrades = trades.filter(trade => new Date(trade.timestamp) >= today);
    const dailyPnl = todayTrades.reduce((sum, trade) => {
      return sum + (trade.profit ? parseFloat(trade.profit) : 0);
    }, 0);

    // Calculate portfolio value (starting with initial balance)
    const initialBalance = 10000; // $10k starting balance
    const totalValue = initialBalance + realizedPnl;
    
    // Get current positions (open trades)
    const openTrades = trades.filter(trade => trade.status === 'OPEN');
    const positions: Position[] = openTrades.map(trade => ({
      id: trade.id.toString(),
      symbol: 'BTC/USD',
      type: trade.type === 'BUY' ? 'LONG' : 'SHORT',
      size: parseFloat(trade.amount),
      entryPrice: parseFloat(trade.entryPrice || trade.price),
      currentPrice: parseFloat(trade.price), // This would be updated with real-time price
      unrealizedPnl: 0, // Calculate based on current price vs entry
      realizedPnl: trade.profit ? parseFloat(trade.profit) : 0,
      stopLoss: 0, // Would be calculated based on settings
      takeProfit: 0, // Would be calculated based on settings
      timestamp: new Date(trade.timestamp).getTime()
    }));

    const exposedAmount = positions.reduce((sum, pos) => sum + pos.size * pos.currentPrice, 0);
    const availableBalance = totalValue - exposedAmount;

    return {
      totalValue,
      availableBalance,
      exposedAmount,
      pnl: realizedPnl,
      dailyPnl,
      positions
    };
  }

  // Dynamic stop-loss adjustment based on volatility and market conditions
  calculateDynamicStops(
    entryPrice: number,
    tradeType: 'BUY' | 'SELL',
    volatility: number,
    marketRegime: any
  ): { stopLoss: number; takeProfit: number } {
    const baseStopPercent = 0.02; // 2% base stop
    const baseTakeProfitPercent = 0.04; // 4% base take profit

    // Adjust for volatility
    const volatilityMultiplier = Math.max(0.5, Math.min(2, 1 + volatility * 10));
    const stopPercent = baseStopPercent * volatilityMultiplier;
    const takeProfitPercent = baseTakeProfitPercent * volatilityMultiplier;

    // Adjust for market regime
    let regimeAdjustment = 1;
    if (marketRegime.type === 'TRENDING') {
      regimeAdjustment = 1.5; // Wider stops in trending markets
    } else if (marketRegime.type === 'VOLATILE') {
      regimeAdjustment = 2; // Much wider stops in volatile markets
    }

    const adjustedStopPercent = stopPercent * regimeAdjustment;
    const adjustedTakeProfitPercent = takeProfitPercent * regimeAdjustment;

    let stopLoss: number;
    let takeProfit: number;

    if (tradeType === 'BUY') {
      stopLoss = entryPrice * (1 - adjustedStopPercent);
      takeProfit = entryPrice * (1 + adjustedTakeProfitPercent);
    } else {
      stopLoss = entryPrice * (1 + adjustedStopPercent);
      takeProfit = entryPrice * (1 - adjustedTakeProfitPercent);
    }

    return { stopLoss, takeProfit };
  }

  // Performance attribution analysis
  async analyzePerformance(): Promise<any> {
    const trades = await storage.getTrades();
    const closedTrades = trades.filter(trade => trade.status === 'CLOSED');

    if (closedTrades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0
      };
    }

    const winners = closedTrades.filter(trade => trade.profit && parseFloat(trade.profit) > 0);
    const losers = closedTrades.filter(trade => trade.profit && parseFloat(trade.profit) < 0);

    const winRate = winners.length / closedTrades.length;
    const avgWin = winners.length > 0 
      ? winners.reduce((sum, trade) => sum + parseFloat(trade.profit!), 0) / winners.length 
      : 0;
    const avgLoss = losers.length > 0 
      ? Math.abs(losers.reduce((sum, trade) => sum + parseFloat(trade.profit!), 0) / losers.length)
      : 0;

    const grossProfit = winners.reduce((sum, trade) => sum + parseFloat(trade.profit!), 0);
    const grossLoss = Math.abs(losers.reduce((sum, trade) => sum + parseFloat(trade.profit!), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    return {
      totalTrades: closedTrades.length,
      winRate: winRate * 100,
      avgWin,
      avgLoss,
      profitFactor,
      sharpeRatio: 0, // Would need daily returns for proper calculation
      bestTrade: Math.max(...closedTrades.map(t => parseFloat(t.profit || '0'))),
      worstTrade: Math.min(...closedTrades.map(t => parseFloat(t.profit || '0'))),
      consecutiveWins: this.calculateConsecutiveWins(closedTrades),
      consecutiveLosses: this.calculateConsecutiveLosses(closedTrades)
    };
  }

  private calculateConsecutiveWins(trades: any[]): number {
    let maxWins = 0;
    let currentWins = 0;

    for (const trade of trades.reverse()) {
      if (trade.profit && parseFloat(trade.profit) > 0) {
        currentWins++;
        maxWins = Math.max(maxWins, currentWins);
      } else {
        currentWins = 0;
      }
    }

    return maxWins;
  }

  private calculateConsecutiveLosses(trades: any[]): number {
    let maxLosses = 0;
    let currentLosses = 0;

    for (const trade of trades.reverse()) {
      if (trade.profit && parseFloat(trade.profit) < 0) {
        currentLosses++;
        maxLosses = Math.max(maxLosses, currentLosses);
      } else {
        currentLosses = 0;
      }
    }

    return maxLosses;
  }
}

export const portfolioManager = new PortfolioManager();