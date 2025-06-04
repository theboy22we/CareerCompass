import { TechnicalAnalysis } from './technical-indicators';

export interface PredictionData {
  priceDirection: 'UP' | 'DOWN' | 'SIDEWAYS';
  confidence: number; // 0-100
  targetPrice: number;
  timeframe: number; // minutes
  probability: number; // 0-1
  reasoning: string[];
}

export interface PatternData {
  pattern: string;
  success_rate: number;
  avg_profit: number;
  frequency: number;
  last_seen: number;
}

export class MLPredictor {
  private patterns: Map<string, PatternData> = new Map();
  private learningHistory: any[] = [];
  private predictionAccuracy: number = 0;
  private totalPredictions: number = 0;
  private correctPredictions: number = 0;

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Initialize common trading patterns with historical success rates
    const commonPatterns = [
      { pattern: 'RSI_OVERSOLD_BULLISH', success_rate: 0.72, avg_profit: 0.008, frequency: 0.15 },
      { pattern: 'RSI_OVERBOUGHT_BEARISH', success_rate: 0.68, avg_profit: 0.006, frequency: 0.12 },
      { pattern: 'MACD_BULLISH_CROSS', success_rate: 0.65, avg_profit: 0.012, frequency: 0.20 },
      { pattern: 'MACD_BEARISH_CROSS', success_rate: 0.63, avg_profit: 0.009, frequency: 0.18 },
      { pattern: 'MA_GOLDEN_CROSS', success_rate: 0.78, avg_profit: 0.015, frequency: 0.08 },
      { pattern: 'MA_DEATH_CROSS', success_rate: 0.74, avg_profit: 0.011, frequency: 0.07 },
      { pattern: 'BOLLINGER_BOUNCE_UP', success_rate: 0.69, avg_profit: 0.007, frequency: 0.14 },
      { pattern: 'BOLLINGER_BOUNCE_DOWN', success_rate: 0.66, avg_profit: 0.005, frequency: 0.13 },
      { pattern: 'VOLUME_BREAKOUT', success_rate: 0.71, avg_profit: 0.018, frequency: 0.10 },
      { pattern: 'MOMENTUM_REVERSAL', success_rate: 0.64, avg_profit: 0.008, frequency: 0.16 }
    ];

