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

  // AI Management endpoints
  app.get('/api/ai/ghost', async (req, res) => {
    try {
      const ghostAI = {
        id: 'ghost-ai-001',
        name: 'Ghost AI Master Controller',
        status: 'online',
        permissions: ['APPROVE_WITHDRAWALS', 'MODIFY_MINING_RIGS', 'EMERGENCY_STOP'],
        decisions: {
          total: 1247,
          approved: 1186,
          rejected: 61,
          pending: 3
        },
        config: {
          approvalThreshold: 85,
          autoApprove: false,
          securityLevel: 'high',
          monitoringEnabled: true
        },
        lastActive: new Date().toISOString()
      };
      res.json(ghostAI);
    } catch (error) {
      console.error('Error fetching Ghost AI data:', error);
      res.status(500).json({ error: 'Failed to fetch Ghost AI data' });
    }
  });

  app.get('/api/ai/ghost/approvals', async (req, res) => {
    try {
      const approvals = [
        {
          id: 'approval-1',
          type: 'withdrawal',
          description: 'BTC withdrawal of 0.5 BTC to external wallet',
          priority: 'medium',
          createdAt: new Date().toISOString()
        },
        {
          id: 'approval-2', 
          type: 'mining',
          description: 'Auto-switch to higher profitability pool',
          priority: 'low',
          createdAt: new Date().toISOString()
        }
      ];
      res.json(approvals);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({ error: 'Failed to fetch pending approvals' });
    }
  });

  app.post('/api/ai/ghost/update', async (req, res) => {
    try {
      res.json({ success: true, message: 'Ghost AI updated successfully' });
    } catch (error) {
      console.error('Error updating Ghost AI:', error);
      res.status(500).json({ error: 'Failed to update Ghost AI' });
    }
  });

  app.post('/api/ai/ghost/approve', async (req, res) => {
    try {
      const { id, action, reason } = req.body;
      res.json({ success: true, message: `Request ${action}ed successfully` });
    } catch (error) {
      console.error('Error processing approval:', error);
      res.status(500).json({ error: 'Failed to process approval' });
    }
  });

  // Mining Rigs endpoints
  app.get('/api/mining/rigs', async (req, res) => {
    try {
      const rigNames = [
        'TERACORE7', 'TERAALPHA7', 'TERAOMEGA7', 'TERANODE7', 'TERAOPTIMUS7',
        'TERAJUSTICE7', 'TERAANNHARRIS7', 'TERA-ZIG-MINER7', 'TERAELITE7', 'TERAPOWER7',
        'TERASUPREME7', 'TERAMAX7', 'TERAULTIMATE7', 'TERAPRIME7', 'TERABOOST7',
        'TERAFORCE7', 'TERAENERGY7', 'TERASPEED7', 'TERASTRONG7', 'TERABEAST7',
        'TERATITAN7', 'TERAGIANT7', 'TERALIGHTNING7', 'TERATHUNDER7', 'TERASTORM7'
      ];

      const rigs = rigNames.map((name, index) => ({
        id: `rig-${index + 1}`,
        name,
        type: 'bitcoin',
        hashrate: parseFloat((100 + Math.random() * 50).toFixed(2)),
        powerDraw: Math.floor(3000 + Math.random() * 1000),
        temperature: Math.floor(60 + Math.random() * 15),
        status: ['online', 'offline', 'maintenance'][Math.floor(Math.random() * 3)],
        efficiency: parseFloat((85 + Math.random() * 15).toFixed(2)),
        dailyRevenue: parseFloat((40 + Math.random() * 30).toFixed(2)),
        location: `KLOUDBUGS Data Center ${String.fromCharCode(65 + Math.floor(index / 5))}`,
        poolId: 'pool-1',
        hardware: ['ASIC S19 Pro', 'ASIC S17+', 'Custom ASIC'][Math.floor(Math.random() * 3)],
        autoConfig: Math.random() > 0.3,
        lastUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }));

      res.json(rigs);
    } catch (error) {
      console.error('Error fetching mining rigs:', error);
      res.status(500).json({ error: 'Failed to fetch mining rigs' });
    }
  });

  app.post('/api/mining/rigs/:rigId/control', async (req, res) => {
    try {
      const { rigId } = req.params;
      const { action } = req.body;
      res.json({ success: true, message: `Rig ${rigId} ${action} command executed` });
    } catch (error) {
      console.error('Error controlling rig:', error);
      res.status(500).json({ error: 'Failed to control rig' });
    }
  });

  app.put('/api/mining/rigs/:rigId', async (req, res) => {
    try {
      const { rigId } = req.params;
      res.json({ success: true, message: `Rig ${rigId} updated successfully` });
    } catch (error) {
      console.error('Error updating rig:', error);
      res.status(500).json({ error: 'Failed to update rig' });
    }
  });

  app.post('/api/mining/rigs', async (req, res) => {
    try {
      const rigData = req.body;
      const newRig = {
        id: `rig-${Date.now()}`,
        ...rigData,
        status: 'offline',
        createdAt: new Date().toISOString()
      };
      res.json(newRig);
    } catch (error) {
      console.error('Error adding rig:', error);
      res.status(500).json({ error: 'Failed to add rig' });
    }
  });

  app.delete('/api/mining/rigs/:rigId', async (req, res) => {
    try {
      const { rigId } = req.params;
      res.json({ success: true, message: `Rig ${rigId} deleted successfully` });
    } catch (error) {
      console.error('Error deleting rig:', error);
      res.status(500).json({ error: 'Failed to delete rig' });
    }
  });

  // Mining Pools endpoints
  app.get('/api/pools', async (req, res) => {
    try {
      const pools = [
        {
          id: 'pool-1',
          name: 'KLOUDBUGSCAFE POOL',
          url: 'stratum+tcp://kloudbugscafe.pool:4444',
          status: 'connected',
          hashRate: 450.5,
          address: 'bc1qj93mnxgm0xuwyh3jvvqurjxjyq8uktg4y0sad6',
          username: 'Kloudbugs7',
          managed: true,
          fees: 1.5,
          connectedRigs: 12,
          teraTokenSupport: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'pool-2',
          name: 'TERA SOCIAL JUSTICE POOL',
          url: 'stratum+tcp://terasocial.pool:3333',
          status: 'connected',
          hashRate: 380.2,
          address: 'bc1qfavnkrku005m4kdkvdtgthur4ha06us2lppdps',
          username: 'Kloudbugs7',
          managed: true,
          fees: 0.5,
          connectedRigs: 13,
          teraTokenSupport: true,
          createdAt: new Date().toISOString()
        }
      ];
      res.json(pools);
    } catch (error) {
      console.error('Error fetching pools:', error);
      res.status(500).json({ error: 'Failed to fetch pools' });
    }
  });

  app.post('/api/pools', async (req, res) => {
    try {
      const poolData = req.body;
      const newPool = {
        id: `pool-${Date.now()}`,
        ...poolData,
        status: 'disconnected',
        hashRate: 0,
        connectedRigs: 0,
        managed: true,
        createdAt: new Date().toISOString()
      };
      res.json(newPool);
    } catch (error) {
      console.error('Error adding pool:', error);
      res.status(500).json({ error: 'Failed to add pool' });
    }
  });

  app.put('/api/pools/:poolId', async (req, res) => {
    try {
      const { poolId } = req.params;
      res.json({ success: true, message: `Pool ${poolId} updated successfully` });
    } catch (error) {
      console.error('Error updating pool:', error);
      res.status(500).json({ error: 'Failed to update pool' });
    }
  });

  app.delete('/api/pools/:poolId', async (req, res) => {
    try {
      const { poolId } = req.params;
      res.json({ success: true, message: `Pool ${poolId} deleted successfully` });
    } catch (error) {
      console.error('Error deleting pool:', error);
      res.status(500).json({ error: 'Failed to delete pool' });
    }
  });

  app.post('/api/pools/:poolId/config', async (req, res) => {
    try {
      const { poolId } = req.params;
      res.json({ success: true, message: `Pool ${poolId} configuration uploaded successfully` });
    } catch (error) {
      console.error('Error uploading pool config:', error);
      res.status(500).json({ error: 'Failed to upload pool configuration' });
    }
  });

  // TERA Token endpoints
  app.get('/api/tera/tokens', async (req, res) => {
    try {
      const teraTokens = {
        id: 'tera-1',
        walletAddress: '0x742d35Cc6634C0532925a3b8D6A5C8C7E1234567',
        balance: 125000.50,
        stakingBalance: 50000.00,
        totalEarned: 175000.50,
        socialContribution: 52500.15,
        lastTransaction: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      res.json(teraTokens);
    } catch (error) {
      console.error('Error fetching TERA tokens:', error);
      res.status(500).json({ error: 'Failed to fetch TERA tokens' });
    }
  });

  // Withdrawals endpoints
  app.get('/api/withdrawals', async (req, res) => {
    try {
      const withdrawals = [
        {
          id: 'withdrawal-1',
          tokenType: 'BTC',
          amount: 0.025,
          toAddress: 'bc1qj93mnxgm0xuwyh3jvvqurjxjyq8uktg4y0sad6',
          status: 'completed',
          txHash: '1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 82800000).toISOString()
        }
      ];
      res.json(withdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
  });

  app.post('/api/withdrawals', async (req, res) => {
    try {
      const { tokenType, amount, toAddress } = req.body;
      const withdrawal = {
        id: `withdrawal-${Date.now()}`,
        tokenType,
        amount,
        toAddress,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      res.json(withdrawal);
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      res.status(500).json({ error: 'Failed to create withdrawal' });
    }
  });

  // Crypto Portfolio endpoints
  app.get('/api/crypto/portfolio', async (req, res) => {
    try {
      const portfolio = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          balance: 0.15423,
          value: 6632.99,
          change24h: 2.45,
          source: 'mining',
          availableForTrading: 0.15423,
          locked: 0
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: 2.8945,
          value: 7238.75,
          change24h: -1.23,
          source: 'mining',
          availableForTrading: 2.8945,
          locked: 0
        },
        {
          symbol: 'TERA',
          name: 'TERA Token',
          balance: 125000.50,
          value: 62500.25,
          change24h: 8.75,
          source: 'tera',
          availableForTrading: 75000.00,
          locked: 50000.50
        },
        {
          symbol: 'LTC',
          name: 'Litecoin',
          balance: 12.456,
          value: 1089.45,
          change24h: 0.89,
          source: 'mining',
          availableForTrading: 12.456,
          locked: 0
        }
      ];
      res.json(portfolio);
    } catch (error) {
      console.error('Error fetching crypto portfolio:', error);
      res.status(500).json({ error: 'Failed to fetch crypto portfolio' });
    }
  });

  app.get('/api/trading/status', async (req, res) => {
    try {
      const status = {
        activeTrades: 2,
        totalProfit: 1245.67,
        successRate: 78.5,
        runningStrategies: {
          'BTC': { status: 'active', profit: 423.12, trades: 15 },
          'ETH': { status: 'active', profit: 822.55, trades: 23 }
        }
      };
      res.json(status);
    } catch (error) {
      console.error('Error fetching trading status:', error);
      res.status(500).json({ error: 'Failed to fetch trading status' });
    }
  });

  app.post('/api/trading/start', async (req, res) => {
    try {
      const { symbol, config } = req.body;
      // Mock starting trading
      res.json({ 
        success: true, 
        message: `Trading started for ${symbol}`,
        tradingId: `trade-${Date.now()}`
      });
    } catch (error) {
      console.error('Error starting trading:', error);
      res.status(500).json({ error: 'Failed to start trading' });
    }
  });

  app.put('/api/trading/config', async (req, res) => {
    try {
      const { symbol, config } = req.body;
      // Mock updating trading config
      res.json({ 
        success: true, 
        message: `Trading config updated for ${symbol}`
      });
    } catch (error) {
      console.error('Error updating trading config:', error);
      res.status(500).json({ error: 'Failed to update trading config' });
    }
  });

  // TERJustice AI endpoints
  app.get('/api/terajustice/cases', async (req, res) => {
    try {
      const cases = [
        {
          id: 'case-1',
          title: 'Community Housing Rights vs. Developer Corp',
          caseType: 'Civil Rights',
          status: 'active',
          priority: 'high',
          description: 'Community organization fighting against unfair housing development that displaces low-income families.',
          parties: {
            plaintiff: 'Community Housing Rights Coalition',
            defendant: 'Mega Developer Corp',
            witnesses: ['Jane Smith (Community Leader)', 'Dr. Robert Johnson (Urban Planning Expert)']
          },
          evidence: [
            {
              id: 'ev-1',
              type: 'document',
              title: 'Original Zoning Agreement',
              description: 'Document showing original community protection clauses',
              source: 'City Planning Department',
              relevanceScore: 95,
              verificationStatus: 'verified',
              uploadedAt: '2024-01-15T10:00:00Z'
            }
          ],
          timeline: [
            {
              id: 'tl-1',
              date: '2023-12-01',
              event: 'Developer announced project',
              source: 'Public Notice',
              importance: 'high'
            }
          ],
          aiAnalysis: {
            strengthScore: 78,
            weaknesses: [
              'Limited financial resources for extended litigation',
              'Developer has significant legal team'
            ],
            recommendations: [
              'Focus on community impact evidence',
              'Seek pro bono legal support',
              'Build media awareness campaign'
            ],
            precedents: [
              {
                id: 'prec-1',
                caseName: 'Citizens vs. Metro Development',
                year: 2019,
                court: 'State Supreme Court',
                relevanceScore: 89,
                outcome: 'Favorable for community',
                keyPoints: ['Community rights prioritized', 'Developer compensation required']
              }
            ],
            riskAssessment: 'Moderate risk with strong community evidence.',
            outcomeProjection: {
              favorableChance: 72,
              neutralChance: 18,
              unfavorableChance: 10
            }
          },
          researchResults: [
            {
              id: 'res-1',
              query: 'community housing rights precedents',
              source: 'Legal Database Search',
              findings: 'Found 23 similar cases with 68% favorable outcomes when strong community evidence is present.',
              relevanceScore: 92,
              timestamp: '2024-01-17T09:15:00Z'
            }
          ],
          createdAt: '2024-01-15T08:00:00Z',
          updatedAt: '2024-01-17T16:45:00Z'
        },
        {
          id: 'case-2',
          title: 'Workers Rights vs. Manufacturing Inc',
          caseType: 'Employment',
          status: 'under_review',
          priority: 'medium',
          description: 'Class action lawsuit regarding unsafe working conditions and wage violations.',
          parties: {
            plaintiff: 'Factory Workers Union Local 405',
            defendant: 'Manufacturing Inc',
            witnesses: ['Maria Rodriguez (Safety Inspector)', 'James Wilson (Former Supervisor)']
          },
          evidence: [],
          timeline: [],
          aiAnalysis: {
            strengthScore: 65,
            weaknesses: ['Some documentation missing', 'Corporate legal resources'],
            recommendations: ['Gather more safety violation evidence', 'Document wage discrepancies'],
            precedents: [],
            riskAssessment: 'Moderate risk case requiring more evidence.',
            outcomeProjection: {
              favorableChance: 60,
              neutralChance: 25,
              unfavorableChance: 15
            }
          },
          researchResults: [],
          createdAt: '2024-01-20T10:00:00Z',
          updatedAt: '2024-01-21T14:30:00Z'
        }
      ];
      res.json(cases);
    } catch (error) {
      console.error('Error fetching TERJustice cases:', error);
      res.status(500).json({ error: 'Failed to fetch cases' });
    }
  });

  app.get('/api/terajustice/cases/:caseId', async (req, res) => {
    try {
      const { caseId } = req.params;
      // Return detailed case information
      res.json({ message: `Case ${caseId} details would be returned here` });
    } catch (error) {
      console.error('Error fetching case details:', error);
      res.status(500).json({ error: 'Failed to fetch case details' });
    }
  });

  app.post('/api/terajustice/cases', async (req, res) => {
    try {
      const caseData = req.body;
      const newCase = {
        id: `case-${Date.now()}`,
        ...caseData,
        status: 'under_review',
        priority: 'medium',
        parties: {
          plaintiff: caseData.plaintiff,
          defendant: caseData.defendant,
          witnesses: []
        },
        evidence: [],
        timeline: [
          {
            id: `tl-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            event: 'Case created and submitted for AI analysis',
            source: 'TERJustice AI System',
            importance: 'high'
          }
        ],
        aiAnalysis: {
          strengthScore: Math.floor(Math.random() * 40) + 50,
          weaknesses: ['Initial analysis pending', 'More evidence needed'],
          recommendations: ['Gather supporting documentation', 'Identify key witnesses'],
          precedents: [],
          riskAssessment: 'Initial assessment in progress.',
          outcomeProjection: {
            favorableChance: 50,
            neutralChance: 30,
            unfavorableChance: 20
          }
        },
        researchResults: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      res.json(newCase);
    } catch (error) {
      console.error('Error creating case:', error);
      res.status(500).json({ error: 'Failed to create case' });
    }
  });

  app.post('/api/terajustice/research', async (req, res) => {
    try {
      const { caseId, query } = req.body;
      const newResearch = {
        id: `res-${Date.now()}`,
        query,
        source: 'AI Legal Research Engine',
        findings: `AI research completed for "${query}". Found relevant precedents and legal frameworks. Analysis shows strong correlation with similar cases in jurisdiction.`,
        relevanceScore: Math.floor(Math.random() * 30) + 70,
        timestamp: new Date().toISOString()
      };
      res.json(newResearch);
    } catch (error) {
      console.error('Error conducting research:', error);
      res.status(500).json({ error: 'Failed to conduct research' });
    }
  });

  app.post('/api/terajustice/evidence', async (req, res) => {
    try {
      const { caseId, evidence } = req.body;
      const newEvidence = {
        id: `ev-${Date.now()}`,
        ...evidence,
        relevanceScore: Math.floor(Math.random() * 30) + 70,
        verificationStatus: 'pending',
        uploadedAt: new Date().toISOString()
      };
      res.json(newEvidence);
    } catch (error) {
      console.error('Error uploading evidence:', error);
      res.status(500).json({ error: 'Failed to upload evidence' });
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

  // Cafe API endpoints
  app.get('/api/cafe/menu', (req, res) => {
    res.json([
      {
        id: 'coffee-1',
        name: 'KLOUD Espresso',
        description: 'Signature dark roast blend with cosmic energy',
        price: 4.50,
        category: 'coffee',
        available: true,
        rating: 4.8,
        orders: 1247
      },
      {
        id: 'coffee-2',
        name: 'TERA Latte',
        description: 'Smooth latte with justice-inspired foam art',
        price: 5.25,
        category: 'coffee',
        available: true,
        rating: 4.9,
        orders: 892
      }
    ]);
  });

  app.get('/api/cafe/orders', (req, res) => {
    res.json([
      {
        id: 'order-1',
        items: [{ name: 'KLOUD Espresso', quantity: 2 }],
        total: 9.00,
        status: 'preparing',
        customerName: 'Alex',
        orderTime: '09:15 AM',
        estimatedReady: '09:25 AM'
      }
    ]);
  });

  app.get('/api/cafe/events', (req, res) => {
    res.json([
      {
        id: 'event-1',
        title: 'Crypto Trading Workshop',
        description: 'Learn advanced trading strategies with KLOUD BOT PRO',
        date: '2024-02-15',
        time: '2:00 PM',
        capacity: 25,
        registered: 18,
        type: 'workshop'
      }
    ]);
  });

  // TERA Token API endpoints
  app.get('/api/tera/metrics', (req, res) => {
    res.json({
      totalSupply: 1000000000,
      circulatingSupply: 750000000,
      lockedTokens: 200000000,
      price: 0.52,
      marketCap: 390000000,
      volume24h: 15678900,
      holders: 45678,
      burnedTokens: 50000000
    });
  });

  app.get('/api/tera/transactions', (req, res) => {
    res.json([
      {
        id: 'tx-1',
        type: 'transfer',
        amount: 1000,
        from: '0x742d35Cc...C4de',
        to: '0x8ba1f109...B29e',
        timestamp: '2024-01-17T10:30:00Z',
        txHash: '0x123...abc',
        status: 'confirmed'
      }
    ]);
  });

  app.get('/api/tera/staking', (req, res) => {
    res.json([
      {
        id: 'pool-1',
        name: 'Justice Impact Pool',
        apr: 15.5,
        lockPeriod: 90,
        totalStaked: 45000000,
        maxStake: 100000,
        minStake: 100,
        rewards: 156789,
        participants: 1247
      }
    ]);
  });

  app.get('/api/tera/governance', (req, res) => {
    res.json([
      {
        id: 'prop-1',
        title: 'Increase Community Development Fund',
        description: 'Proposal to allocate additional 5M TERA tokens to community development initiatives',
        proposer: '0x742d35Cc...C4de',
        status: 'active',
        votesFor: 15678900,
        votesAgainst: 3456789,
        totalVotes: 19135689,
        endDate: '2024-02-15T23:59:59Z',
        category: 'treasury'
      }
    ]);
  });

  // Platform API endpoints
  app.get('/api/platform/services', (req, res) => {
    res.json([
      {
        id: 'trading-api',
        name: 'Trading API',
        status: 'running',
        type: 'api',
        version: '2.1.4',
        uptime: 99.8,
        cpu: 35,
        memory: 512,
        requests: 15678,
        errors: 12,
        endpoint: '/api/trading',
        description: 'Core trading functionality and market data'
      },
      {
        id: 'terajustice-ai',
        name: 'TERJustice AI Engine',
        status: 'running',
        type: 'ai',
        version: '3.0.1',
        uptime: 98.5,
        cpu: 65,
        memory: 1024,
        requests: 4567,
        errors: 8,
        endpoint: '/api/terajustice',
        description: 'Legal research and case analysis AI'
      }
    ]);
  });

  app.get('/api/platform/integrations', (req, res) => {
    res.json([
      {
        id: 'external-exchange',
        name: 'External Exchange Connector',
        type: 'external',
        status: 'active',
        endpoints: ['/api/external/binance', '/api/external/coinbase'],
        dependencies: ['trading-api'],
        config: { 
          apiKeys: 'configured',
          rateLimit: '1000/min',
          timeout: '30s'
        }
      }
    ]);
  });

  app.get('/api/platform/deployments', (req, res) => {
    res.json([
      {
        id: 'prod-config',
        name: 'Production Environment',
        environment: 'production',
        replicas: 3,
        resources: {
          cpu: '2 cores',
          memory: '4 GB',
          storage: '100 GB'
        },
        scaling: {
          min: 2,
          max: 10,
          targetCpu: 70
        }
      }
    ]);
  });

  // Admin Journal API endpoints
  app.get('/api/admin/journal', (req, res) => {
    res.json([
      {
        id: 'entry-1',
        title: 'Tera4-24-72 Justice ai-/KLOUD BUGS Platform Launch Preparation',
        content: 'Major milestone reached with full platform integration...',
        category: 'achievements',
        priority: 'high',
        status: 'published',
        tags: ['launch', 'integration', 'milestone'],
        author: 'System Admin',
        createdAt: '2024-02-03T20:15:00Z',
        updatedAt: '2024-02-03T21:00:00Z'
      }
    ]);
  });

  app.get('/api/admin/tasks', (req, res) => {
    res.json([
      {
        id: 'task-1',
        title: 'Implement Folder-Based App Integration',
        description: 'Build system to automatically scan folders and integrate external applications',
        category: 'feature',
        status: 'pending',
        priority: 'high',
        assignedTo: 'Next Agent',
        dueDate: '2024-02-10',
        progress: 0,
        dependencies: ['platform-management-complete']
      }
    ]);
  });

  app.get('/api/admin/metrics', (req, res) => {
    res.json([
      { name: 'Platform Uptime', value: '99.7%', status: 'good', lastUpdated: '2024-02-03T21:00:00Z', trend: 'stable' },
      { name: 'Active Services', value: 6, status: 'good', lastUpdated: '2024-02-03T21:00:00Z', trend: 'stable' },
      { name: 'Memory Usage', value: '67%', status: 'warning', lastUpdated: '2024-02-03T21:00:00Z', trend: 'up' }
    ]);
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
