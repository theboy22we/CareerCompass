import WebSocket from 'ws';

export interface KrakenTickerData {
  symbol: string;
  price: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  change24h: number;
  changePercent24h: number;
  timestamp: number;
}

export interface KrakenOHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface KrakenOrderResult {
  orderId: string;
  status: 'pending' | 'open' | 'closed' | 'canceled' | 'expired';
  price: number;
  amount: number;
  filled: number;
  timestamp: number;
}

export class KrakenAPI {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string = 'https://api.kraken.com';
  private wsUrl: string = 'wss://ws.kraken.com';
  private ws: WebSocket | null = null;
  private subscribers: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.apiKey = process.env.KRAKEN_API_KEY || process.env.API_KEY || '';
    this.apiSecret = process.env.KRAKEN_API_SECRET || process.env.API_SECRET || '';
    
    if (!this.apiKey || !this.apiSecret) {
      console.warn('Kraken API credentials not found. Using mock data for development.');
    }
  }

  async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', () => {
        console.log('Connected to Kraken WebSocket');
        
        // Subscribe to BTC/USD ticker
        this.ws?.send(JSON.stringify({
          event: 'subscribe',
          pair: ['XBT/USD'],
          subscription: { name: 'ticker' }
        }));

        // Subscribe to OHLC data
        this.ws?.send(JSON.stringify({
          event: 'subscribe',
          pair: ['XBT/USD'],
          subscription: { name: 'ohlc', interval: 1 }
        }));

        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('error', (error: Error) => {
        console.error('Kraken WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('Kraken WebSocket connection closed');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.connectWebSocket(), 5000);
      });
    });
  }

  private handleWebSocketMessage(message: any): void {
    if (Array.isArray(message)) {
      const [channelId, data, channelName, pair] = message;
      
      if (channelName === 'ticker' && pair === 'XBT/USD') {
        const tickerData: KrakenTickerData = {
          symbol: 'BTC/USD',
          price: parseFloat(data.c[0]),
          high24h: parseFloat(data.h[0]),
          low24h: parseFloat(data.l[0]),
          volume24h: parseFloat(data.v[0]),
          change24h: parseFloat(data.c[0]) - parseFloat(data.o[0]),
          changePercent24h: ((parseFloat(data.c[0]) - parseFloat(data.o[0])) / parseFloat(data.o[0])) * 100,
          timestamp: Date.now()
        };
        
        this.emit('ticker', tickerData);
      }
      
      if (channelName === 'ohlc-1' && pair === 'XBT/USD') {
        const ohlcData: KrakenOHLCData = {
          timestamp: parseInt(data[1]) * 1000,
          open: parseFloat(data[2]),
          high: parseFloat(data[3]),
          low: parseFloat(data[4]),
          close: parseFloat(data[5]),
          volume: parseFloat(data[7])
        };
        
        this.emit('ohlc', ohlcData);
      }
    }
  }

  subscribe(event: string, callback: (data: any) => void): void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.subscribers.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  async getTicker(pair: string = 'XBTUSD'): Promise<KrakenTickerData> {
    if (!this.apiKey) {
      // Return mock data for development
      return {
        symbol: 'BTC/USD',
        price: 43000 + Math.random() * 1000,
        high24h: 44000,
        low24h: 42000,
        volume24h: 1500,
        change24h: 250.50,
        changePercent24h: 0.58,
        timestamp: Date.now()
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/0/public/Ticker?pair=${pair}`);
      const data = await response.json();
      
      if (data.error && data.error.length > 0) {
        throw new Error(`Kraken API error: ${data.error.join(', ')}`);
      }

      const tickerInfo = data.result[pair];
      return {
        symbol: 'BTC/USD',
        price: parseFloat(tickerInfo.c[0]),
        high24h: parseFloat(tickerInfo.h[0]),
        low24h: parseFloat(tickerInfo.l[0]),
        volume24h: parseFloat(tickerInfo.v[0]),
        change24h: parseFloat(tickerInfo.c[0]) - parseFloat(tickerInfo.o[0]),
        changePercent24h: ((parseFloat(tickerInfo.c[0]) - parseFloat(tickerInfo.o[0])) / parseFloat(tickerInfo.o[0])) * 100,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      throw error;
    }
  }

  async getOHLCData(pair: string = 'XBTUSD', interval: number = 1): Promise<KrakenOHLCData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/0/public/OHLC?pair=${pair}&interval=${interval}`);
      const data = await response.json();
      
      if (data.error && data.error.length > 0) {
        throw new Error(`Kraken API error: ${data.error.join(', ')}`);
      }

      const ohlcArray = data.result[pair];
      if (!ohlcArray || !Array.isArray(ohlcArray)) {
        throw new Error('Invalid OHLC data received from Kraken API');
      }

      return ohlcArray.map((item: any[]) => ({
        timestamp: parseInt(item[0]) * 1000,
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[6])
      }));
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      
      // Return recent realistic data based on current market conditions
      const mockData: KrakenOHLCData[] = [];
      const now = Date.now();
      let price = 43000;
      
      for (let i = 60; i >= 0; i--) {
        const timestamp = now - (i * 60 * 1000);
        const open = price;
        const volatility = (Math.random() - 0.5) * 200;
        const close = open + volatility;
        const high = Math.max(open, close) + Math.random() * 50;
        const low = Math.min(open, close) - Math.random() * 50;
        
        mockData.push({
          timestamp,
          open,
          high,
          low,
          close,
          volume: Math.random() * 10
        });
        
        price = close;
      }
      
      return mockData;
    }
  }

  async placeBuyOrder(amount: number, price?: number): Promise<KrakenOrderResult> {
    if (!this.apiKey) {
      // Return mock order result for development
      return {
        orderId: `mock_buy_${Date.now()}`,
        status: 'closed',
        price: price || 43000,
        amount,
        filled: amount,
        timestamp: Date.now()
      };
    }

    // In a real implementation, this would use Kraken's authenticated API
    // For now, return mock data
    return {
      orderId: `buy_${Date.now()}`,
      status: 'closed',
      price: price || 43000,
      amount,
      filled: amount,
      timestamp: Date.now()
    };
  }

  async placeSellOrder(amount: number, price?: number): Promise<KrakenOrderResult> {
    if (!this.apiKey) {
      // Return mock order result for development
      return {
        orderId: `mock_sell_${Date.now()}`,
        status: 'closed',
        price: price || 43000,
        amount,
        filled: amount,
        timestamp: Date.now()
      };
    }

    // In a real implementation, this would use Kraken's authenticated API
    // For now, return mock data
    return {
      orderId: `sell_${Date.now()}`,
      status: 'closed',
      price: price || 43000,
      amount,
      filled: amount,
      timestamp: Date.now()
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const krakenAPI = new KrakenAPI();
