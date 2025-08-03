import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'custom';
  model: string;
  type: 'prediction' | 'analysis' | 'sentiment' | 'strategy';
  active: boolean;
  confidence: number;
  lastUsed: Date;
  endpoint?: string; // For custom AI models
  apiKey?: string; // For custom AI models
  headers?: Record<string, string>; // Custom headers
}

interface CustomAIProvider {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  headers?: Record<string, string>;
  models: string[];
}

interface PredictionResult {
  model: string;
  prediction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  timeframe: string;
  targetPrice?: number;
  stopLoss?: number;
}

interface AnalysisResult {
  model: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  keyFactors: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  marketRegime: string;
}

class AIManager {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private models: AIModel[] = [];
  private customProviders: CustomAIProvider[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    // Define available AI models (including placeholders for custom models)
    this.models = [
      // Built-in model slots (inactive by default)
      {
        id: 'gpt4-predictor',
        name: 'GPT-4o Market Predictor',
        provider: 'openai',
        model: 'gpt-4o',
        type: 'prediction',
        active: false,
        confidence: 0,
        lastUsed: new Date()
      },
      {
        id: 'claude-strategist',
        name: 'Claude Sonnet 4.0 Trading Strategist',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        type: 'strategy',
        active: false,
        confidence: 0,
        lastUsed: new Date()
      },
      // Custom AI model slots ready for your models
      {
        id: 'custom-predictor-1',
        name: 'Your Custom Predictor Model',
        provider: 'custom',
        model: 'your-model-v1',
        type: 'prediction',
        active: false,
        confidence: 0,
        lastUsed: new Date(),
        endpoint: '', // Will be set when you add your model
        apiKey: ''
      },
      {
        id: 'custom-analyst-1',
        name: 'Your Custom Analysis Model',
        provider: 'custom',
        model: 'your-analyst-v1',
        type: 'analysis',
        active: false,
        confidence: 0,
        lastUsed: new Date(),
        endpoint: '',
        apiKey: ''
      },
      {
        id: 'custom-strategy-1',
        name: 'Your Custom Strategy Model',
        provider: 'custom',
        model: 'your-strategy-v1',
        type: 'strategy',
        active: false,
        confidence: 0,
        lastUsed: new Date(),
        endpoint: '',
        apiKey: ''
      }
    ];
  }

  async initialize() {
    if (this.isInitialized) return;

    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      // Activate OpenAI models
      this.models.forEach(model => {
        if (model.provider === 'openai') {
          model.active = true;
        }
      });
      
      console.log('✅ OpenAI models activated');
    }

    // Initialize Anthropic if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      
      // Activate Anthropic models
      this.models.forEach(model => {
        if (model.provider === 'anthropic') {
          model.active = true;
        }
      });
      
