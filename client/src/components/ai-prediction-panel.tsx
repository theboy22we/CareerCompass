import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface PredictionData {
  priceDirection: 'UP' | 'DOWN' | 'SIDEWAYS';
  confidence: number;
  targetPrice: number;
  timeframe: number;
  probability: number;
  reasoning: string[];
}

interface AISignal {
  signal: 'BUY' | 'SELL';
  confidence: number;
  reasoning: string;
}

interface AccuracyStats {
  accuracy: number;
  totalPredictions: number;
  recentPerformance: {
    accuracy: number;
    predictions: number;
    patterns: Array<{
      name: string;
      success_rate: number;
      frequency: number;
      avg_profit: number;
    }>;
  };
}

interface AIPredictionPanelProps {
  className?: string;
}

export function AIPredictionPanel({ className }: AIPredictionPanelProps) {
  const { data: aiData, isLoading } = useQuery({
    queryKey: ['/api/ai/prediction'],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const { data: learningData } = useQuery({
    queryKey: ['/api/ai/learning'],
    refetchInterval: 60000, // Update every minute
  });

  if (isLoading) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-brain text-purple-400 animate-pulse" />
            <span>AI Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const prediction: PredictionData = aiData?.prediction;
  const aiSignals: AISignal[] = aiData?.aiSignals || [];
  const accuracy: AccuracyStats = aiData?.accuracy;

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'UP':
        return 'fas fa-arrow-up text-green-400';
      case 'DOWN':
        return 'fas fa-arrow-down text-red-400';
      default:
        return 'fas fa-arrows-alt-h text-yellow-400';
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'UP':
        return 'text-green-400';
      case 'DOWN':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="fas fa-brain text-purple-400" />
            <span>AI Price Prediction</span>
          </div>
          {prediction && (
            <Badge 
              variant="outline" 
              className={`${getConfidenceColor(prediction.confidence)} border-current`}
            >
              {prediction.confidence}% confidence
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {prediction ? (
          <>
            {/* Main Prediction */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <i className={getDirectionIcon(prediction.priceDirection)} />
                  <span className={`text-lg font-bold ${getDirectionColor(prediction.priceDirection)}`}>
                    {prediction.priceDirection}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Target Price</div>
                  <div className="text-lg font-bold text-white">
                    ${prediction.targetPrice.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Confidence</span>
                  <span className={getConfidenceColor(prediction.confidence)}>
                    {prediction.confidence}%
                  </span>
                </div>
                <Progress 
                  value={prediction.confidence} 
                  className="h-2 bg-gray-600"
                />
              </div>

              <div className="mt-3">
                <div className="text-sm text-gray-400 mb-1">Timeframe</div>
                <div className="text-sm text-white">{prediction.timeframe} minutes</div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">AI Analysis</div>
              <div className="space-y-2">
                {prediction.reasoning.map((reason, index) => (
                  <div key={index} className="text-sm text-gray-200 flex items-start space-x-2">
                    <i className="fas fa-dot-circle text-purple-400 text-xs mt-1.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* High-Confidence AI Signals */}
            {aiSignals.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-300">
                  High-Confidence Signals
                </div>
                {aiSignals.map((signal, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      signal.signal === 'BUY' 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <i className={`fas ${signal.signal === 'BUY' ? 'fa-arrow-up text-green-400' : 'fa-arrow-down text-red-400'}`} />
                        <span className={`font-medium ${signal.signal === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                          {signal.signal} SIGNAL
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {signal.confidence}%
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-300">
                      {signal.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <i className="fas fa-brain text-4xl mb-4 opacity-50" />
            <p>No AI prediction available</p>
            <p className="text-sm">Analyzing market data...</p>
          </div>
        )}

        <Separator className="bg-gray-600" />

        {/* Learning Progress */}
        {accuracy && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-300">
              AI Learning Progress
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-gray-400">Overall Accuracy</div>
                <div className={`text-lg font-bold ${getConfidenceColor(accuracy.accuracy * 100)}`}>
                  {(accuracy.accuracy * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  {accuracy.totalPredictions} total predictions
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-gray-400">Recent Performance</div>
                <div className={`text-lg font-bold ${getConfidenceColor(accuracy.recentPerformance.accuracy * 100)}`}>
                  {(accuracy.recentPerformance.accuracy * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  Last {accuracy.recentPerformance.predictions} predictions
                </div>
              </div>
            </div>

            {/* Top Patterns */}
            {accuracy.recentPerformance.patterns && (
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Top Performing Patterns</div>
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {accuracy.recentPerformance.patterns
                    .sort((a, b) => b.success_rate - a.success_rate)
                    .slice(0, 5)
                    .map((pattern, index) => (
                      <div key={index} className="bg-gray-700 rounded p-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-300">
                            {pattern.name.replace(/_/g, ' ')}
                          </span>
                          <span className={`text-xs font-medium ${getConfidenceColor(pattern.success_rate * 100)}`}>
                            {(pattern.success_rate * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}