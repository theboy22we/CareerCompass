import { useEffect, useRef, useState } from 'react';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LiveTradingChartProps {
  className?: string;
}

interface CandlestickData {
  x: number;
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
}

export function LiveTradingChart({ className }: LiveTradingChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [timeframe, setTimeframe] = useState('1m');
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');

  // Fetch real-time OHLC data from Kraken
  const { data: ohlcData } = useQuery({
    queryKey: ['/api/market/ohlc'],
    refetchInterval: 5000, // Update every 5 seconds for live data
  });

  // Fetch market sentiment for overlay
  const { data: sentimentData } = useQuery({
    queryKey: ['/api/analytics/market-sentiment'],
    refetchInterval: 15000,
  });

  // Fetch technical indicators
  const { data: indicators } = useQuery({
    queryKey: ['/api/market/indicators'],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!chartRef.current || !ohlcData) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare candlestick data
    const candlestickData: CandlestickData[] = ohlcData.map((item: any) => ({
      x: item.timestamp,
      o: item.open,
      h: item.high,
      l: item.low,
      c: item.close,
    }));

    // Prepare line data for simple view
    const lineData = ohlcData.map((item: any) => ({
      x: item.timestamp,
      y: item.close,
    }));

    // Get sentiment color
    const sentimentColor = sentimentData?.sentiment?.direction === 'BULLISH' ? 
      'rgba(34, 197, 94, 0.8)' : 
      sentimentData?.sentiment?.direction === 'BEARISH' ? 
      'rgba(239, 68, 68, 0.8)' : 
      'rgba(234, 179, 8, 0.8)';

    const config: ChartConfiguration = {
      type: chartType === 'candlestick' ? 'bar' : 'line',
      data: {
        datasets: [
          chartType === 'candlestick' ? {
            label: 'Bitcoin Price',
            data: candlestickData.map(candle => ({
              x: candle.x,
              y: [candle.l, candle.o, candle.c, candle.h], // [low, open, close, high]
            })),
            backgroundColor: (ctx: any) => {
              const candle = candlestickData[ctx.dataIndex];
              return candle.c >= candle.o ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
            },
            borderColor: (ctx: any) => {
              const candle = candlestickData[ctx.dataIndex];
              return candle.c >= candle.o ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
            },
            borderWidth: 1,
            barThickness: 'flex',
            maxBarThickness: 8,
          } : {
            label: 'Bitcoin Price',
            data: lineData,
            borderColor: sentimentColor,
            backgroundColor: sentimentColor.replace('0.8', '0.1'),
            borderWidth: 2,
            fill: true,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
          
          // RSI Overlay (if indicators available)
          ...(indicators?.indicators?.rsi ? [{
            label: 'RSI',
            data: ohlcData.map((item: any, index: number) => ({
              x: item.timestamp,
              y: indicators.indicators.rsi, // This would need to be array for each point
            })),
            borderColor: 'rgba(168, 85, 247, 0.8)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 1,
            fill: false,
            yAxisID: 'rsi',
            pointRadius: 0,
          }] : []),

          // Volume bars
          {
            label: 'Volume',
            data: ohlcData.map((item: any) => ({
              x: item.timestamp,
              y: item.volume,
            })),
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            borderColor: 'rgba(59, 130, 246, 0.8)',
            borderWidth: 1,
            yAxisID: 'volume',
            type: 'bar',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'rgb(156, 163, 175)',
              filter: (item) => item.text !== 'Volume', // Hide volume from legend
            },
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: 'rgb(243, 244, 246)',
            bodyColor: 'rgb(209, 213, 219)',
            borderColor: 'rgb(75, 85, 99)',
            borderWidth: 1,
            callbacks: {
              title: (context) => {
                return new Date(context[0].parsed.x).toLocaleString();
              },
              label: (context) => {
                if (context.dataset.label === 'Volume') {
                  return `Volume: ${context.parsed.y.toFixed(2)}`;
                } else if (chartType === 'candlestick') {
                  const candle = candlestickData[context.dataIndex];
                  return [
                    `Open: $${candle.o.toLocaleString()}`,
                    `High: $${candle.h.toLocaleString()}`,
                    `Low: $${candle.l.toLocaleString()}`,
                    `Close: $${candle.c.toLocaleString()}`,
                  ];
                } else {
                  return `Price: $${context.parsed.y.toLocaleString()}`;
                }
              },
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              displayFormats: {
                minute: 'HH:mm',
                hour: 'MMM dd HH:mm',
              },
            },
            grid: {
              color: 'rgba(75, 85, 99, 0.3)',
            },
            ticks: {
              color: 'rgb(156, 163, 175)',
            },
          },
          y: {
            type: 'linear',
            position: 'right',
            grid: {
              color: 'rgba(75, 85, 99, 0.3)',
            },
            ticks: {
              color: 'rgb(156, 163, 175)',
              callback: (value) => `$${Number(value).toLocaleString()}`,
            },
          },
          volume: {
            type: 'linear',
            position: 'left',
            max: Math.max(...ohlcData.map((d: any) => d.volume)) * 4,
            grid: {
              display: false,
            },
            ticks: {
              display: false,
            },
          },
          ...(indicators?.indicators?.rsi ? {
            rsi: {
              type: 'linear',
              position: 'left',
              min: 0,
              max: 100,
              grid: {
                display: false,
              },
              ticks: {
                color: 'rgba(168, 85, 247, 0.8)',
                callback: (value: any) => `${value}%`,
              },
            },
          } : {}),
        },
        animation: {
          duration: 750,
        },
      },
    };

    chartInstance.current = new Chart(ctx, config);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [ohlcData, sentimentData, indicators, chartType]);

  const getSentimentBadge = () => {
    if (!sentimentData?.sentiment) return null;
    
    const sentiment = sentimentData.sentiment;
    const color = sentiment.direction === 'BULLISH' ? 'bg-green-600' : 
                  sentiment.direction === 'BEARISH' ? 'bg-red-600' : 'bg-yellow-600';
    
    return (
      <Badge className={color}>
        {sentiment.direction} {sentiment.score > 0 ? '+' : ''}{sentiment.score}
      </Badge>
    );
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-chart-candlestick text-orange-400" />
            <span>Live Bitcoin Chart</span>
            {getSentimentBadge()}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Chart Type Toggle */}
            <div className="flex rounded-lg bg-gray-700 p-1">
              <Button
                variant={chartType === 'candlestick' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('candlestick')}
                className="text-xs"
              >
                Candlestick
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="text-xs"
              >
                Line
              </Button>
            </div>

            {/* Timeframe Selector */}
            <div className="flex rounded-lg bg-gray-700 p-1">
              {['1m', '5m', '15m', '1h'].map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  className="text-xs"
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Market Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            {ohlcData && ohlcData.length > 0 && (
              <>
                <div>
                  <span className="text-gray-400">Last: </span>
                  <span className="font-semibold text-white">
                    ${ohlcData[ohlcData.length - 1]?.close?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">24h High: </span>
                  <span className="font-semibold text-green-400">
                    ${Math.max(...ohlcData.map((d: any) => d.high)).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">24h Low: </span>
                  <span className="font-semibold text-red-400">
                    ${Math.min(...ohlcData.map((d: any) => d.low)).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {indicators?.indicators && (
            <div className="flex items-center space-x-3 text-xs">
              <div>
                <span className="text-gray-400">RSI: </span>
                <span className={`font-semibold ${
                  indicators.indicators.rsi < 30 ? 'text-green-400' :
                  indicators.indicators.rsi > 70 ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {indicators.indicators.rsi.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Signal: </span>
                <span className={`font-semibold ${
                  indicators.signal?.strength > 70 ? 'text-green-400' :
                  indicators.signal?.strength > 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {indicators.signal?.strength}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative h-96">
          <canvas ref={chartRef} className="w-full h-full" />
          
          {/* Live Trading Indicators Overlay */}
          {sentimentData?.sentiment && (
            <div className="absolute top-4 left-4 bg-gray-900/80 rounded-lg p-2 backdrop-blur-sm">
              <div className="text-xs space-y-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    sentimentData.sentiment.direction === 'BULLISH' ? 'bg-green-400' :
                    sentimentData.sentiment.direction === 'BEARISH' ? 'bg-red-400' : 'bg-yellow-400'
                  }`} />
                  <span className="text-gray-300">
                    {sentimentData.sentiment.direction} Sentiment
                  </span>
                </div>
                <div className="text-gray-400">
                  Strength: {sentimentData.sentiment.strength}
                </div>
              </div>
            </div>
          )}

          {/* Volume Spike Alert */}
          {sentimentData?.volumeProfile?.volumeSpike && (
            <div className="absolute top-4 right-4 bg-orange-500/20 border border-orange-500/30 rounded-lg p-2 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-xs">
                <i className="fas fa-exclamation-triangle text-orange-400" />
                <span className="text-orange-300">Volume Spike</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}