    commonPatterns.forEach(p => {
      this.patterns.set(p.pattern, {
        ...p,
        last_seen: 0
      });
    });
  }

  async predictPrice(
    priceHistory: number[], 
    volumeHistory: number[], 
    timeframeMinutes: number = 15
  ): Promise<PredictionData> {
    const indicators = TechnicalAnalysis.calculateIndicators(priceHistory);
    const currentPrice = priceHistory[priceHistory.length - 1];
    
    // Detect current market patterns
    const detectedPatterns = this.detectPatterns(indicators, priceHistory, volumeHistory);
    
    // Calculate prediction based on pattern analysis
    const prediction = this.calculatePrediction(detectedPatterns, currentPrice, timeframeMinutes);
    
    // Store prediction for future learning
    this.learningHistory.push({
      timestamp: Date.now(),
      currentPrice,
      patterns: detectedPatterns,
      prediction,
      indicators
    });

    // Keep only last 1000 predictions for performance
    if (this.learningHistory.length > 1000) {
      this.learningHistory = this.learningHistory.slice(-1000);
    }

    return prediction;
  }

  private detectPatterns(
    indicators: any, 
    prices: number[], 
    volumes: number[]
  ): string[] {
    const patterns: string[] = [];
    const currentPrice = prices[prices.length - 1];
    const prevPrice = prices[prices.length - 2] || currentPrice;
    const avgVolume = volumes.slice(-10).reduce((a, b) => a + b, 0) / Math.min(volumes.length, 10);
    const currentVolume = volumes[volumes.length - 1] || 0;

    // RSI patterns
    if (indicators.rsi < 30) {
      patterns.push('RSI_OVERSOLD_BULLISH');
    } else if (indicators.rsi > 70) {
      patterns.push('RSI_OVERBOUGHT_BEARISH');
    }

    // MACD patterns
    if (indicators.macd.macd > indicators.macd.signal && indicators.macd.histogram > 0) {
      patterns.push('MACD_BULLISH_CROSS');
    } else if (indicators.macd.macd < indicators.macd.signal && indicators.macd.histogram < 0) {
      patterns.push('MACD_BEARISH_CROSS');
    }

    // Moving Average patterns
    if (indicators.sma20 > indicators.sma50 && prevPrice <= indicators.sma20 && currentPrice > indicators.sma20) {
      patterns.push('MA_GOLDEN_CROSS');
    } else if (indicators.sma20 < indicators.sma50 && prevPrice >= indicators.sma20 && currentPrice < indicators.sma20) {
      patterns.push('MA_DEATH_CROSS');
    }

    // Bollinger Bands patterns
    if (currentPrice <= indicators.bollinger.lower && prevPrice > indicators.bollinger.lower) {
      patterns.push('BOLLINGER_BOUNCE_UP');
    } else if (currentPrice >= indicators.bollinger.upper && prevPrice < indicators.bollinger.upper) {
      patterns.push('BOLLINGER_BOUNCE_DOWN');
    }

    // Volume patterns
    if (currentVolume > avgVolume * 1.5) {
      if (currentPrice > prevPrice) {
        patterns.push('VOLUME_BREAKOUT');
      } else {
        patterns.push('MOMENTUM_REVERSAL');
      }
    }

    return patterns;
  }

  private calculatePrediction(
    patterns: string[], 
    currentPrice: number, 
    timeframe: number
  ): PredictionData {
    if (patterns.length === 0) {
      return {
        priceDirection: 'SIDEWAYS',
        confidence: 40,
        targetPrice: currentPrice,
        timeframe,
        probability: 0.5,
        reasoning: ['No clear patterns detected']
      };
    }

    let bullishScore = 0;
    let bearishScore = 0;
    let totalWeight = 0;
    let expectedProfitPercent = 0;
    const reasoning: string[] = [];

    patterns.forEach(patternName => {
      const pattern = this.patterns.get(patternName);
      if (!pattern) return;

      const weight = pattern.success_rate * pattern.frequency;
      totalWeight += weight;

      if (this.isBullishPattern(patternName)) {
        bullishScore += weight;
        expectedProfitPercent += pattern.avg_profit * weight;
        reasoning.push(`${patternName}: ${(pattern.success_rate * 100).toFixed(1)}% success rate`);
      } else {
        bearishScore += weight;
        expectedProfitPercent += pattern.avg_profit * weight;
        reasoning.push(`${patternName}: ${(pattern.success_rate * 100).toFixed(1)}% success rate`);
      }

      // Update pattern last seen
      pattern.last_seen = Date.now();
    });

    const netScore = bullishScore - bearishScore;
    const confidence = Math.min(Math.abs(netScore) * 100 / Math.max(totalWeight, 0.1), 95);
    
    let direction: 'UP' | 'DOWN' | 'SIDEWAYS';
    let targetPrice: number;
    let probability: number;

    if (Math.abs(netScore) < totalWeight * 0.2) {
      direction = 'SIDEWAYS';
      targetPrice = currentPrice;
      probability = 0.5;
    } else if (netScore > 0) {
      direction = 'UP';
      targetPrice = currentPrice * (1 + expectedProfitPercent / totalWeight);
      probability = 0.5 + (confidence / 200);
    } else {
      direction = 'DOWN';
      targetPrice = currentPrice * (1 - expectedProfitPercent / totalWeight);
      probability = 0.5 + (confidence / 200);
    }

    return {
      priceDirection: direction,
      confidence: Math.round(confidence),
      targetPrice: Math.round(targetPrice),
      timeframe,
      probability: Math.min(Math.max(probability, 0.1), 0.9),
      reasoning
    };
  }

  private isBullishPattern(pattern: string): boolean {
    const bullishPatterns = [
      'RSI_OVERSOLD_BULLISH',
      'MACD_BULLISH_CROSS',
      'MA_GOLDEN_CROSS',
      'BOLLINGER_BOUNCE_UP',
      'VOLUME_BREAKOUT'
    ];
    return bullishPatterns.includes(pattern);
  }

  // Learning function to improve prediction accuracy
  async updatePredictionAccuracy(
    predictionId: string, 
    actualOutcome: 'CORRECT' | 'INCORRECT',
    actualPriceChange: number
  ): Promise<void> {
    this.totalPredictions++;
    
    if (actualOutcome === 'CORRECT') {
      this.correctPredictions++;
    }

    this.predictionAccuracy = this.correctPredictions / this.totalPredictions;

    // Update pattern success rates based on actual outcomes
    const relevantHistory = this.learningHistory.find(h => 
      h.timestamp > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    );

    if (relevantHistory) {
      relevantHistory.patterns.forEach((patternName: string) => {
        const pattern = this.patterns.get(patternName);
        if (pattern) {
          // Adaptive learning - adjust success rate based on recent performance
          const adjustment = actualOutcome === 'CORRECT' ? 0.01 : -0.01;
          pattern.success_rate = Math.max(0.1, Math.min(0.95, pattern.success_rate + adjustment));
          
          // Update average profit
          if (actualOutcome === 'CORRECT') {
            pattern.avg_profit = (pattern.avg_profit * 0.9) + (Math.abs(actualPriceChange) * 0.1);
          }
        }
      });
    }
  }

  getAccuracyStats(): { accuracy: number; totalPredictions: number; recentPerformance: any } {
    // Calculate recent performance (last 100 predictions)
    const recentHistory = this.learningHistory.slice(-100);
    const recentCorrect = recentHistory.filter(h => h.outcome === 'CORRECT').length;
    const recentAccuracy = recentHistory.length > 0 ? recentCorrect / recentHistory.length : 0;

    return {
      accuracy: this.predictionAccuracy,
      totalPredictions: this.totalPredictions,
      recentPerformance: {
        accuracy: recentAccuracy,
        predictions: recentHistory.length,
        patterns: Array.from(this.patterns.entries()).map(([name, data]) => ({
          name,
          success_rate: data.success_rate,
          frequency: data.frequency,
          avg_profit: data.avg_profit
        }))
      }
    };
  }

  // Get high-confidence trading signals
  async getHighConfidenceSignals(
    priceHistory: number[], 
    volumeHistory: number[]
  ): Promise<Array<{ signal: 'BUY' | 'SELL'; confidence: number; reasoning: string }>> {
    const prediction = await this.predictPrice(priceHistory, volumeHistory);
    const signals: Array<{ signal: 'BUY' | 'SELL'; confidence: number; reasoning: string }> = [];

    // Only generate signals for high-confidence predictions
    if (prediction.confidence >= 75) {
      if (prediction.priceDirection === 'UP') {
        signals.push({
          signal: 'BUY',
          confidence: prediction.confidence,
          reasoning: `AI Prediction: ${prediction.confidence}% confidence for upward movement to $${prediction.targetPrice.toLocaleString()}`
        });
      } else if (prediction.priceDirection === 'DOWN') {
        signals.push({
          signal: 'SELL',
          confidence: prediction.confidence,
          reasoning: `AI Prediction: ${prediction.confidence}% confidence for downward movement to $${prediction.targetPrice.toLocaleString()}`
        });
      }
    }

    return signals;
  }
}

export const mlPredictor = new MLPredictor();