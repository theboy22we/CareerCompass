export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
}

export interface TradingSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  strength: number; // 0-100
  reason: string;
  indicators: TechnicalIndicators;
}

export class TechnicalAnalysis {
  // Calculate Simple Moving Average
  static sma(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  // Calculate Exponential Moving Average
  static ema(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // Calculate RSI (Relative Strength Index)
  static rsi(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Calculate MACD
  static macd(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.ema(prices, 12);
    const ema26 = this.ema(prices, 26);
    const macdLine = ema12 - ema26;
    
    // For signal line, we need MACD values over time
    // Simplified calculation for single point
    const signal = macdLine * 0.1; // Simplified signal line
    const histogram = macdLine - signal;
    
    return {
      macd: macdLine,
      signal: signal,
      histogram: histogram
    };
  }

  // Calculate Bollinger Bands
  static bollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const middle = this.sma(prices, period);
    
    if (prices.length < period) {
      return { upper: middle, middle, lower: middle };
    }
    
    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => {
      return sum + Math.pow(price - middle, 2);
    }, 0) / period;
    
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: middle + (standardDeviation * stdDev),
      middle: middle,
      lower: middle - (standardDeviation * stdDev)
    };
  }

  // Generate comprehensive technical indicators
  static calculateIndicators(prices: number[]): TechnicalIndicators {
    return {
      rsi: this.rsi(prices, 14),
      macd: this.macd(prices),
      sma20: this.sma(prices, 20),
      sma50: this.sma(prices, 50),
      ema12: this.ema(prices, 12),
      ema26: this.ema(prices, 26),
      bollinger: this.bollingerBands(prices, 20, 2)
    };
  }

  // Generate trading signals based on technical analysis
  static generateSignal(prices: number[], volume?: number[]): TradingSignal {
    const indicators = this.calculateIndicators(prices);
    const currentPrice = prices[prices.length - 1];
    
    let signalType: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let strength = 0;
    let reasons: string[] = [];

    // RSI Analysis
    if (indicators.rsi < 30) {
      signalType = 'BUY';
      strength += 30;
      reasons.push('RSI Oversold');
    } else if (indicators.rsi > 70) {
      signalType = 'SELL';
      strength += 30;
      reasons.push('RSI Overbought');
    }

    // MACD Analysis
    if (indicators.macd.macd > indicators.macd.signal && indicators.macd.histogram > 0) {
      if (signalType !== 'SELL') {
        signalType = 'BUY';
        strength += 25;
        reasons.push('MACD Bullish Crossover');
      }
    } else if (indicators.macd.macd < indicators.macd.signal && indicators.macd.histogram < 0) {
      if (signalType !== 'BUY') {
        signalType = 'SELL';
        strength += 25;
        reasons.push('MACD Bearish Crossover');
      }
    }

    // Moving Average Analysis
    if (currentPrice > indicators.sma20 && indicators.sma20 > indicators.sma50) {
      if (signalType !== 'SELL') {
        signalType = 'BUY';
        strength += 20;
        reasons.push('Price Above MA20 & MA50');
      }
    } else if (currentPrice < indicators.sma20 && indicators.sma20 < indicators.sma50) {
      if (signalType !== 'BUY') {
        signalType = 'SELL';
        strength += 20;
        reasons.push('Price Below MA20 & MA50');
      }
    }

    // Bollinger Bands Analysis
    if (currentPrice < indicators.bollinger.lower) {
      if (signalType !== 'SELL') {
        signalType = 'BUY';
        strength += 15;
        reasons.push('Price Below Lower Bollinger Band');
      }
    } else if (currentPrice > indicators.bollinger.upper) {
      if (signalType !== 'BUY') {
        signalType = 'SELL';
        strength += 15;
        reasons.push('Price Above Upper Bollinger Band');
      }
    }

    // Volume confirmation (if available)
    if (volume && volume.length >= 2) {
      const recentVolume = volume[volume.length - 1];
      const avgVolume = volume.slice(-10).reduce((a, b) => a + b, 0) / Math.min(volume.length, 10);
      
      if (recentVolume > avgVolume * 1.5) {
        strength += 10;
        reasons.push('High Volume Confirmation');
      }
    }

    // Ensure strength doesn't exceed 100
    strength = Math.min(strength, 100);

    // Require minimum strength for signals
    if (strength < 40) {
      signalType = 'HOLD';
    }

    return {
      type: signalType,
      strength,
      reason: reasons.join(', ') || 'Neutral Market Conditions',
      indicators
    };
  }
}
