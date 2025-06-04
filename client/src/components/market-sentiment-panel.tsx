import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MarketSentimentPanelProps {
  className?: string;
}

export function MarketSentimentPanel({ className }: MarketSentimentPanelProps) {
  const { data: sentimentData, isLoading } = useQuery({
    queryKey: ['/api/analytics/market-sentiment'],
    refetchInterval: 15000, // Update every 15 seconds
  });

  const { data: riskData } = useQuery({
    queryKey: ['/api/analytics/risk'],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-chart-line text-blue-400 animate-pulse" />
            <span>Market Sentiment</span>
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

  const sentiment = sentimentData?.sentiment;
  const volumeProfile = sentimentData?.volumeProfile;
  const marketRegime = sentimentData?.marketRegime;

  const getSentimentColor = (direction: string) => {
    switch (direction) {
      case 'BULLISH':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'BEARISH':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const getRegimeColor = (type: string) => {
    switch (type) {
      case 'TRENDING':
        return 'text-blue-400';
      case 'RANGING':
        return 'text-purple-400';
      case 'VOLATILE':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-green-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      case 'HIGH':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="fas fa-chart-line text-blue-400" />
            <span>Market Sentiment</span>
          </div>
          {sentiment && (
            <Badge 
              variant="outline" 
              className={getSentimentColor(sentiment.direction)}
            >
              {sentiment.direction}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sentiment ? (
          <>
            {/* Main Sentiment Score */}
            <div className={`rounded-lg p-4 border ${getSentimentColor(sentiment.direction)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <i className={`fas ${
                    sentiment.direction === 'BULLISH' ? 'fa-arrow-up' :
                    sentiment.direction === 'BEARISH' ? 'fa-arrow-down' :
                    'fa-arrows-alt-h'
                  } text-2xl`} />
                  <div>
                    <div className="text-lg font-bold">{sentiment.direction}</div>
                    <div className="text-sm opacity-75">Market Sentiment</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {sentiment.score > 0 ? '+' : ''}{sentiment.score}
                  </div>
                  <div className="text-sm opacity-75">{sentiment.strength}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sentiment Score</span>
                  <span>{sentiment.score}/100</span>
                </div>
                <Progress 
                  value={Math.abs(sentiment.score)} 
                  className="h-2 bg-gray-600"
                />
              </div>
            </div>

            {/* Sentiment Factors */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-300">Analysis Factors</div>
              <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                {sentiment.factors.map((factor, index) => (
                  <div key={index} className="bg-gray-700 rounded p-2">
                    <div className="flex items-start space-x-2">
                      <i className="fas fa-dot-circle text-blue-400 text-xs mt-1.5" />
                      <span className="text-sm text-gray-200">{factor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-gray-600" />

            {/* Volume Analysis */}
            {volumeProfile && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-300">Volume Profile</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-sm text-gray-400">Volume Trend</div>
                    <div className={`font-semibold ${
                      volumeProfile.volumeTrend === 'INCREASING' ? 'text-green-400' :
                      volumeProfile.volumeTrend === 'DECREASING' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {volumeProfile.volumeTrend}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-sm text-gray-400">Breakout Signal</div>
                    <div className={`font-semibold ${
                      volumeProfile.breakoutConfirmation ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {volumeProfile.breakoutConfirmation ? 'CONFIRMED' : 'PENDING'}
                    </div>
                  </div>
                </div>
                
                {volumeProfile.volumeSpike && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-exclamation-circle text-orange-400" />
                      <span className="text-sm text-orange-300 font-medium">
                        Volume Spike Detected
                      </span>
                    </div>
                    <p className="text-xs text-orange-400 mt-1">
                      Current volume is significantly above average
                    </p>
                  </div>
                )}
              </div>
            )}

            <Separator className="bg-gray-600" />

            {/* Market Regime */}
            {marketRegime && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-300">Market Regime</div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-semibold ${getRegimeColor(marketRegime.type)}`}>
                      {marketRegime.type}
                    </span>
                    <span className="text-sm text-gray-400">
                      Strength: {marketRegime.strength}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {marketRegime.recommendation}
                  </div>
                </div>
              </div>
            )}

            <Separator className="bg-gray-600" />

            {/* Risk Metrics */}
            {riskData && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-300">Risk Assessment</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-sm text-gray-400">Volatility</div>
                    <div className="text-lg font-bold text-white">
                      {riskData.riskMetrics.volatility.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-sm text-gray-400">Risk Level</div>
                    <div className={`text-lg font-bold ${getRiskColor(riskData.riskMetrics.riskLevel)}`}>
                      {riskData.riskMetrics.riskLevel}
                    </div>
                  </div>
                </div>

                {riskData.riskMetrics.drawdown > 5 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-exclamation-triangle text-red-400" />
                      <span className="text-sm text-red-300 font-medium">
                        High Drawdown Warning
                      </span>
                    </div>
                    <p className="text-xs text-red-400 mt-1">
                      Current drawdown: {riskData.riskMetrics.drawdown.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <i className="fas fa-chart-line text-4xl mb-4 opacity-50" />
            <p>No sentiment data available</p>
            <p className="text-sm">Analyzing market conditions...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}