import { useEffect, useRef, useState } from 'react';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradeMarker {
  timestamp: number;
  price: number;
  type: 'BUY' | 'SELL';
  amount: number;
  signal: string;
}

interface TradingChartProps {
  priceData: PriceData[];
  tradeMarkers: TradeMarker[];
  indicators?: {
    rsi: number;
    sma20: number;
    sma50: number;
  };
}

export function TradingChart({ priceData, tradeMarkers, indicators }: TradingChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [timeframe, setTimeframe] = useState('1m');

  useEffect(() => {
    if (!chartRef.current || !priceData.length) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare data for Chart.js
    const chartData = priceData.map(d => ({
      x: d.timestamp,
      y: d.close
    }));

    const sma20Data = indicators ? priceData.map(d => ({
      x: d.timestamp,
      y: indicators.sma20
    })) : [];

    const sma50Data = indicators ? priceData.map(d => ({
      x: d.timestamp,
      y: indicators.sma50
    })) : [];

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'BTC Price',
            data: chartData,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
          ...(indicators ? [
            {
              label: 'SMA 20',
              data: sma20Data,
              borderColor: '#10B981',
              backgroundColor: 'transparent',
              borderWidth: 1,
              fill: false,
              pointRadius: 0,
            },
            {
              label: 'SMA 50',
              data: sma50Data,
              borderColor: '#F59E0B',
              backgroundColor: 'transparent',
              borderWidth: 1,
              fill: false,
              pointRadius: 0,
            }
          ] : [])
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            labels: {
              color: '#F3F4F6',
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#F3F4F6',
            bodyColor: '#F3F4F6',
            borderColor: '#374151',
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const price = context.parsed.y;
                return `Price: $${price.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm',
                hour: 'HH:mm'
              }
            },
            grid: {
              color: '#374151',
              lineWidth: 0.5
            },
            ticks: {
              color: '#9CA3AF',
              maxTicksLimit: 10
            }
          },
          y: {
            grid: {
              color: '#374151',
              lineWidth: 0.5
            },
            ticks: {
              color: '#9CA3AF',
              callback: function(value) {
                return '$' + Number(value).toLocaleString();
              }
            }
          }
        }
      }
    };

    chartInstance.current = new Chart(ctx, config);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [priceData, indicators]);

  // Add trade markers to chart
  useEffect(() => {
    if (!chartInstance.current || !tradeMarkers.length) return;

    // Add annotations for trade markers
    const annotations = tradeMarkers.map(trade => ({
      type: 'point',
      xValue: trade.timestamp,
      yValue: trade.price,
      backgroundColor: trade.type === 'BUY' ? '#10B981' : '#EF4444',
      borderColor: trade.type === 'BUY' ? '#10B981' : '#EF4444',
      borderWidth: 2,
      radius: 6,
      label: {
        content: `${trade.type} $${trade.amount}`,
        enabled: true,
        position: 'top'
      }
    }));

    // Note: In a real implementation, you'd need chartjs-plugin-annotation
    // For now, we'll update the chart without annotations
    chartInstance.current.update('none');
  }, [tradeMarkers]);

  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' }
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">BTC/USD Live Chart</h2>
        
        <div className="flex items-center space-x-4">
          {/* Timeframe selector */}
          <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-1">
            {timeframes.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeframe === tf.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Trade markers legend */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">Buy Signals</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-300">Sell Signals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="relative h-96">
        <canvas ref={chartRef} className="w-full h-full" />
        
        {/* Trade markers overlay */}
        {tradeMarkers.length > 0 && (
          <div className="absolute top-4 left-4 space-y-2 max-w-xs">
            {tradeMarkers.slice(-3).map((trade, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
                  trade.type === 'BUY'
                    ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                    : 'bg-red-500/20 border border-red-500/40 text-red-300'
                }`}
              >
                <i className={`fas ${trade.type === 'BUY' ? 'fa-arrow-up' : 'fa-arrow-down'}`} />
                <span className="font-medium">{trade.type}</span>
                <span>${trade.amount.toFixed(2)}</span>
                <span className="text-xs opacity-75">at ${trade.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Technical indicators */}
      {indicators && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">RSI (14)</div>
            <div className="text-xl font-bold text-white">{indicators.rsi.toFixed(1)}</div>
            <div className={`text-sm ${
              indicators.rsi < 30 ? 'text-green-400' : 
              indicators.rsi > 70 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {indicators.rsi < 30 ? 'Oversold' : 
               indicators.rsi > 70 ? 'Overbought' : 'Neutral'}
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">SMA 20</div>
            <div className="text-xl font-bold text-white">${indicators.sma20.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Moving Average</div>
          </div>

          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">SMA 50</div>
            <div className="text-xl font-bold text-white">${indicators.sma50.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Moving Average</div>
          </div>

          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">Trend</div>
            <div className={`text-xl font-bold ${
              indicators.sma20 > indicators.sma50 ? 'text-green-400' : 'text-red-400'
            }`}>
              {indicators.sma20 > indicators.sma50 ? 'Bullish' : 'Bearish'}
            </div>
            <div className="text-sm text-gray-400">MA Cross</div>
          </div>
        </div>
      )}
    </div>
  );
}
