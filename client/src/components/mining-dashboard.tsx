import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  TrendingUp, 
  Thermometer, 
  Clock, 
  DollarSign, 
  Activity,
  Pickaxe,
  Server,
  Battery,
  Gauge
} from 'lucide-react';

export function MiningDashboard() {
  // This would connect to your mining API endpoints
  const { data: miningData } = useQuery({
    queryKey: ['/api/mining/operations'],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const { data: operationalSummary } = useQuery({
    queryKey: ['/api/operations/summary'],
    refetchInterval: 60000, // Update every minute
  });

  // Mock data for now - replace with actual API data
  const operations = miningData?.operations || [
    {
      id: 'mine-btc-001',
      name: 'Primary Bitcoin Mining Facility',
      location: 'Texas, USA',
      type: 'bitcoin',
      hashrate: 150,
      powerConsumption: 3250,
      efficiency: 21.67,
      status: 'online',
      dailyRevenue: 186.50,
      dailyCost: 78.00,
      profitability: 58.13,
      temperature: 42,
      uptime: 99.2,
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-04-15'
    },
    {
      id: 'mine-eth-001',
      name: 'Ethereum Mining Farm',
      location: 'Washington, USA',
      type: 'ethereum',
      hashrate: 2.8,
      powerConsumption: 4800,
      efficiency: 1.71,
      status: 'online',
      dailyRevenue: 145.20,
      dailyCost: 115.20,
      profitability: 20.66,
      temperature: 38,
      uptime: 97.8,
      lastMaintenance: '2024-01-20',
      nextMaintenance: '2024-04-20'
    }
  ];

  const summary = operationalSummary?.mining || {
    totalRevenue: 331.70,
    totalCosts: 193.20,
    totalProfit: 138.50,
    averageUptime: 98.5,
    activeOperations: 2,
    totalOperations: 2
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500 bg-green-500/10';
      case 'offline': return 'text-red-500 bg-red-500/10';
      case 'maintenance': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bitcoin': return '₿';
      case 'ethereum': return 'Ξ';
      default: return '⚡';
    }
  };

  const getEfficiencyRating = (efficiency: number, type: string) => {
    if (type === 'bitcoin') {
      // For Bitcoin: lower J/TH is better
      if (efficiency < 20) return { rating: 'Excellent', color: 'text-green-500' };
      if (efficiency < 25) return { rating: 'Good', color: 'text-yellow-500' };
      return { rating: 'Poor', color: 'text-red-500' };
    } else {
      // For Ethereum: higher MH/J is better
      if (efficiency > 2) return { rating: 'Excellent', color: 'text-green-500' };
      if (efficiency > 1.5) return { rating: 'Good', color: 'text-yellow-500' };
      return { rating: 'Poor', color: 'text-red-500' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Mining Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cosmic-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Revenue</p>
                <p className="text-2xl font-bold text-green-500">
                  ${summary.totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Profit</p>
                <p className="text-2xl font-bold text-cyber-gold">
                  ${summary.totalProfit.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-cyber-gold" />
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Uptime</p>
                <p className="text-2xl font-bold text-blue-500">
                  {summary.averageUptime.toFixed(1)}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Operations</p>
                <p className="text-2xl font-bold text-purple-500">
                  {summary.activeOperations}/{summary.totalOperations}
                </p>
              </div>
              <Pickaxe className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mining Operations */}
      <Card className="cosmic-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-cyber-gold" />
            Mining Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {operations.map((operation) => {
              const efficiencyRating = getEfficiencyRating(operation.efficiency, operation.type);
              
              return (
                <Card key={operation.id} className="cosmic-card border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getTypeIcon(operation.type)}</span>
                        <div>
                          <div className="text-sm font-medium">{operation.name}</div>
                          <div className="text-xs text-muted-foreground">{operation.location}</div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(operation.status)}>
                        {operation.status.toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          <span className="text-muted-foreground">Hashrate</span>
                        </div>
                        <div className="font-medium">
                          {operation.hashrate} {operation.type === 'bitcoin' ? 'TH/s' : 'GH/s'}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <Battery className="h-3 w-3 text-orange-500" />
                          <span className="text-muted-foreground">Power</span>
                        </div>
                        <div className="font-medium">{operation.powerConsumption}W</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3 w-3 text-blue-500" />
                          <span className="text-muted-foreground">Efficiency</span>
                        </div>
                        <div className={`font-medium ${efficiencyRating.color}`}>
                          {operation.efficiency} {operation.type === 'bitcoin' ? 'J/TH' : 'MH/J'}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3 text-red-500" />
                          <span className="text-muted-foreground">Temp</span>
                        </div>
                        <div className="font-medium">{operation.temperature}°C</div>
                      </div>
                    </div>

                    {/* Uptime Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Uptime</span>
                        <span>{operation.uptime}%</span>
                      </div>
                      <Progress value={operation.uptime} className="h-1" />
                    </div>

                    {/* Financial Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-green-500/10 rounded">
                        <div className="text-green-500 font-medium">
                          ${operation.dailyRevenue.toFixed(2)}
                        </div>
                        <div className="text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center p-2 bg-red-500/10 rounded">
                        <div className="text-red-500 font-medium">
                          ${operation.dailyCost.toFixed(2)}
                        </div>
                        <div className="text-muted-foreground">Costs</div>
                      </div>
                      <div className="text-center p-2 bg-cyber-gold/10 rounded">
                        <div className="text-cyber-gold font-medium">
                          {operation.profitability.toFixed(1)}%
                        </div>
                        <div className="text-muted-foreground">Profit</div>
                      </div>
                    </div>

                    {/* Maintenance Info */}
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Next maintenance: {new Date(operation.nextMaintenance).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="cosmic-card">
          <CardHeader>
            <CardTitle className="text-cyber-gold">Daily Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Revenue</span>
                <span className="font-bold text-green-500">${summary.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Costs</span>
                <span className="font-bold text-red-500">${summary.totalCosts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium">Net Profit</span>
                <span className="font-bold text-cyber-gold">${summary.totalProfit.toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Profit Margin: {((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardHeader>
            <CardTitle className="text-cyber-gold">Social Impact Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Daily profit allocated to social justice projects
              </div>
              
              {/* Example allocation percentages */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Education Projects (30%)</span>
                  <span className="font-bold text-blue-500">
                    ${(summary.totalProfit * 0.3).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Community Support (25%)</span>
                  <span className="font-bold text-green-500">
                    ${(summary.totalProfit * 0.25).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Environment (20%)</span>
                  <span className="font-bold text-emerald-500">
                    ${(summary.totalProfit * 0.2).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-medium">Total Social Impact</span>
                  <span className="font-bold text-cyber-gold">
                    ${(summary.totalProfit * 0.75).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}