import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PerformanceData {
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  profitLast24h: number;
  profitLastHour: number;
  tradesLast24h: number;
  tradesLastHour: number;
  portfolioValue: number;
}

interface ScalingData {
  currentTier: number;
  nextScaleTarget: number;
  progressToNext: number;
}

interface PerformanceMetricsProps {
  performance: PerformanceData;
  scaling: ScalingData;
  currentPositionSize: string;
  className?: string;
}

export function PerformanceMetrics({ 
  performance, 
  scaling, 
  currentPositionSize,
  className 
}: PerformanceMetricsProps) {
  const winRateColor = performance.winRate >= 60 ? 'text-green-400' : 
                      performance.winRate >= 40 ? 'text-yellow-400' : 'text-red-400';

  const profitColor = (value: number) => 
    value >= 0 ? 'text-green-400' : 'text-red-400';

  const formatProfit = (value: number) => 
    `${value >= 0 ? '+' : ''}$${value.toFixed(2)}`;

  const getScalingProgress = () => {
    if (scaling.nextScaleTarget === 0) return 100;
    return Math.min((scaling.progressToNext / scaling.nextScaleTarget) * 100, 100);
  };

  const getStreakColor = (consecutive: number, type: 'wins' | 'losses') => {
    if (type === 'wins') {
      return consecutive >= 3 ? 'text-green-400' : 'text-gray-400';
    } else {
      return consecutive >= 2 ? 'text-red-400' : 'text-gray-400';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Performance */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-chart-line text-blue-400" />
            <span>Performance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Portfolio Value</div>
              <div className="text-xl font-bold text-white">
                ${performance.portfolioValue.toLocaleString()}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Total Trades</div>
              <div className="text-xl font-bold text-white">
                {performance.totalTrades}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Win Rate</div>
              <div className={`text-xl font-bold ${winRateColor}`}>
                {performance.winRate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Winning Trades</div>
              <div className="text-xl font-bold text-green-400">
                {performance.winningTrades}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-clock text-green-400" />
            <span>Recent Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 24h Performance */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Last 24 Hours</span>
                <span className={`font-semibold ${profitColor(performance.profitLast24h)}`}>
                  {formatProfit(performance.profitLast24h)}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {performance.tradesLast24h} trades executed
              </div>
            </div>

            {/* 1h Performance */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Last Hour</span>
                <span className={`font-semibold ${profitColor(performance.profitLastHour)}`}>
                  {formatProfit(performance.profitLastHour)}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {performance.tradesLastHour} trades executed
              </div>
            </div>

            {/* Streak Information */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Win Streak</div>
                <div className={`text-lg font-bold ${getStreakColor(performance.consecutiveWins, 'wins')}`}>
                  {performance.consecutiveWins}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Loss Streak</div>
                <div className={`text-lg font-bold ${getStreakColor(performance.consecutiveLosses, 'losses')}`}>
                  {performance.consecutiveLosses}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scaling Progress */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-arrow-up text-yellow-400" />
            <span>Scaling Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Current Position Size</span>
                <span className="text-lg font-bold text-white">
                  ${currentPositionSize}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Tier {scaling.currentTier}
              </div>
            </div>

            {scaling.nextScaleTarget > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-400">Next Scale</span>
                  <span className="text-sm text-blue-400">
                    {scaling.progressToNext} / {scaling.nextScaleTarget} wins
                  </span>
                </div>
                <Progress 
                  value={getScalingProgress()} 
                  className="h-2 bg-gray-600"
                />
                <div className="text-xs text-gray-400 mt-2">
                  {scaling.nextScaleTarget - scaling.progressToNext} more wins to scale up
                </div>
              </div>
            )}

            {scaling.nextScaleTarget === 0 && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-crown text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">Maximum Tier Reached</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  You've reached the maximum position size
                </div>
              </div>
            )}

            {/* Hot Streak Indicator */}
            {performance.consecutiveWins >= 5 && (
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-fire text-orange-400" />
                  <span className="text-orange-400 font-semibold">Hot Streak Active!</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Next win triggers 3x position scaling bonus
                </div>
              </div>
            )}

            {/* Risk Warning */}
            {performance.consecutiveLosses >= 2 && (
              <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg p-4 border border-red-500/30">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-exclamation-triangle text-red-400" />
                  <span className="text-red-400 font-semibold">Risk Alert</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Emergency scale-down active after consecutive losses
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
