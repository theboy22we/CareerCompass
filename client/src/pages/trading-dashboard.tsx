import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TradingChart } from '@/components/trading-chart';
import { BotControls } from '@/components/bot-controls';
import { SimpleLiveChart } from '@/components/simple-live-chart';
import { MarketSelector } from '@/components/market-selector';
import { AIPredictionPanel } from '@/components/ai-prediction-panel';
import { AutoTradingPanel } from '@/components/auto-trading-panel';
import { MarketSentimentPanel } from '@/components/market-sentiment-panel';
import { useStableWebSocket } from '@/hooks/use-stable-websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MarketData {
  symbol: string;
  price: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  change24h: number;
  changePercent24h: number;
  timestamp: number;
}

export default function TradingDashboard() {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [selectedPair, setSelectedPair] = useState('XBTUSD');
  const [wsConnected, setWsConnected] = useState(false);

  const { data: botStatus } = useQuery({
    queryKey: ['/api/bot/status'],
    refetchInterval: 5000,
  });

  const { data: ohlcData = [] } = useQuery({
    queryKey: ['/api/market/ohlc', selectedPair],
    refetchInterval: 60000,
  });

  const { data: indicators } = useQuery({
    queryKey: ['/api/market/indicators', selectedPair],
    refetchInterval: 30000,
  });

  // WebSocket connection for real-time data
  const { sendMessage } = useStableWebSocket('ws://localhost:5000', {
    onOpen: () => setWsConnected(true),
    onClose: () => setWsConnected(false),
    onMessage: (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'price:update') {
          setCurrentPrice(message.data.price);
          setMarketData(message.data);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    }
  });

  // Initialize price history from OHLC data
  useEffect(() => {
    if (ohlcData && ohlcData.length > 0) {
      const formattedData = ohlcData.map((d: any) => ({
        timestamp: d.timestamp,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume
      }));
      setPriceHistory(formattedData);
      
      const latestPrice = formattedData[formattedData.length - 1]?.close;
      if (latestPrice) {
        setCurrentPrice(latestPrice);
      }
    }
  }, [ohlcData]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatChange = (change: number, isPercent = false) => {
    const formatted = isPercent 
      ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
      : `${change >= 0 ? '+' : ''}$${Math.abs(change).toFixed(2)}`;
    return formatted;
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="mobile-compact mobile-compact-space">
      {/* Market Data Header */}
      <div className="mobile-grid-2 mobile-compact-grid">
        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="flex items-center justify-between mobile-header">
              <span>BTC Price</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={`text-xs mobile-card ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {wsConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card">
            <div className="text-xl sm:text-3xl font-bold mobile-header">
              {currentPrice > 0 ? formatPrice(currentPrice) : '---'}
            </div>
            {marketData && (
              <div className="flex items-center space-x-2 mt-2">
                <span className={`text-sm font-medium mobile-card ${getPriceChangeColor(marketData.change24h)}`}>
                  {formatChange(marketData.change24h)}
                </span>
                <span className={`text-sm mobile-card ${getPriceChangeColor(marketData.changePercent24h)}`}>
                  ({formatChange(marketData.changePercent24h, true)})
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Market Stats</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card mobile-compact-space">
            {marketData ? (
              <>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground mobile-card">24h High</span>
                  <span className="text-sm font-medium mobile-card">{formatPrice(marketData.high24h)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground mobile-card">24h Low</span>
                  <span className="text-sm font-medium mobile-card">{formatPrice(marketData.low24h)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground mobile-card">Volume</span>
                  <span className="text-sm font-medium mobile-card">{marketData.volume24h.toFixed(2)} BTC</span>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground mobile-card">
                Loading market data...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trading Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 mobile-compact-grid">
        {/* Bot Controls - Takes 1 column */}
        <div className="lg:col-span-1">
          {botStatus && (
            <BotControls
              isActive={botStatus.state?.isActive || false}
              currentPosition={botStatus.state?.currentPosition}
              settings={botStatus.settings}
              onSettingsUpdate={() => {}}
            />
          )}
        </div>

        {/* Chart Area - Takes 3 columns */}
        <div className="lg:col-span-3">
          <Card className="cosmic-card">
            <CardHeader className="mobile-compact-card">
              <CardTitle className="flex items-center justify-between mobile-header">
                <span>Live Trading Chart</span>
                <MarketSelector 
                  onSelectionChange={(exchange, symbol) => {
                    setSelectedPair(symbol);
                  }}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="mobile-compact-card">
              <SimpleLiveChart className="h-64 sm:h-80" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analysis Panels */}
      <div className="mobile-grid-3 mobile-compact-grid">
        <AIPredictionPanel className="w-full" />
        <MarketSentimentPanel className="w-full" />
        <AutoTradingPanel 
          isActive={botStatus?.state?.isActive || false}
          onToggle={() => {}}
          className="w-full"
        />
      </div>

      {/* Advanced Chart */}
      <Card className="cosmic-card">
        <CardHeader className="mobile-compact-card">
          <CardTitle className="mobile-header">Advanced Trading Chart</CardTitle>
        </CardHeader>
        <CardContent className="mobile-compact-card">
          <TradingChart
            priceData={priceHistory}
            tradeMarkers={[]}
            indicators={indicators?.indicators}
          />
        </CardContent>
      </Card>
    </div>
  );
}