import { krakenAPI, type KrakenTickerData, type KrakenOHLCData } from './kraken-api';
import { TechnicalAnalysis, type TradingSignal } from './technical-indicators';
import { mlPredictor, type PredictionData } from './ml-predictor';
import { storage } from './storage';
import type { BotSettings, Trade } from '@shared/schema';

export interface BotState {
  isActive: boolean;
  currentPosition: {
    isOpen: boolean;
    type: 'BUY' | 'SELL' | null;
    amount: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    duration: number;
    stopLoss: number;
    takeProfit: number;
  } | null;
  performance: {
    totalTrades: number;
    winningTrades: number;
    winRate: number;
    profitToday: number;
    profitPerHour: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    tradesThisHour: number;
    lastTradeTime: number;
  };
  scaling: {
    currentTier: number;
    nextScaleTarget: number;
    progressToNext: number;
  };
}

export class TradingBot {
  private settings: BotSettings | null = null;
  private priceHistory: number[] = [];
  private volumeHistory: number[] = [];
  private isInitialized = false;
  private lastSignalTime = 0;
  private state: BotState;
  private subscribers: ((event: string, data: any) => void)[] = [];

  constructor() {
    this.state = {
      isActive: false,
      currentPosition: null,
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        winRate: 0,
        profitToday: 0,
        profitPerHour: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        tradesThisHour: 0,
        lastTradeTime: 0
      },
      scaling: {
        currentTier: 1,
        nextScaleTarget: 3,
        progressToNext: 0
      }
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load bot settings
      this.settings = await storage.getBotSettings();
      
      // Update state from settings
      this.state.isActive = this.settings.isActive;
      this.state.performance.totalTrades = this.settings.totalTrades;
      this.state.performance.winningTrades = this.settings.winningTrades;
      this.state.performance.winRate = this.settings.totalTrades > 0 
        ? (this.settings.winningTrades / this.settings.totalTrades) * 100 
        : 0;
      this.state.performance.consecutiveWins = this.settings.consecutiveWins;
      this.state.performance.consecutiveLosses = this.settings.consecutiveLosses;

      // Calculate scaling tier
      this.updateScalingTier();

      // Subscribe to Kraken data
      krakenAPI.subscribe('ticker', (data: KrakenTickerData) => {
        this.handleTickerUpdate(data);
      });

      krakenAPI.subscribe('ohlc', (data: KrakenOHLCData) => {
        this.handleOHLCUpdate(data);
      });

      // Connect to Kraken WebSocket
      await krakenAPI.connectWebSocket();

      // Load initial price history
      const ohlcData = await krakenAPI.getOHLCData();
      this.priceHistory = ohlcData.map(d => d.close);
      this.volumeHistory = ohlcData.map(d => d.volume);

      this.isInitialized = true;
      this.emit('bot:initialized', { state: this.state });

      console.log('Trading bot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize trading bot:', error);
      throw error;
    }
  }

  subscribe(callback: (event: string, data: any) => void): void {
    this.subscribers.push(callback);
  }

  private emit(event: string, data: any): void {
    this.subscribers.forEach(callback => callback(event, data));
  }

  private async handleTickerUpdate(tickerData: KrakenTickerData): Promise<void> {
    this.priceHistory.push(tickerData.price);
    
    // Keep only last 200 price points for efficiency
    if (this.priceHistory.length > 200) {
      this.priceHistory.shift();
    }

    // Update current position P&L if position is open
    if (this.state.currentPosition?.isOpen) {
      const currentPrice = tickerData.price;
      const entryPrice = this.state.currentPosition.entryPrice;
      const amount = this.state.currentPosition.amount;
      
      if (this.state.currentPosition.type === 'BUY') {
        this.state.currentPosition.pnl = (currentPrice - entryPrice) * amount;
      } else {
        this.state.currentPosition.pnl = (entryPrice - currentPrice) * amount;
      }
      
      this.state.currentPosition.currentPrice = currentPrice;
      this.state.currentPosition.duration = Date.now() - this.state.performance.lastTradeTime;

      // Check for stop loss or take profit
      await this.checkExitConditions(currentPrice);
    }

    // Generate trading signals if bot is active and enough time has passed
    if (this.state.isActive && this.shouldGenerateSignal()) {
      await this.analyzeAndTrade(tickerData);
    }

    // Emit real-time updates
    this.emit('price:update', {
      price: tickerData.price,
      change: tickerData.change24h,
      changePercent: tickerData.changePercent24h,
      timestamp: tickerData.timestamp
    });

    this.emit('bot:state', this.state);
  }

  private handleOHLCUpdate(ohlcData: KrakenOHLCData): void {
    // Store price data
    storage.addPriceData({
      open: ohlcData.open.toString(),
      high: ohlcData.high.toString(),
      low: ohlcData.low.toString(),
      close: ohlcData.close.toString(),
      volume: ohlcData.volume.toString()
    });

    this.volumeHistory.push(ohlcData.volume);
    if (this.volumeHistory.length > 200) {
      this.volumeHistory.shift();
    }

    this.emit('ohlc:update', ohlcData);
  }

  private shouldGenerateSignal(): boolean {
    const now = Date.now();
    const timeSinceLastSignal = now - this.lastSignalTime;
    const minInterval = 30000; // 30 seconds minimum between signals
    
    // Check if we haven't exceeded max trades per hour
    const oneHourAgo = now - (60 * 60 * 1000);
    if (this.state.performance.lastTradeTime > oneHourAgo) {
      const tradesThisHour = this.state.performance.tradesThisHour;
      if (tradesThisHour >= 10) return false; // Max 10 trades per hour
    } else {
      this.state.performance.tradesThisHour = 0; // Reset counter
    }

    return timeSinceLastSignal >= minInterval && this.priceHistory.length >= 50;
  }

  private async analyzeAndTrade(tickerData: KrakenTickerData): Promise<void> {
    try {
      // Don't trade if position is already open
      if (this.state.currentPosition?.isOpen) return;

      // Get traditional technical analysis signal
      const technicalSignal = TechnicalAnalysis.generateSignal(this.priceHistory, this.volumeHistory);
      
      // Get AI prediction for price movement
      const aiPrediction = await mlPredictor.predictPrice(this.priceHistory, this.volumeHistory, 15);
      
      // Get high-confidence AI signals
      const aiSignals = await mlPredictor.getHighConfidenceSignals(this.priceHistory, this.volumeHistory);
      
      // Combine traditional and AI signals for better accuracy
      const combinedSignal = this.combineSignals(technicalSignal, aiPrediction, aiSignals);
      
      // Emit prediction and signal data for real-time alerts
      this.emit('ai:prediction', {
        prediction: aiPrediction,
        aiSignals,
        technicalSignal,
        combinedSignal,
        timestamp: Date.now()
      });

      // Require higher confidence for auto-trading
      if (combinedSignal.strength < 70) {
        // Still emit signal for user notifications even if not trading
        this.emit('signal:generated', {
          signal: combinedSignal,
          prediction: aiPrediction,
          timestamp: Date.now()
        });
        return;
      }

      this.lastSignalTime = Date.now();

      // Execute trade based on combined signal
      if (combinedSignal.type === 'BUY' || combinedSignal.type === 'SELL') {
        await this.executeTrade(combinedSignal, tickerData.price);
      }

      this.emit('signal:generated', {
        signal: combinedSignal,
        prediction: aiPrediction,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error in trade analysis:', error);
      this.emit('error', { message: 'Trade analysis failed', error });
    }
  }

  private combineSignals(
    technicalSignal: TradingSignal,
    aiPrediction: PredictionData,
    aiSignals: Array<{ signal: 'BUY' | 'SELL'; confidence: number; reasoning: string }>
  ): TradingSignal {
    let combinedType: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let combinedStrength = 0;
    let combinedReason: string[] = [];

    // Technical analysis weight: 40%
    const technicalWeight = 0.4;
    let technicalScore = technicalSignal.strength * technicalWeight;
    
    if (technicalSignal.type !== 'HOLD') {
      combinedReason.push(`Technical: ${technicalSignal.reason} (${technicalSignal.strength}%)`);
    }

    // AI prediction weight: 60%
    const aiWeight = 0.6;
    let aiScore = 0;
    
    if (aiPrediction.confidence >= 70) {
      aiScore = aiPrediction.confidence * aiWeight;
      combinedReason.push(`AI: ${aiPrediction.priceDirection} prediction (${aiPrediction.confidence}% confidence)`);
      
      // If AI and technical agree, boost confidence
      if ((aiPrediction.priceDirection === 'UP' && technicalSignal.type === 'BUY') ||
          (aiPrediction.priceDirection === 'DOWN' && technicalSignal.type === 'SELL')) {
        combinedStrength = Math.min(technicalScore + aiScore + 15, 100); // Bonus for agreement
        combinedType = technicalSignal.type;
        combinedReason.push('AI + Technical Agreement Boost');
      } else if (aiScore > technicalScore) {
        // AI signal is stronger
        combinedStrength = aiScore;
        combinedType = aiPrediction.priceDirection === 'UP' ? 'BUY' : 
                      aiPrediction.priceDirection === 'DOWN' ? 'SELL' : 'HOLD';
      } else {
        // Technical signal is stronger
        combinedStrength = technicalScore;
        combinedType = technicalSignal.type;
      }
    } else {
      // No strong AI signal, rely on technical
      combinedStrength = technicalScore;
      combinedType = technicalSignal.type;
    }

    // Add high-confidence AI signals
    aiSignals.forEach(signal => {
      if (signal.confidence >= 80) {
        combinedReason.push(signal.reasoning);
        if (signal.signal === combinedType) {
          combinedStrength = Math.min(combinedStrength + 10, 100); // Boost if aligned
        }
      }
    });

    return {
      type: combinedType,
      strength: Math.round(combinedStrength),
      reason: combinedReason.join(' | ') || 'Market analysis',
      indicators: technicalSignal.indicators
    };
  }

  private async executeTrade(signal: TradingSignal, currentPrice: number): Promise<void> {
    if (!this.settings) return;

    const positionSize = parseFloat(this.settings.currentPositionSize);
    const amount = positionSize / currentPrice; // Convert USD to BTC amount
    
    try {
      let orderResult;
      let entryPrice = currentPrice;

      if (signal.type === 'BUY') {
        orderResult = await krakenAPI.placeBuyOrder(amount, currentPrice);
        entryPrice = orderResult.price;
      } else {
        orderResult = await krakenAPI.placeSellOrder(amount, currentPrice);
        entryPrice = orderResult.price;
      }

      // Calculate stop loss and take profit
      const takeProfitPercent = parseFloat(this.settings.takeProfitPercent) / 100;
      const stopLossPercent = parseFloat(this.settings.stopLossPercent) / 100;

      let takeProfit, stopLoss;
      if (signal.type === 'BUY') {
        takeProfit = entryPrice * (1 + takeProfitPercent);
        stopLoss = entryPrice * (1 - stopLossPercent);
      } else {
        takeProfit = entryPrice * (1 - takeProfitPercent);
        stopLoss = entryPrice * (1 + stopLossPercent);
      }

      // Create trade record
      const trade = await storage.createTrade({
        type: signal.type,
        amount: amount.toString(),
        price: entryPrice.toString(),
        positionSize: positionSize.toString(),
        entryPrice: entryPrice.toString(),
        signal: signal.reason,
        status: 'OPEN'
      });

      // Update current position
      this.state.currentPosition = {
        isOpen: true,
        type: signal.type,
        amount: positionSize, // USD amount
        entryPrice,
        currentPrice,
        pnl: 0,
        duration: 0,
        stopLoss,
        takeProfit
      };

      this.state.performance.lastTradeTime = Date.now();
      this.state.performance.tradesThisHour++;

      this.emit('trade:executed', {
        trade,
        signal,
        position: this.state.currentPosition,
        timestamp: Date.now()
      });

      console.log(`Trade executed: ${signal.type} $${positionSize} at $${entryPrice}`);

    } catch (error) {
      console.error('Failed to execute trade:', error);
      this.emit('error', { message: 'Trade execution failed', error });
    }
  }

  private async checkExitConditions(currentPrice: number): Promise<void> {
    if (!this.state.currentPosition?.isOpen) return;

    const position = this.state.currentPosition;
    let shouldExit = false;
    let exitReason = '';

    // Check take profit
    if (position.type === 'BUY' && currentPrice >= position.takeProfit) {
      shouldExit = true;
      exitReason = 'Take Profit Hit';
    } else if (position.type === 'SELL' && currentPrice <= position.takeProfit) {
      shouldExit = true;
      exitReason = 'Take Profit Hit';
    }

    // Check stop loss
    if (position.type === 'BUY' && currentPrice <= position.stopLoss) {
      shouldExit = true;
      exitReason = 'Stop Loss Triggered';
    } else if (position.type === 'SELL' && currentPrice >= position.stopLoss) {
      shouldExit = true;
      exitReason = 'Stop Loss Triggered';
    }

    if (shouldExit) {
      await this.closePosition(currentPrice, exitReason);
    }
  }

  private async closePosition(exitPrice: number, reason: string): Promise<void> {
    if (!this.state.currentPosition?.isOpen || !this.settings) return;

    const position = this.state.currentPosition;
    const amount = position.amount / position.entryPrice; // Convert back to BTC amount
    
    try {
      let orderResult;
      if (position.type === 'BUY') {
        orderResult = await krakenAPI.placeSellOrder(amount, exitPrice);
      } else {
        orderResult = await krakenAPI.placeBuyOrder(amount, exitPrice);
      }

      const profit = position.pnl;
      const isWinning = profit > 0;

      // Update trade record
      const recentTrades = await storage.getTrades(1);
      if (recentTrades.length > 0) {
        await storage.updateTrade(recentTrades[0].id, {
          exitPrice: exitPrice.toString(),
          profit: profit.toString(),
          status: 'CLOSED'
        });
      }

      // Update performance metrics
      this.state.performance.totalTrades++;
      if (isWinning) {
        this.state.performance.winningTrades++;
        this.state.performance.consecutiveWins++;
        this.state.performance.consecutiveLosses = 0;
      } else {
        this.state.performance.consecutiveLosses++;
        this.state.performance.consecutiveWins = 0;
      }

      this.state.performance.winRate = (this.state.performance.winningTrades / this.state.performance.totalTrades) * 100;
      this.state.performance.profitToday += profit;

      // Check for scaling
      await this.checkScaling(isWinning);

      // Update bot settings
      await storage.updateBotSettings({
        totalTrades: this.state.performance.totalTrades,
        winningTrades: this.state.performance.winningTrades,
        consecutiveWins: this.state.performance.consecutiveWins,
        consecutiveLosses: this.state.performance.consecutiveLosses,
        portfolioValue: (parseFloat(this.settings.portfolioValue) + profit).toString()
      });

      // Close position
      this.state.currentPosition = null;

      this.emit('trade:closed', {
        exitPrice,
        profit,
        reason,
        isWinning,
        performance: this.state.performance,
        timestamp: Date.now()
      });

      console.log(`Position closed: ${reason}, P&L: $${profit.toFixed(2)}`);

    } catch (error) {
      console.error('Failed to close position:', error);
      this.emit('error', { message: 'Failed to close position', error });
    }
  }

  private async checkScaling(isWinning: boolean): Promise<void> {
    if (!this.settings) return;

    if (isWinning) {
      // Check for rapid scaling (3 consecutive wins)
      if (this.state.performance.consecutiveWins >= 3) {
        const currentSize = parseFloat(this.settings.currentPositionSize);
        const maxSize = parseFloat(this.settings.maxPositionSize);
        
        if (currentSize < maxSize) {
          let newSize = currentSize * 2; // Double position size
          
          // Check for hot streak bonus (5 consecutive wins = 3x size)
          if (this.state.performance.consecutiveWins >= 5) {
            newSize = currentSize * 3;
          }
          
          newSize = Math.min(newSize, maxSize);
          
          await storage.updateBotSettings({
            currentPositionSize: newSize.toString()
          });

          this.settings.currentPositionSize = newSize.toString();
          this.updateScalingTier();

          this.emit('scaling:updated', {
            oldSize: currentSize,
            newSize,
            reason: this.state.performance.consecutiveWins >= 5 ? 'Hot Streak Bonus' : 'Rapid Scaling',
            consecutiveWins: this.state.performance.consecutiveWins,
            timestamp: Date.now()
          });

          console.log(`Position scaled up: $${currentSize} → $${newSize}`);
        }
      }
    } else {
      // Emergency scale down after 2 consecutive losses
      if (this.state.performance.consecutiveLosses >= 2) {
        const currentSize = parseFloat(this.settings.currentPositionSize);
        const newSize = Math.max(currentSize / 2, 1); // Halve position size, minimum $1
        
        await storage.updateBotSettings({
          currentPositionSize: newSize.toString()
        });

        this.settings.currentPositionSize = newSize.toString();
        this.updateScalingTier();

        this.emit('scaling:updated', {
          oldSize: currentSize,
          newSize,
          reason: 'Emergency Scale Down',
          consecutiveLosses: this.state.performance.consecutiveLosses,
          timestamp: Date.now()
        });

        console.log(`Position scaled down: $${currentSize} → $${newSize}`);
      }
    }
  }

  private updateScalingTier(): void {
    if (!this.settings) return;

    const currentSize = parseFloat(this.settings.currentPositionSize);
    
    let tier = 1;
    let nextTarget = 3;
    
    if (currentSize >= 500) {
      tier = 6;
      nextTarget = 0; // Max tier
    } else if (currentSize >= 100) {
      tier = 5;
      nextTarget = Math.ceil((500 - currentSize) / 100) * 3;
    } else if (currentSize >= 50) {
      tier = 4;
      nextTarget = Math.ceil((100 - currentSize) / 50) * 3;
    } else if (currentSize >= 25) {
      tier = 3;
      nextTarget = Math.ceil((50 - currentSize) / 25) * 3;
    } else if (currentSize >= 5) {
      tier = 2;
      nextTarget = Math.ceil((25 - currentSize) / 20) * 3;
    }

    this.state.scaling = {
      currentTier: tier,
      nextScaleTarget: nextTarget,
      progressToNext: this.state.performance.consecutiveWins
    };
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.state.isActive = true;
    await storage.updateBotSettings({ isActive: true });

    this.emit('bot:started', { timestamp: Date.now() });
    console.log('Trading bot started');
  }

  async stop(): Promise<void> {
    this.state.isActive = false;
    await storage.updateBotSettings({ isActive: false });

    // Close any open positions
    if (this.state.currentPosition?.isOpen) {
      const currentPrice = this.priceHistory[this.priceHistory.length - 1];
      await this.closePosition(currentPrice, 'Bot Stopped');
    }

    this.emit('bot:stopped', { timestamp: Date.now() });
    console.log('Trading bot stopped');
  }

  async emergencyStop(): Promise<void> {
    console.log('EMERGENCY STOP triggered');
    
    this.state.isActive = false;
    await storage.updateBotSettings({ isActive: false });

    // Immediately close any open positions
    if (this.state.currentPosition?.isOpen) {
      const currentPrice = this.priceHistory[this.priceHistory.length - 1];
      await this.closePosition(currentPrice, 'Emergency Stop');
    }

    this.emit('bot:emergency_stop', { timestamp: Date.now() });
    console.log('Emergency stop completed');
  }

  getState(): BotState {
    return this.state;
  }

  async forceSignal(type: 'BUY' | 'SELL'): Promise<void> {
    if (this.state.currentPosition?.isOpen) {
      throw new Error('Cannot force signal while position is open');
    }

    const currentPrice = this.priceHistory[this.priceHistory.length - 1];
    const signal: TradingSignal = {
      type,
      strength: 100,
      reason: 'Manual Signal',
      indicators: TechnicalAnalysis.calculateIndicators(this.priceHistory)
    };

    await this.executeTrade(signal, currentPrice);
  }
}

export const tradingBot = new TradingBot();
