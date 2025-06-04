import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TradingChart } from '@/components/trading-chart';
import { BotControls } from '@/components/bot-controls';
import { TradeHistory } from '@/components/trade-history';
import { PerformanceMetrics } from '@/components/performance-metrics';
import { NotificationSystem, useNotifications } from '@/components/notification-system';
import { AIPredictionPanel } from '@/components/ai-prediction-panel';
import { AutoTradingPanel } from '@/components/auto-trading-panel';
import { MarketSentimentPanel } from '@/components/market-sentiment-panel';
import { SimpleLiveChart } from '@/components/simple-live-chart';
import { useWebSocket } from '@/hooks/use-websocket';
import { audioAlerts } from '@/lib/audio-alerts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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

interface BotState {
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

interface Trade {
  id: number;
  type: 'BUY' | 'SELL';
  amount: string;
  price: string;
  profit?: string;
  positionSize: string;
  entryPrice?: string;
  exitPrice?: string;
  signal: string;
  status: 'OPEN' | 'CLOSED' | 'FAILED';
  timestamp: Date;
}

interface TradeMarker {
  timestamp: number;
  price: number;
  type: 'BUY' | 'SELL';
  amount: number;
  signal: string;
}

export default function Dashboard() {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [tradeMarkers, setTradeMarkers] = useState<TradeMarker[]>([]);
  const [botState, setBotState] = useState<BotState | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  
  const { 
    notifications, 
    addNotification, 
    dismissNotification, 
    markAsRead 
  } = useNotifications();

  // Fetch initial data
  const { data: botStatus, refetch: refetchBotStatus } = useQuery({
    queryKey: ['/api/bot/status'],
    refetchInterval: 5000,
  });

  const { data: trades = [], refetch: refetchTrades } = useQuery({
    queryKey: ['/api/trades'],
    refetchInterval: 10000,
  });

  const { data: performance, refetch: refetchPerformance } = useQuery({
    queryKey: ['/api/performance'],
    refetchInterval: 10000,
  });

  const { data: ohlcData = [] } = useQuery({
    queryKey: ['/api/market/ohlc'],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: indicators } = useQuery({
    queryKey: ['/api/market/indicators'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket('/ws', (message) => {
    handleWebSocketMessage(message);
  });

  useEffect(() => {
    setWsConnected(isConnected);
  }, [isConnected]);

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'price:update':
        setCurrentPrice(message.data.price);
        setMarketData(prev => prev ? {
          ...prev,
          price: message.data.price,
          change24h: message.data.change,
          changePercent24h: message.data.changePercent,
          timestamp: message.data.timestamp
        } : null);
        break;

      case 'bot:state':
        setBotState(message.data);
        break;

      case 'trade:executed':
        audioAlerts.playTradeExecuted();
        addNotification({
          type: 'trade',
          title: 'Trade Executed',
          message: `${message.data.signal.type} position opened at $${message.data.position.entryPrice.toLocaleString()}`,
          data: message.data
        });
        
        // Add trade marker
        setTradeMarkers(prev => [...prev, {
          timestamp: message.data.timestamp,
          price: message.data.position.entryPrice,
          type: message.data.signal.type,
          amount: message.data.position.amount,
          signal: message.data.signal.reason
        }].slice(-20)); // Keep last 20 markers
        
        refetchTrades();
        break;

      case 'trade:closed':
        audioAlerts.playPositionClosed(message.data.isWinning);
        addNotification({
          type: 'trade',
          title: 'Position Closed',
          message: `${message.data.reason} - P&L: ${message.data.profit >= 0 ? '+' : ''}$${message.data.profit.toFixed(2)}`,
          data: message.data
        });
        refetchTrades();
        refetchPerformance();
        break;

      case 'signal:generated':
        if (message.data.signal.strength >= 70) {
          if (message.data.signal.type === 'BUY') {
            audioAlerts.playBuySignal();
          } else if (message.data.signal.type === 'SELL') {
            audioAlerts.playSellSignal();
          }
          
          addNotification({
            type: 'signal',
            title: `${message.data.signal.type} Signal`,
            message: `${message.data.signal.reason} (${message.data.signal.strength}% strength)`,
            data: message.data
          });
        }
        break;

      case 'ai:prediction':
        // Handle AI prediction updates for real-time alerts
        if (message.data.prediction && message.data.prediction.confidence >= 80) {
          addNotification({
            type: 'info',
            title: 'AI Prediction Alert',
            message: `${message.data.prediction.priceDirection} movement predicted with ${message.data.prediction.confidence}% confidence`,
            data: message.data
          });
        }
        
        // Handle high-confidence AI signals
        if (message.data.aiSignals && message.data.aiSignals.length > 0) {
          message.data.aiSignals.forEach((signal: any) => {
            if (signal.confidence >= 85) {
              addNotification({
                type: 'signal',
                title: `AI ${signal.signal} Signal`,
                message: signal.reasoning,
                data: signal
              });
            }
          });
        }
        break;

      case 'scaling:updated':
        audioAlerts.playScaleUp();
        addNotification({
          type: 'scaling',
          title: 'Position Scaled',
          message: `Position size: $${message.data.oldSize} → $${message.data.newSize} (${message.data.reason})`,
          data: message.data
        });
        refetchBotStatus();
        break;

      case 'bot:emergency_stop':
        audioAlerts.playEmergencyStop();
        addNotification({
          type: 'error',
          title: 'Emergency Stop',
          message: 'Trading bot has been emergency stopped',
          data: message.data
        });
        refetchBotStatus();
        break;

      case 'error':
        addNotification({
          type: 'error',
          title: 'Error',
          message: message.data.message,
          data: message.data
        });
        break;

      case 'ohlc:update':
        setPriceHistory(prev => {
          const newData = {
            timestamp: message.data.timestamp,
            open: message.data.open,
            high: message.data.high,
            low: message.data.low,
            close: message.data.close,
            volume: message.data.volume
          };
          
          return [...prev, newData].slice(-200); // Keep last 200 data points
        });
        break;
    }
  };

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
      
      // Set initial price
      const latestPrice = formattedData[formattedData.length - 1]?.close;
      if (latestPrice) {
        setCurrentPrice(latestPrice);
      }
    }
  }, [ohlcData]);