      console.log('✅ Anthropic models activated');
    }

    this.isInitialized = true;
    console.log(`🤖 AI Manager initialized with ${this.getActiveModels().length} active models`);
  }

  getActiveModels(): AIModel[] {
    return this.models.filter(model => model.active);
  }

  getAllModels(): AIModel[] {
    return [...this.models];
  }

  // Add custom AI provider
  addCustomProvider(provider: CustomAIProvider) {
    this.customProviders.push(provider);
    console.log(`✅ Added custom AI provider: ${provider.name}`);
  }

  // Add or update custom AI model
  addCustomModel(modelConfig: {
    id: string;
    name: string;
    endpoint: string;
    apiKey: string;
    modelName: string;
    type: 'prediction' | 'analysis' | 'sentiment' | 'strategy';
    headers?: Record<string, string>;
  }) {
    const existingIndex = this.models.findIndex(m => m.id === modelConfig.id);
    
    const customModel: AIModel = {
      id: modelConfig.id,
      name: modelConfig.name,
      provider: 'custom',
      model: modelConfig.modelName,
      type: modelConfig.type,
      active: true, // Activate immediately when added
      confidence: 0,
      lastUsed: new Date(),
      endpoint: modelConfig.endpoint,
      apiKey: modelConfig.apiKey,
      headers: modelConfig.headers || {}
    };

    if (existingIndex >= 0) {
      this.models[existingIndex] = customModel;
      console.log(`🔄 Updated custom AI model: ${modelConfig.name}`);
    } else {
      this.models.push(customModel);
      console.log(`✅ Added new custom AI model: ${modelConfig.name}`);
    }
  }

  async generatePrediction(marketData: any, indicators: any): Promise<PredictionResult[]> {
    const results: PredictionResult[] = [];
    const predictionModels = this.models.filter(m => m.active && m.type === 'prediction');

    for (const model of predictionModels) {
      try {
        let result: PredictionResult;

        if (model.provider === 'openai' && this.openai) {
          result = await this.getOpenAIPrediction(model, marketData, indicators);
        } else if (model.provider === 'anthropic' && this.anthropic) {
          result = await this.getAnthropicPrediction(model, marketData, indicators);
        } else if (model.provider === 'custom' && model.endpoint) {
          result = await this.getCustomPrediction(model, marketData, indicators);
        } else {
          continue;
        }

        results.push(result);
        model.lastUsed = new Date();
        model.confidence = result.confidence;
      } catch (error) {
        console.error(`Error with ${model.name}:`, error);
      }
    }

    return results;
  }

  private async getOpenAIPrediction(model: AIModel, marketData: any, indicators: any): Promise<PredictionResult> {
    const prompt = `As an expert cryptocurrency trading AI, analyze the following Bitcoin market data and provide a trading prediction:

Current Price: $${marketData?.price || 43000}
24h Change: ${marketData?.changePercent24h || 0}%
RSI: ${indicators?.rsi || 50}
MACD: ${indicators?.macd || 0}
Bollinger Bands: Upper ${indicators?.bollinger?.upper || 0}, Lower ${indicators?.bollinger?.lower || 0}

Based on this data, provide a JSON response with:
- prediction: "BUY", "SELL", or "HOLD"
- confidence: number between 0-100
- reasoning: detailed explanation
- timeframe: expected duration
- targetPrice: optional target price
- stopLoss: optional stop loss price`;

    const response = await this.openai!.chat.completions.create({
      model: model.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      model: model.name,
      prediction: result.prediction || 'HOLD',
      confidence: Math.min(100, Math.max(0, result.confidence || 50)),
      reasoning: result.reasoning || 'Analysis based on current market conditions',
      timeframe: result.timeframe || '1-4 hours',
      targetPrice: result.targetPrice,
      stopLoss: result.stopLoss
    };
  }

  private async getAnthropicPrediction(model: AIModel, marketData: any, indicators: any): Promise<PredictionResult> {
    const prompt = `As an expert cryptocurrency trading strategist, analyze this Bitcoin market data:

Current Price: $${marketData?.price || 43000}
24h Change: ${marketData?.changePercent24h || 0}%
Technical Indicators:
- RSI: ${indicators?.rsi || 50}
- MACD: ${indicators?.macd || 0}
- Bollinger Bands: Upper ${indicators?.bollinger?.upper || 0}, Lower ${indicators?.bollinger?.lower || 0}

Provide a JSON response with your trading recommendation including prediction, confidence (0-100), detailed reasoning, timeframe, and optional target/stop prices.`;

    const response = await this.anthropic!.messages.create({
      model: model.model,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
      system: 'You are a professional cryptocurrency trading AI. Always respond with valid JSON format.'
    });

    const result = JSON.parse(response.content[0].text);
    
    return {
      model: model.name,
      prediction: result.prediction || 'HOLD',
      confidence: Math.min(100, Math.max(0, result.confidence || 50)),
      reasoning: result.reasoning || 'Strategic analysis based on market conditions',
      timeframe: result.timeframe || '2-6 hours',
      targetPrice: result.targetPrice,
      stopLoss: result.stopLoss
    };
  }

  async analyzeMarket(marketData: any, indicators: any): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const analysisModels = this.models.filter(m => m.active && (m.type === 'analysis' || m.type === 'sentiment'));

    for (const model of analysisModels) {
      try {
        let result: AnalysisResult;

        if (model.provider === 'openai' && this.openai) {
          result = await this.getOpenAIAnalysis(model, marketData, indicators);
        } else if (model.provider === 'anthropic' && this.anthropic) {
          result = await this.getAnthropicAnalysis(model, marketData, indicators);
        } else if (model.provider === 'custom' && model.endpoint) {
          result = await this.getCustomAnalysis(model, marketData, indicators);
        } else {
          continue;
        }

        results.push(result);
        model.lastUsed = new Date();
      } catch (error) {
        console.error(`Error with ${model.name}:`, error);
      }
    }

    return results;
  }

  private async getOpenAIAnalysis(model: AIModel, marketData: any, indicators: any): Promise<AnalysisResult> {
    const prompt = `Analyze the current Bitcoin market sentiment and conditions:

Market Data:
- Price: $${marketData?.price || 43000}
- 24h Volume: ${marketData?.volume24h || 0}
- 24h Change: ${marketData?.changePercent24h || 0}%

Technical Indicators:
- RSI: ${indicators?.rsi || 50}
- MACD: ${indicators?.macd || 0}
- Moving Averages: SMA20: ${indicators?.sma20 || 0}, EMA50: ${indicators?.ema50 || 0}

Provide JSON response with sentiment analysis, market regime detection, key factors, and risk assessment.`;

    const response = await this.openai!.chat.completions.create({
      model: model.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 400
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      model: model.name,
      sentiment: result.sentiment || 'NEUTRAL',
      score: Math.min(100, Math.max(-100, result.score || 0)),
      keyFactors: result.keyFactors || ['Market analysis pending'],
      riskLevel: result.riskLevel || 'MEDIUM',
      marketRegime: result.marketRegime || 'Ranging'
    };
  }

  private async getAnthropicAnalysis(model: AIModel, marketData: any, indicators: any): Promise<AnalysisResult> {
    const prompt = `Perform comprehensive Bitcoin market analysis:

Current Market State:
- Price: $${marketData?.price || 43000}
- Volume: ${marketData?.volume24h || 0}
- Price Change: ${marketData?.changePercent24h || 0}%

Technical Analysis:
- RSI: ${indicators?.rsi || 50}
- MACD: ${indicators?.macd || 0}
- Trend indicators and moving averages

Provide detailed JSON analysis including overall sentiment, market score, key driving factors, risk assessment, and current market regime classification.`;

    const response = await this.anthropic!.messages.create({
      model: model.model,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
      system: 'You are a professional market analyst AI. Always respond with valid JSON containing sentiment analysis.'
    });

    const result = JSON.parse(response.content[0].text);
    
    return {
      model: model.name,
      sentiment: result.sentiment || 'NEUTRAL',
      score: Math.min(100, Math.max(-100, result.score || 0)),
      keyFactors: result.keyFactors || ['Comprehensive analysis in progress'],
      riskLevel: result.riskLevel || 'MEDIUM',
      marketRegime: result.marketRegime || 'Consolidation'
    };
  }

  async generateStrategy(marketConditions: any): Promise<any[]> {
    const results: any[] = [];
    const strategyModels = this.models.filter(m => m.active && m.type === 'strategy');

    for (const model of strategyModels) {
      try {
        let strategy;

        if (model.provider === 'openai' && this.openai) {
          strategy = await this.getOpenAIStrategy(model, marketConditions);
        } else if (model.provider === 'anthropic' && this.anthropic) {
          strategy = await this.getAnthropicStrategy(model, marketConditions);
        } else if (model.provider === 'custom' && model.endpoint) {
          strategy = await this.getCustomStrategy(model, marketConditions);
        } else {
          continue;
        }

        results.push({ model: model.name, strategy });
        model.lastUsed = new Date();
      } catch (error) {
        console.error(`Error with ${model.name}:`, error);
      }
    }

    return results;
  }

  private async getOpenAIStrategy(model: AIModel, conditions: any): Promise<any> {
    const response = await this.openai!.chat.completions.create({
      model: model.model,
      messages: [{
        role: 'user',
        content: `Generate a Bitcoin trading strategy for current market conditions: ${JSON.stringify(conditions)}. Provide JSON with entry/exit rules, risk management, and position sizing.`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 600
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private async getAnthropicStrategy(model: AIModel, conditions: any): Promise<any> {
    const response = await this.anthropic!.messages.create({
      model: model.model,
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Create a comprehensive Bitcoin trading strategy based on: ${JSON.stringify(conditions)}. Include entry signals, exit conditions, risk management rules, and position sizing recommendations. Respond in JSON format.`
      }],
      system: 'You are an expert algorithmic trading strategist. Always provide detailed, actionable strategies in JSON format.'
    });

    return JSON.parse(response.content[0].text);
  }

  // Custom AI model interaction methods
  private async getCustomPrediction(model: AIModel, marketData: any, indicators: any): Promise<PredictionResult> {
    const payload = {
      type: 'prediction',
      marketData: {
        price: marketData?.price || 43000,
        change24h: marketData?.changePercent24h || 0,
        volume: marketData?.volume24h || 0
      },
      indicators: {
        rsi: indicators?.rsi || 50,
        macd: indicators?.macd || 0,
        bollinger: indicators?.bollinger || { upper: 0, lower: 0 }
      }
    };

    const response = await fetch(model.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`,
        ...model.headers
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Custom AI model API error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      model: model.name,
      prediction: result.prediction || 'HOLD',
      confidence: Math.min(100, Math.max(0, result.confidence || 50)),
      reasoning: result.reasoning || 'Custom AI analysis',
      timeframe: result.timeframe || '1-4 hours',
      targetPrice: result.targetPrice,
      stopLoss: result.stopLoss
    };
  }

  private async getCustomAnalysis(model: AIModel, marketData: any, indicators: any): Promise<AnalysisResult> {
    const payload = {
      type: 'analysis',
      marketData: {
        price: marketData?.price || 43000,
        change24h: marketData?.changePercent24h || 0,
        volume: marketData?.volume24h || 0
      },
      indicators: {
        rsi: indicators?.rsi || 50,
        macd: indicators?.macd || 0,
        sma20: indicators?.sma20 || 0,
        ema50: indicators?.ema50 || 0
      }
    };

    const response = await fetch(model.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`,
        ...model.headers
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Custom AI model API error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      model: model.name,
      sentiment: result.sentiment || 'NEUTRAL',
      score: Math.min(100, Math.max(-100, result.score || 0)),
      keyFactors: result.keyFactors || ['Custom analysis pending'],
      riskLevel: result.riskLevel || 'MEDIUM',
      marketRegime: result.marketRegime || 'Custom regime'
    };
  }

  private async getCustomStrategy(model: AIModel, conditions: any): Promise<any> {
    const response = await fetch(model.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`,
        ...model.headers
      },
      body: JSON.stringify({ type: 'strategy', conditions })
    });

    if (!response.ok) {
      throw new Error(`Custom AI model API error: ${response.status}`);
    }

    return await response.json();
  }

  getModelStats() {
    return {
      total: this.models.length,
      active: this.models.filter(m => m.active).length,
      byProvider: {
        openai: this.models.filter(m => m.provider === 'openai' && m.active).length,
        anthropic: this.models.filter(m => m.provider === 'anthropic' && m.active).length,
        custom: this.models.filter(m => m.provider === 'custom' && m.active).length
      },
      byType: {
        prediction: this.models.filter(m => m.type === 'prediction' && m.active).length,
        analysis: this.models.filter(m => m.type === 'analysis' && m.active).length,
        sentiment: this.models.filter(m => m.type === 'sentiment' && m.active).length,
        strategy: this.models.filter(m => m.type === 'strategy' && m.active).length
      }
    };
  }

  // Get custom providers
  getCustomProviders(): CustomAIProvider[] {
    return [...this.customProviders];
  }

  // Remove custom model
  removeCustomModel(modelId: string): boolean {
    const index = this.models.findIndex(m => m.id === modelId && m.provider === 'custom');
    if (index >= 0) {
      this.models.splice(index, 1);
      console.log(`🗑️ Removed custom AI model: ${modelId}`);
      return true;
    }
    return false;
  }
}

export const aiManager = new AIManager();