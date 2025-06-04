import { TechnicalAnalysis } from './technical-indicators';

export interface MarketSentiment {
  score: number; // -100 to 100
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  factors: string[];
}

export interface VolumeProfile {
  averageVolume: number;
  volumeSpike: boolean;
  volumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  breakoutConfirmation: boolean;
}

export interface RiskMetrics {
  volatility: number;
  drawdown: number;
  sharpeRatio: number;
  maxLoss: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MarketRegime {
  type: 'TRENDING' | 'RANGING' | 'VOLATILE';
  strength: number;
  duration: number;
  recommendation: string;
}

export class AdvancedAnalytics {
  
  static calculateMarketSentiment(
    prices: number[], 
    volumes: number[], 
    indicators: any
  ): MarketSentiment {
    let score = 0;
    const factors: string[] = [];

    // RSI sentiment
    if (indicators.rsi < 30) {
      score += 30;
      factors.push('RSI oversold - bullish reversal expected');
    } else if (indicators.rsi > 70) {
      score -= 30;
      factors.push('RSI overbought - bearish correction likely');
    }

    // MACD sentiment
    if (indicators.macd.macd > indicators.macd.signal) {
      score += 20;
      factors.push('MACD bullish crossover');
    } else {
      score -= 20;
      factors.push('MACD bearish crossover');
    }

    // Moving average sentiment
    if (indicators.sma20 > indicators.sma50) {
      score += 25;
      factors.push('Golden cross - uptrend confirmed');
    } else {
      score -= 25;
      factors.push('Death cross - downtrend confirmed');
    }

    // Price momentum
    const recentPrices = prices.slice(-10);
    const priceChange = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
    if (priceChange > 0.02) {
      score += 15;
      factors.push('Strong upward momentum');
    } else if (priceChange < -0.02) {
      score -= 15;
      factors.push('Strong downward momentum');
    }

    // Volume confirmation
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];
    if (currentVolume > avgVolume * 1.5) {
      const volumeBoost = priceChange > 0 ? 10 : -10;
      score += volumeBoost;
      factors.push('High volume confirms price movement');
    }

    const direction = score > 20 ? 'BULLISH' : score < -20 ? 'BEARISH' : 'NEUTRAL';
    const strength = Math.abs(score) > 50 ? 'STRONG' : Math.abs(score) > 25 ? 'MODERATE' : 'WEAK';

    return {
      score: Math.max(-100, Math.min(100, score)),
      strength,
      direction,
      factors
    };
  }

  static analyzeVolumeProfile(volumes: number[]): VolumeProfile {
    const recent = volumes.slice(-10);
    const historical = volumes.slice(-50, -10);
    
    const averageVolume = historical.reduce((a, b) => a + b, 0) / historical.length;
    const currentVolume = recent[recent.length - 1];
    const volumeSpike = currentVolume > averageVolume * 2;

    // Volume trend analysis
    const firstHalf = recent.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const secondHalf = recent.slice(5).reduce((a, b) => a + b, 0) / 5;
    const volumeTrend = secondHalf > firstHalf * 1.1 ? 'INCREASING' : 
                       secondHalf < firstHalf * 0.9 ? 'DECREASING' : 'STABLE';

    const breakoutConfirmation = volumeSpike && volumeTrend === 'INCREASING';

    return {
      averageVolume,
      volumeSpike,
      volumeTrend,
      breakoutConfirmation
    };
  }

  static calculateRiskMetrics(prices: number[], trades: any[]): RiskMetrics {
    // Calculate volatility (standard deviation of returns)
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100;

    // Calculate drawdown from trades
    let peak = 0;
    let maxDrawdown = 0;
    let cumulativeProfit = 0;

    trades.forEach((trade: any) => {
      if (trade.profit) {
        cumulativeProfit += parseFloat(trade.profit);
        if (cumulativeProfit > peak) {
          peak = cumulativeProfit;
        }
        const drawdown = (peak - cumulativeProfit) / Math.max(peak, 1) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    });

    // Simple Sharpe ratio calculation
    const riskFreeRate = 0.02; // 2% annual
    const dailyRiskFree = riskFreeRate / 365;
    const excessReturn = avgReturn - dailyRiskFree;
    const sharpeRatio = returns.length > 0 ? excessReturn / Math.sqrt(variance) : 0;

    // Max loss calculation
    const losses = trades
      .filter((t: any) => t.profit && parseFloat(t.profit) < 0)
      .map((t: any) => parseFloat(t.profit));
    const maxLoss = losses.length > 0 ? Math.min(...losses) : 0;

    const riskLevel = volatility > 5 ? 'HIGH' : volatility > 2 ? 'MEDIUM' : 'LOW';

    return {
      volatility,
      drawdown: maxDrawdown,
      sharpeRatio,
      maxLoss,
      riskLevel
    };
  }

  static detectMarketRegime(prices: number[], period: number = 50): MarketRegime {
    const recentPrices = prices.slice(-period);
    
    // Calculate price ranges and trends
    const high = Math.max(...recentPrices);
    const low = Math.min(...recentPrices);
    const range = (high - low) / low;
    
    // Trend strength using linear regression
    const n = recentPrices.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = recentPrices.reduce((a, b) => a + b, 0);
    const sumXY = recentPrices.reduce((sum, price, i) => sum + i * price, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const trendStrength = Math.abs(slope) * 1000; // Scale for readability
    
    // Volatility
    const returns = [];
    for (let i = 1; i < recentPrices.length; i++) {
      returns.push(Math.abs((recentPrices[i] - recentPrices[i-1]) / recentPrices[i-1]));
    }
    const avgVolatility = returns.reduce((a, b) => a + b, 0) / returns.length;
    
    let type: 'TRENDING' | 'RANGING' | 'VOLATILE';
    let recommendation: string;
    
    if (avgVolatility > 0.03) {
      type = 'VOLATILE';
      recommendation = 'Use wider stops, reduce position size, focus on short-term trades';
    } else if (trendStrength > 2) {
      type = 'TRENDING';
      recommendation = 'Follow the trend, use trend-following strategies, ride momentum';
    } else {
      type = 'RANGING';
      recommendation = 'Use mean reversion strategies, buy support, sell resistance';
    }
    
    return {
      type,
      strength: Math.round(trendStrength * 10) / 10,
      duration: period,
      recommendation
    };
  }

  // Support and Resistance levels
  static findSupportResistance(prices: number[], periods: number = 20): { support: number[], resistance: number[] } {
    const support: number[] = [];
    const resistance: number[] = [];
    
    for (let i = periods; i < prices.length - periods; i++) {
      const window = prices.slice(i - periods, i + periods + 1);
      const current = prices[i];
      
      // Check if current price is a local minimum (support)
      const isSupport = window.every(price => price >= current);
      if (isSupport) {
        support.push(current);
      }
      
      // Check if current price is a local maximum (resistance)
      const isResistance = window.every(price => price <= current);
      if (isResistance) {
        resistance.push(current);
      }
    }
    
    return {
      support: support.slice(-5), // Keep last 5 levels
      resistance: resistance.slice(-5)
    };
  }

  // Fibonacci retracement levels
  static calculateFibonacci(high: number, low: number): { levels: number[], labels: string[] } {
    const diff = high - low;
    const levels = [
      low,
      low + diff * 0.236,
      low + diff * 0.382,
      low + diff * 0.5,
      low + diff * 0.618,
      low + diff * 0.786,
      high
    ];
    
    const labels = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];
    
    return { levels, labels };
  }
}

export const advancedAnalytics = new AdvancedAnalytics();