  // Update bot state from API data
  useEffect(() => {
    if (botStatus) {
      setBotState(botStatus.state);
    }
  }, [botStatus]);

  // Update trade markers from trade history
  useEffect(() => {
    if (trades && trades.length > 0) {
      const markers = trades
        .filter((trade: Trade) => trade.entryPrice)
        .map((trade: Trade) => ({
          timestamp: new Date(trade.timestamp).getTime(),
          price: parseFloat(trade.entryPrice || trade.price),
          type: trade.type,
          amount: parseFloat(trade.positionSize),
          signal: trade.signal
        }))
        .slice(-20);
      
      setTradeMarkers(markers);
    }
  }, [trades]);

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

  const handleToggleBot = async (enabled: boolean) => {
    try {
      if (enabled) {
        await fetch('/api/bot/start', { method: 'POST' });
        addNotification({
          type: 'success',
          title: 'Trading bot started',
          message: 'Auto-trading is now active'
        });
      } else {
        await fetch('/api/bot/stop', { method: 'POST' });
        addNotification({
          type: 'info',
          title: 'Trading bot stopped',
          message: 'Auto-trading has been disabled'
        });
      }
      refetchBotStatus();
      refetchPerformance();
    } catch (error) {
      console.error('Error toggling bot:', error);
      addNotification({
        type: 'error',
        title: 'Bot control failed',
        message: 'Unable to change bot status'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          {/* Header - Cosmic Theme */}
          <div className="p-6 border-b border-border cosmic-card">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center relative overflow-hidden">
                <i className="fa-brands fa-bitcoin text-white text-xl animate-spin" style={{animationDuration: '20s'}}></i>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform -skew-x-12 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground" style={{fontFamily: 'Orbitron', letterSpacing: '2px', textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'}}>
                  KLOUD BOT PRO
                </h1>
                <p className="text-sm text-muted-foreground" style={{fontFamily: 'Rajdhani', letterSpacing: '1px'}}>
                  <i className="fas fa-satellite mr-1"></i>Cosmic Bitcoin Trading
                </p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Connection</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'status-online' : 'status-offline'}`} />
                <span className={`text-sm font-medium ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {wsConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Bot Controls */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {botState && botStatus && (
              <BotControls
                isActive={botState.isActive}
                currentPosition={botState.currentPosition}
                settings={botStatus.settings}
                onSettingsUpdate={() => {
                  refetchBotStatus();
                  refetchPerformance();
                }}
              />
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-card border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Bitcoin Price */}
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold">
                      {currentPrice > 0 ? formatPrice(currentPrice) : '---'}
                    </span>
                    {marketData && (
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getPriceChangeColor(marketData.change24h)}`}>
                          {formatChange(marketData.change24h)}
                        </span>
                        <span className={`text-sm ${getPriceChangeColor(marketData.changePercent24h)}`}>
                          ({formatChange(marketData.changePercent24h, true)})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>

                {/* Market Stats */}
                {marketData && (
                  <div className="flex items-center space-x-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">24h High: </span>
                      <span className="font-medium">{formatPrice(marketData.high24h)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">24h Low: </span>
                      <span className="font-medium">{formatPrice(marketData.low24h)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Volume: </span>
                      <span className="font-medium">{marketData.volume24h.toFixed(2)} BTC</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                {/* Trade Frequency */}
                {botState && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Trades This Hour</div>
                    <div className="text-lg font-bold">
                      {botState.performance.tradesThisHour}/10
                    </div>
                  </div>
                )}

                {/* Notifications */}
                <NotificationSystem
                  notifications={notifications}
                  onDismiss={dismissNotification}
                  onMarkRead={markAsRead}
                />

                {/* Emergency Stop - Cosmic Style */}
                <button className="cosmic-action-btn bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 border-red-500 hover:from-red-600 hover:via-pink-500 hover:to-orange-600">
                  <i className="fas fa-exclamation-triangle mr-2" />
                  <span>EMERGENCY STOP</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Trading Charts Section */}
          <div className="p-6 space-y-6">
            {/* Main Live Trading Chart */}
            <SimpleLiveChart className="w-full" />
            
            {/* Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MarketSentimentPanel className="w-full" />
              <AIPredictionPanel className="w-full" />
              <AutoTradingPanel 
                isActive={botState?.isActive || false}
                onToggle={(enabled) => {
                  refetchBotStatus();
                  refetchPerformance();
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Legacy Chart and Analytics */}
          <div className="flex-1 flex border-t border-border">
            {/* Chart Area */}
            <div className="flex-1 p-6">
              <TradingChart
                priceData={priceHistory}
                tradeMarkers={tradeMarkers}
                indicators={indicators?.indicators}
              />
            </div>

            {/* Right Panel */}
            <div className="w-96 p-6 space-y-6 border-l border-border overflow-y-auto custom-scrollbar">
              {/* AI Prediction Panel */}
              <AIPredictionPanel />

              {/* Auto-Trading Controls */}
              <AutoTradingPanel 
                isActive={botState?.isActive || false}
                onToggle={(enabled) => {
                  refetchBotStatus();
                  refetchPerformance();
                }}
              />

              {/* Performance Metrics */}
              {performance && botState && botStatus && (
                <PerformanceMetrics
                  performance={performance}
                  scaling={botState.scaling}
                  currentPositionSize={botStatus.settings.currentPositionSize}
                />
              )}

              {/* Trade History */}
              <TradeHistory trades={trades} />

              {/* Technical Indicators */}
              {indicators && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-chart-bar text-purple-400" />
                      <span>Technical Signals</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">RSI (14)</span>
                          <span className={`font-semibold ${
                            indicators.indicators.rsi < 30 ? 'text-green-400' :
                            indicators.indicators.rsi > 70 ? 'text-red-400' : 'text-foreground'
                          }`}>
                            {indicators.indicators.rsi.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {indicators.indicators.rsi < 30 ? 'Oversold - Buy Signal' :
                           indicators.indicators.rsi > 70 ? 'Overbought - Sell Signal' : 'Neutral'}
                        </div>
                      </div>

                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Signal Strength</span>
                          <span className={`font-semibold ${
                            indicators.signal.strength > 70 ? 'text-green-400' :
                            indicators.signal.strength > 40 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {indicators.signal.strength}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {indicators.signal.reason}
                        </div>
                      </div>

                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Current Signal</span>
                          <Badge variant={
                            indicators.signal.type === 'BUY' ? 'default' :
                            indicators.signal.type === 'SELL' ? 'destructive' : 'secondary'
                          }>
                            {indicators.signal.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
