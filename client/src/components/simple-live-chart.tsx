import { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SimpleLiveChartProps {
  className?: string;
}

export function SimpleLiveChart({ className }: SimpleLiveChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Fetch real-time OHLC data
  const { data: ohlcData, isLoading } = useQuery({
    queryKey: ['/api/market/ohlc'],
    refetchInterval: 5000,
  });

  // Fetch AI predictions
  const { data: aiData } = useQuery({
    queryKey: ['/api/ai/prediction'],
    refetchInterval: 15000,
  });

  // Fetch technical indicators
  const { data: indicatorData } = useQuery({
    queryKey: ['/api/market/indicators'],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!chartRef.current || !ohlcData || !Array.isArray(ohlcData)) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare line chart data
    const chartData = ohlcData.map((item: any) => ({
      x: item.timestamp,
      y: item.close,
    }));

    // Get sentiment-based color
    const bullishColor = 'rgba(34, 197, 94, 0.8)';
    const bearishColor = 'rgba(239, 68, 68, 0.8)';
    const neutralColor = 'rgba(234, 179, 8, 0.8)';

    let sentimentColor = neutralColor;
    if (aiData?.prediction?.priceDirection === 'UP') {
      sentimentColor = bullishColor;
    } else if (aiData?.prediction?.priceDirection === 'DOWN') {
      sentimentColor = bearishColor;
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Bitcoin Price',
            data: chartData,
            borderColor: sentimentColor,
            backgroundColor: sentimentColor.replace('0.8', '0.1'),
            borderWidth: 2,
            fill: true,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 6,
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
            display: false,
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
                return `Price: $${context.parsed.y.toLocaleString()}`;
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
  }, [ohlcData, aiData]);

  const getSentimentBadge = () => {
    if (!aiData?.prediction) return null;
    
    const prediction = aiData.prediction;
    let color = 'bg-yellow-600';
    let direction = prediction.priceDirection;
    
    if (direction === 'UP') {
      color = 'bg-green-600';
      direction = 'BULLISH';
    } else if (direction === 'DOWN') {
      color = 'bg-red-600';
      direction = 'BEARISH';
    }
    
    return (
      <Badge className={color}>
        {direction} {prediction.confidence}%
      </Badge>
    );
  };

  const getRSIStatus = () => {
    if (!indicatorData?.indicators?.rsi) return null;
    
    const rsi = indicatorData.indicators.rsi;
    let status = 'Neutral';
    let color = 'text-yellow-400';
    
    if (rsi < 30) {
      status = 'Oversold (Buy Signal)';
      color = 'text-green-400';
    } else if (rsi > 70) {
      status = 'Overbought (Sell Signal)';
      color = 'text-red-400';
    }
    
    return (
      <div className="text-xs">
        <span className="text-gray-400">RSI: </span>
        <span className={`font-semibold ${color}`}>
          {rsi.toFixed(1)} - {status}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardHeader>
          <CardTitle>Live Bitcoin Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-gray-400">Loading live data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-chart-line text-orange-400" />
            <span>Live Bitcoin Chart</span>
            {getSentimentBadge()}
          </CardTitle>
          
          <div className="text-right text-sm">
            {ohlcData && Array.isArray(ohlcData) && ohlcData.length > 0 && (
              <div className="space-y-1">
                <div>
                  <span className="text-gray-400">Price: </span>
                  <span className="font-semibold text-white">
                    ${ohlcData[ohlcData.length - 1]?.close?.toLocaleString()}
                  </span>
                </div>
                {getRSIStatus()}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative h-96">
          <canvas ref={chartRef} className="w-full h-full" />
          
          {/* AI Prediction Overlay */}
          {aiData?.prediction && (
            <div className="absolute top-4 left-4 bg-gray-900/80 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-xs space-y-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    aiData.prediction.priceDirection === 'UP' ? 'bg-green-400' :
                    aiData.prediction.priceDirection === 'DOWN' ? 'bg-red-400' : 'bg-yellow-400'
                  }`} />
                  <span className="text-gray-300">
                    AI Prediction: {aiData.prediction.priceDirection}
                  </span>
                </div>
                <div className="text-gray-400">
                  Confidence: {aiData.prediction.confidence}%
                </div>
                <div className="text-gray-400">
                  Target: ${aiData.prediction.targetPrice?.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Strong Signal Alert */}
          {indicatorData?.indicators?.rsi && (indicatorData.indicators.rsi < 30 || indicatorData.indicators.rsi > 70) && (
            <div className={`absolute top-4 right-4 ${
              indicatorData.indicators.rsi < 30 ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
            } border rounded-lg p-2 backdrop-blur-sm`}>
              <div className="flex items-center space-x-2 text-xs">
                <i className="fas fa-exclamation-triangle" />
                <span>
                  {indicatorData.indicators.rsi < 30 ? 'Strong Buy Signal' : 'Strong Sell Signal'}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}