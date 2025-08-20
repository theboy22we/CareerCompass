import { MiningDashboard } from '@/components/mining-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

export default function MiningOperations() {
  const { data: operationsData } = useQuery({
    queryKey: ['/api/operations/summary'],
    refetchInterval: 30000,
  });

  const { data: miningOps } = useQuery({
    queryKey: ['/api/mining/operations'],
    refetchInterval: 10000,
  });

  return (
    <div className="mobile-compact mobile-compact-space">
      {/* Mining Overview Cards */}
      <div className="mobile-grid-3 mobile-compact-grid">
        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card">
            <div className="text-xl sm:text-3xl font-bold text-accent mobile-header">
              ${(operationsData?.mining?.totalRevenue || 0).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground mobile-card">
              From mining operations
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Active Miners</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card">
            <div className="text-xl sm:text-3xl font-bold text-green-400 mobile-header">
              {operationsData?.mining?.activeMiners || 0}
            </div>
            <div className="text-sm text-muted-foreground mobile-card">
              Currently mining
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Hash Rate</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card">
            <div className="text-xl sm:text-3xl font-bold text-primary mobile-header">
              {(operationsData?.mining?.totalHashRate || 0).toFixed(2)} TH/s
            </div>
            <div className="text-sm text-muted-foreground mobile-card">
              Combined power
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Mining Dashboard */}
      <MiningDashboard />

      {/* Mining Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 mobile-compact-grid">
        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Mining Pool Stats</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card mobile-compact-space">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">Pool Fee</span>
              <span className="font-semibold mobile-card">1.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">Payout Threshold</span>
              <span className="font-semibold mobile-card">0.001 BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">Last Payout</span>
              <span className="font-semibold mobile-card">2 hours ago</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">Pool Share</span>
              <span className="font-semibold text-green-400 mobile-card">0.15%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Power Consumption</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card mobile-compact-space">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">Current Draw</span>
              <span className="font-semibold mobile-card">3.2 kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">Daily Cost</span>
              <span className="font-semibold text-red-400 mobile-card">$15.36</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">Efficiency</span>
              <span className="font-semibold text-green-400 mobile-card">95.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">Temperature</span>
              <span className="font-semibold mobile-card">68°C</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}