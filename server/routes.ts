import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { tradingBot } from "./trading-bot";
import { krakenAPI } from "./kraken-api";
import { TechnicalAnalysis } from "./technical-indicators";
import { mlPredictor } from "./ml-predictor";
import { AdvancedAnalytics } from "./advanced-analytics";
import { portfolioManager } from "./portfolio-manager";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    clients.add(ws);

    // Send initial bot state
    ws.send(JSON.stringify({
      type: 'bot:state',
      data: tradingBot.getState(),
      timestamp: Date.now()
    }));

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast function for real-time updates
  function broadcast(type: string, data: any) {
    const message = JSON.stringify({
      type,
      data,
      timestamp: Date.now()
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Subscribe to trading bot events
  tradingBot.subscribe((event: string, data: any) => {
    broadcast(event, data);
  });

  // API Routes

  // Get current bot status and state
  app.get('/api/bot/status', async (req, res) => {
    try {
      const state = tradingBot.getState();
      const settings = await storage.getBotSettings();
      
      res.json({
        state,
        settings
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get bot status' });
    }
  });

  // Start trading bot
  app.post('/api/bot/start', async (req, res) => {
    try {
      await tradingBot.start();
      res.json({ message: 'Trading bot started successfully' });
    } catch (error) {
      console.error('Failed to start bot:', error);
      res.status(500).json({ error: 'Failed to start trading bot' });
    }
  });

  // Stop trading bot
  app.post('/api/bot/stop', async (req, res) => {
    try {
      await tradingBot.stop();
      res.json({ message: 'Trading bot stopped successfully' });
    } catch (error) {
      console.error('Failed to stop bot:', error);
      res.status(500).json({ error: 'Failed to stop trading bot' });
    }
  });

  // Emergency stop
  app.post('/api/bot/emergency-stop', async (req, res) => {
    try {
      await tradingBot.emergencyStop();
      res.json({ message: 'Emergency stop executed' });
    } catch (error) {
      console.error('Failed to execute emergency stop:', error);
      res.status(500).json({ error: 'Failed to execute emergency stop' });
    }
  });

  // Force buy/sell signal
  app.post('/api/bot/force-signal', async (req, res) => {
    try {
      const { type } = req.body;
      
      if (type !== 'BUY' && type !== 'SELL') {
        return res.status(400).json({ error: 'Invalid signal type. Must be BUY or SELL' });
      }

      await tradingBot.forceSignal(type);
      res.json({ message: `Force ${type} signal executed` });
    } catch (error) {
      console.error('Failed to force signal:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to force signal' });
    }
  });

  // Get recent trades
  app.get('/api/trades', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const trades = await storage.getTrades(limit);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trades' });
    }
  });

  // Get trading performance
  app.get('/api/performance', async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      const trades = await storage.getTrades(100);
      
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const tradesLast24h = trades.filter(t => t.timestamp >= oneDayAgo);
      const tradesLastHour = trades.filter(t => t.timestamp >= oneHourAgo);
      
      const profitLast24h = tradesLast24h
        .filter(t => t.profit && t.status === 'CLOSED')
        .reduce((sum, t) => sum + parseFloat(t.profit || '0'), 0);
      
      const profitLastHour = tradesLastHour
        .filter(t => t.profit && t.status === 'CLOSED')
        .reduce((sum, t) => sum + parseFloat(t.profit || '0'), 0);

      res.json({
        totalTrades: settings.totalTrades,
        winningTrades: settings.winningTrades,
        winRate: settings.totalTrades > 0 ? (settings.winningTrades / settings.totalTrades) * 100 : 0,
        consecutiveWins: settings.consecutiveWins,
        consecutiveLosses: settings.consecutiveLosses,
        portfolioValue: parseFloat(settings.portfolioValue),
        profitLast24h,
        profitLastHour,
        tradesLast24h: tradesLast24h.length,
        tradesLastHour: tradesLastHour.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch performance data' });
    }
  });

  // Get current Bitcoin price and market data
  app.get('/api/market/ticker', async (req, res) => {
    try {
      const ticker = await krakenAPI.getTicker();
      res.json(ticker);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch market data' });
    }
  });

  // Get OHLC price data
  app.get('/api/market/ohlc', async (req, res) => {
    try {
      const interval = parseInt(req.query.interval as string) || 1;
      const ohlcData = await krakenAPI.getOHLCData('XBTUSD', interval);
      res.json(ohlcData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch OHLC data' });
    }
  });

  // Get technical indicators
  app.get('/api/market/indicators', async (req, res) => {
    try {
      const ohlcData = await krakenAPI.getOHLCData();
      const prices = ohlcData.map(d => d.close);
      const volumes = ohlcData.map(d => d.volume);
      
      const indicators = TechnicalAnalysis.calculateIndicators(prices);
      const signal = TechnicalAnalysis.generateSignal(prices, volumes);
      
      res.json({
        indicators,
        signal,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate indicators' });
    }
  });

  // Update bot settings
  app.put('/api/bot/settings', async (req, res) => {
    try {
      const {
        maxPositionSize,
        takeProfitPercent,
        stopLossPercent
      } = req.body;

      const updates: any = {};
      
      if (maxPositionSize !== undefined) {
        updates.maxPositionSize = maxPositionSize.toString();
      }
      if (takeProfitPercent !== undefined) {
        updates.takeProfitPercent = takeProfitPercent.toString();
      }
      if (stopLossPercent !== undefined) {
        updates.stopLossPercent = stopLossPercent.toString();
      }

      const updatedSettings = await storage.updateBotSettings(updates);
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update bot settings' });
    }
  });

  // Get AI price prediction
  app.get('/api/ai/prediction', async (req, res) => {
    try {
      const ohlcData = await krakenAPI.getOHLCData();
      const prices = ohlcData.map(d => d.close);
      const volumes = ohlcData.map(d => d.volume);
      
      const prediction = await mlPredictor.predictPrice(prices, volumes, 15);
      const aiSignals = await mlPredictor.getHighConfidenceSignals(prices, volumes);
      const accuracyStats = mlPredictor.getAccuracyStats();
      
      res.json({
        prediction,
        aiSignals,
        accuracy: accuracyStats,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate AI prediction' });
    }
  });

  // Enable/disable auto-trading
  app.post('/api/bot/auto-trade', async (req, res) => {
    try {
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled must be a boolean' });
      }

      // Update bot settings to enable/disable auto-trading
      await storage.updateBotSettings({
        isActive: enabled
      });

      if (enabled) {
        await tradingBot.start();
      } else {
        await tradingBot.stop();
      }

      res.json({ 
        message: `Auto-trading ${enabled ? 'enabled' : 'disabled'}`,
        autoTrading: enabled
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle auto-trading' });
    }
  });

  // Get learning progress and pattern analysis
  app.get('/api/ai/learning', async (req, res) => {
    try {
      const accuracyStats = mlPredictor.getAccuracyStats();
      res.json(accuracyStats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get learning statistics' });
    }
  });

  // Real-time alerts endpoint
  app.get('/api/alerts/settings', async (req, res) => {
    try {
      // Return current alert settings
      res.json({
        priceAlerts: true,
        signalAlerts: true,
        tradeAlerts: true,
        aiPredictionAlerts: true,
        minConfidence: 75,
        soundEnabled: true
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get alert settings' });
    }
  });

  // Advanced market analytics
  app.get('/api/analytics/market-sentiment', async (req, res) => {
    try {
      const ohlcData = await krakenAPI.getOHLCData();
      const prices = ohlcData.map(d => d.close);
      const volumes = ohlcData.map(d => d.volume);
      const indicators = TechnicalAnalysis.calculateIndicators(prices);
      
      const sentiment = AdvancedAnalytics.calculateMarketSentiment(prices, volumes, indicators);
      const volumeProfile = AdvancedAnalytics.analyzeVolumeProfile(volumes);
      const marketRegime = AdvancedAnalytics.detectMarketRegime(prices);
      
      res.json({
        sentiment,
        volumeProfile,
        marketRegime,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate market sentiment' });
    }
  });

  // Portfolio analytics
  app.get('/api/analytics/portfolio', async (req, res) => {
    try {
      const portfolio = await portfolioManager.getPortfolioSummary();
      const performance = await portfolioManager.analyzePerformance();
      
      res.json({
        portfolio,
        performance,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get portfolio analytics' });
    }
  });

  // Risk metrics
  app.get('/api/analytics/risk', async (req, res) => {
    try {
      const ohlcData = await krakenAPI.getOHLCData();
      const prices = ohlcData.map(d => d.close);
      const trades = await storage.getTrades();
      
      const riskMetrics = AdvancedAnalytics.calculateRiskMetrics(prices, trades);
      
      res.json({
        riskMetrics,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate risk metrics' });
    }
  });

  // Support and resistance levels
  app.get('/api/analytics/levels', async (req, res) => {
    try {
      const ohlcData = await krakenAPI.getOHLCData();
      const prices = ohlcData.map(d => d.close);
      
      const levels = advancedAnalytics.findSupportResistance(prices);
      const fibonacci = advancedAnalytics.calculateFibonacci(
        Math.max(...prices.slice(-50)),
        Math.min(...prices.slice(-50))
      );
      
      res.json({
        supportResistance: levels,
        fibonacci,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate support/resistance levels' });
    }
  });

  // Initialize trading bot on server start
  tradingBot.initialize().catch(error => {
    console.error('Failed to initialize trading bot:', error);
  });

  return httpServer;
}
