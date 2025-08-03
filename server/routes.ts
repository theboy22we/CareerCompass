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
import { aiManager } from "./ai-manager";
import { socialTokenManager } from "./social-token-manager";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket server with stability improvements
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    perMessageDeflate: false,
    clientTracking: true
  });

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

    // Set up heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(heartbeat);
        clients.delete(ws);
      }
    }, 45000); // Increased to 45 seconds to reduce overhead

    ws.on('pong', () => {
      // Connection is alive
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      clients.delete(ws);
      clearInterval(heartbeat);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
      clearInterval(heartbeat);
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

  // Get current price and market data for any trading pair
  app.get('/api/market/ticker/:pair?', async (req, res) => {
    try {
      const pair = req.params.pair || 'XBTUSD';
      const ticker = await krakenAPI.getTicker(pair);
      res.json(ticker);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch market data' });
    }
  });

  // Get OHLC price data for any trading pair
  app.get('/api/market/ohlc/:pair?', async (req, res) => {
    try {
      const pair = req.params.pair || 'XBTUSD';
      const interval = parseInt(req.query.interval as string) || 1;
      const ohlcData = await krakenAPI.getOHLCData(pair, interval);
      res.json(ohlcData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch OHLC data' });
    }
  });

  // Get supported trading pairs
  app.get('/api/market/pairs', async (req, res) => {
    try {
      const supportedPairs = [
        { 
          symbol: 'BTC', 
          name: 'Bitcoin', 
          krakenPair: 'XBTUSD',
          price: 43000,
          change24h: 2.5,
          status: 'active'
        },
        { 
          symbol: 'ETH', 
          name: 'Ethereum', 
          krakenPair: 'ETHUSD',
          price: 2500,
          change24h: 1.8,
          status: 'active'
        },
        { 
          symbol: 'ADA', 
          name: 'Cardano', 
          krakenPair: 'ADAUSD',
          price: 0.45,
          change24h: -0.5,
          status: 'active'
        },
        { 
          symbol: 'SOL', 
          name: 'Solana', 
          krakenPair: 'SOLUSD',
          price: 95,
          change24h: 3.2,
          status: 'active'
        },
        { 
          symbol: 'DOT', 
          name: 'Polkadot', 
          krakenPair: 'DOTUSD',
          price: 6.5,
          change24h: 1.1,
          status: 'active'
        },
        { 
          symbol: 'LINK', 
          name: 'Chainlink', 
          krakenPair: 'LINKUSD',
          price: 14.5,
          change24h: 0.8,
          status: 'active'
        }
      ];
      res.json(supportedPairs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch supported pairs' });
    }
  });

  // Get technical indicators for any trading pair
  app.get('/api/market/indicators/:pair?', async (req, res) => {
    try {
      const pair = req.params.pair || 'XBTUSD';
      const ohlcData = await krakenAPI.getOHLCData(pair);
      const prices = ohlcData.map(d => d.close);
      const volumes = ohlcData.map(d => d.volume);
      
      const indicators = TechnicalAnalysis.calculateIndicators(prices);
      const signal = TechnicalAnalysis.generateSignal(prices, volumes);
      
      res.json({
        indicators,
        signal,
        pair,
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

  // AI Configuration endpoints
  app.get('/api/ai/config', async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      const config = {
        // Signal Generation
        signalConfidenceThreshold: settings.signalConfidenceThreshold || 70,
        technicalWeight: settings.technicalWeight || 40,
        aiWeight: settings.aiWeight || 60,
        sentimentWeight: settings.sentimentWeight || 20,
        volumeWeight: settings.volumeWeight || 15,
        
        // Risk Management
        maxPositionSize: settings.maxPositionSize || 25,
        stopLossPercentage: settings.stopLossPercentage || 3,
        takeProfitPercentage: settings.takeProfitPercentage || 6,
        maxDailyLoss: settings.maxDailyLoss || 500,
        maxConsecutiveLosses: settings.maxConsecutiveLosses || 3,
        
        // Pattern Recognition
        enablePatternLearning: settings.enablePatternLearning ?? true,
        minPatternOccurrences: settings.minPatternOccurrences || 5,
        patternSuccessThreshold: settings.patternSuccessThreshold || 65,
        adaptiveLearning: settings.adaptiveLearning ?? true,
        
        // Market Conditions
        enableBearMarketMode: settings.enableBearMarketMode ?? true,
        enableBullMarketMode: settings.enableBullMarketMode ?? true,
        volatilityAdjustment: settings.volatilityAdjustment ?? true,
        marketRegimeDetection: settings.marketRegimeDetection ?? true,
        
        // Advanced Features
        enableDynamicScaling: settings.enableDynamicScaling ?? true,
        scalingAggression: settings.scalingAggression || 50,
        enableEmergencyStop: settings.enableEmergencyStop ?? true,
        emergencyStopDrawdown: settings.emergencyStopDrawdown || 10,

        // Bot Identity
        botName: settings.botName || 'BitBot Pro',
        botPersonality: settings.botPersonality || 'professional',
      };
      
      res.json(config);
    } catch (error) {
      console.error('Error fetching AI config:', error);
      res.status(500).json({ error: 'Failed to fetch AI configuration' });
    }
  });

  app.put('/api/ai/config', async (req, res) => {
    try {
      const config = req.body;
      
      // Update bot settings with new configuration
      await storage.updateBotSettings({
        signalConfidenceThreshold: config.signalConfidenceThreshold,
        technicalWeight: config.technicalWeight,
        aiWeight: config.aiWeight,
        sentimentWeight: config.sentimentWeight,
        volumeWeight: config.volumeWeight,
        maxPositionSize: config.maxPositionSize,
        stopLossPercentage: config.stopLossPercentage,
        takeProfitPercentage: config.takeProfitPercentage,
        maxDailyLoss: config.maxDailyLoss,
        maxConsecutiveLosses: config.maxConsecutiveLosses,
        enablePatternLearning: config.enablePatternLearning,
        minPatternOccurrences: config.minPatternOccurrences,
        patternSuccessThreshold: config.patternSuccessThreshold,
        adaptiveLearning: config.adaptiveLearning,
        enableBearMarketMode: config.enableBearMarketMode,
        enableBullMarketMode: config.enableBullMarketMode,
        volatilityAdjustment: config.volatilityAdjustment,
        marketRegimeDetection: config.marketRegimeDetection,
        enableDynamicScaling: config.enableDynamicScaling,
        scalingAggression: config.scalingAggression,
        enableEmergencyStop: config.enableEmergencyStop,
        emergencyStopDrawdown: config.emergencyStopDrawdown,
        botName: config.botName,
        botPersonality: config.botPersonality,
      });

      res.json({ success: true, message: 'AI configuration updated successfully' });
    } catch (error) {
      console.error('Error updating AI config:', error);
      res.status(500).json({ error: 'Failed to update AI configuration' });
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
      
      const levels = AdvancedAnalytics.findSupportResistance(prices);
      const fibonacci = AdvancedAnalytics.calculateFibonacci(
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

  // AI Models Management Routes
  app.get('/api/ai/models', async (req, res) => {
    try {
      const models = aiManager.getAllModels();
      const stats = aiManager.getModelStats();
      
      res.json({
        models,
        stats,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get AI models' });
    }
  });

  // Get AI predictions from multiple models
  app.get('/api/ai/predictions', async (req, res) => {
    try {
      const ticker = await krakenAPI.getTicker();
      const ohlcData = await krakenAPI.getOHLCData();
      const prices = ohlcData.map(d => d.close);
      const indicators = TechnicalAnalysis.calculateIndicators(prices);
      
      const predictions = await aiManager.generatePrediction(ticker, indicators);
      
      res.json({
        predictions,
        timestamp: Date.now(),
        modelCount: predictions.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate AI predictions' });
    }
  });

  // Get AI market analysis from multiple models
  app.get('/api/ai/analysis', async (req, res) => {
    try {
      const ticker = await krakenAPI.getTicker();
      const ohlcData = await krakenAPI.getOHLCData();
      const prices = ohlcData.map(d => d.close);
      const indicators = TechnicalAnalysis.calculateIndicators(prices);
      
      const analysis = await aiManager.analyzeMarket(ticker, indicators);
      
      res.json({
        analysis,
        timestamp: Date.now(),
        modelCount: analysis.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate AI analysis' });
    }
  });

  // Generate trading strategies from AI models
  app.get('/api/ai/strategies', async (req, res) => {
    try {
      const ticker = await krakenAPI.getTicker();
      const ohlcData = await krakenAPI.getOHLCData();
      const prices = ohlcData.map(d => d.close);
      const indicators = TechnicalAnalysis.calculateIndicators(prices);
      
      const marketConditions = {
        price: ticker.price,
        trend: indicators.sma20 > indicators.sma50 ? 'UPTREND' : 'DOWNTREND',
        volatility: indicators.bollinger.width,
        momentum: indicators.rsi,
        volume: ticker.volume24h
      };
      
      const strategies = await aiManager.generateStrategy(marketConditions);
      
      res.json({
        strategies,
        marketConditions,
        timestamp: Date.now(),
        modelCount: strategies.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate AI strategies' });
    }
  });

  // Add custom AI model
  app.post('/api/ai/models', async (req, res) => {
    try {
      const modelConfig = req.body;
      
      // Validate required fields
      if (!modelConfig.id || !modelConfig.name || !modelConfig.endpoint || !modelConfig.modelName || !modelConfig.type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      aiManager.addCustomModel(modelConfig);
      
      res.json({
        success: true,
        message: `Custom AI model ${modelConfig.name} added successfully`,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add custom AI model' });
    }
  });

  // Remove custom AI model
  app.delete('/api/ai/models/:modelId', async (req, res) => {
    try {
      const { modelId } = req.params;
      const success = aiManager.removeCustomModel(modelId);
      
      if (success) {
        res.json({
          success: true,
          message: `Model ${modelId} removed successfully`,
          timestamp: Date.now()
        });
      } else {
        res.status(404).json({ error: 'Model not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove custom AI model' });
    }
  });

  // Test custom AI model connection
  app.post('/api/ai/models/:modelId/test', async (req, res) => {
    try {
      const { modelId } = req.params;
      const models = aiManager.getAllModels();
      const model = models.find(m => m.id === modelId);
      
      if (!model || model.provider !== 'custom') {
        return res.status(404).json({ error: 'Custom model not found' });
      }

      // Test with sample data
      const testPayload = {
        type: model.type,
        marketData: { price: 43000, change24h: 0, volume: 1000000 },
        indicators: { rsi: 50, macd: 0 }
      };

      const response = await fetch(model.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${model.apiKey}`,
          ...model.headers
        },
        body: JSON.stringify(testPayload)
      });

      const result = await response.json();
      
      res.json({
        success: response.ok,
        status: response.status,
        result: response.ok ? result : null,
        error: response.ok ? null : result.error,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message,
        timestamp: Date.now()
      });
    }
  });

  // Mining and Social Impact endpoints
  app.get('/api/mining/operations', async (req, res) => {
    try {
      const operations = socialTokenManager.getMiningOperations();
      const summary = socialTokenManager.getOperationalSummary();
      res.json({ operations, summary: summary.mining });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get mining operations' });
    }
  });

  app.get('/api/social/projects', async (req, res) => {
    try {
      const projects = socialTokenManager.getProjects();
      const summary = socialTokenManager.getSocialImpactSummary();
      res.json({ projects, summary });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get social projects' });
    }
  });

  app.get('/api/social/token-metrics', async (req, res) => {
    try {
      const metrics = socialTokenManager.getTokenMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get token metrics' });
    }
  });

  app.get('/api/operations/summary', async (req, res) => {
    try {
      const summary = socialTokenManager.getOperationalSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get operational summary' });
    }
  });

  // Initialize AI Manager and trading bot on server start
  aiManager.initialize().catch(error => {
    console.error('Failed to initialize AI Manager:', error);
  });
  
  tradingBot.initialize().catch(error => {
    console.error('Failed to initialize trading bot:', error);
  });

  return httpServer;
}
