import { useQuery } from '@tanstack/react-query';
import { PerformanceMetrics } from '@/components/performance-metrics';
import { TradeHistory } from '@/components/trade-history';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function PerformanceDashboard() {
  const { data: performance } = useQuery({
    queryKey: ['/api/performance'],
    refetchInterval: 10000,
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['/api/trades'],
    refetchInterval: 10000,
  });

  const { data: botStatus } = useQuery({
    queryKey: ['/api/bot/status'],
    refetchInterval: 5000,
  });

  return (
    <div className="mobile-compact mobile-compact-space">
      {/* Performance Overview Cards */}
      <div className="mobile-grid-3 mobile-compact-grid">
        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card">
            <div className="text-xl sm:text-3xl font-bold text-accent mobile-header">
              ${(performance?.totalValue || 10000).toLocaleString()}
            </div>
            <div className={`text-sm mobile-card ${(performance?.dailyPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(performance?.dailyPnl || 0) >= 0 ? '+' : ''}${(performance?.dailyPnl || 0).toFixed(2)} today
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Win Rate</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card">
            <div className="text-xl sm:text-3xl font-bold text-green-400 mobile-header">
              {(performance?.winRate || 0).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground mobile-card">
              {performance?.winningTrades || 0} winning trades
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Total Trades</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card">
            <div className="text-xl sm:text-3xl font-bold text-primary mobile-header">
              {performance?.totalTrades || 0}
            </div>
            <div className="text-sm text-muted-foreground mobile-card">
              {performance?.tradesLastHour || 0} this hour
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 mobile-compact-grid">
        {performance && botStatus && (
          <PerformanceMetrics
            performance={performance}
            scaling={botStatus.state?.scaling || { currentTier: 1, nextScaleTarget: 100, progressToNext: 0 }}
            currentPositionSize={botStatus.settings?.currentPositionSize || '$100'}
          />
        )}

        {/* Trade History */}
        <div className="space-y-4">
          <TradeHistory trades={trades} />
          
          {/* Quick Stats */}
          <Card className="cosmic-card">
            <CardHeader className="mobile-compact-card">
              <CardTitle className="mobile-header">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="mobile-compact-card mobile-compact-space">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground mobile-card">Profit Factor</span>
                <span className="font-semibold mobile-header">
                  {(performance?.profitFactor || 1.2).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground mobile-card">Sharpe Ratio</span>
                <span className="font-semibold mobile-header">
                  {(performance?.sharpeRatio || 1.8).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground mobile-card">Max Drawdown</span>
                <span className="font-semibold text-red-400 mobile-header">
                  -{(performance?.maxDrawdown || 5.2).toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="cosmic-card">
        <CardHeader className="mobile-compact-card">
          <CardTitle className="mobile-header">Performance Chart</CardTitle>
        </CardHeader>
        <CardContent className="mobile-compact-card">
          <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center mobile-compact-space">
              <i className="fas fa-chart-line text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground mobile-card">Performance chart coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}