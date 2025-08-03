import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface MiningRig {
  id: string;
  name: string;
  type: string;
  hashrate: number;
  powerDraw: number;
  temperature: number;
  status: 'online' | 'offline' | 'maintenance';
  efficiency: number;
  dailyRevenue: number;
  location: string;
}

interface MiningData {
  operations: MiningRig[];
  summary: {
    totalRevenue: number;
    totalPower: number;
    efficiency: number;
    onlineRigs: number;
  };
}

export function MiningDashboard() {
  const [wsConnected, setWsConnected] = useState(false);
  const [liveData, setLiveData] = useState<MiningRig[]>([]);

  // Fetch initial mining data from main API
  const { data: miningData } = useQuery<MiningData>({
    queryKey: ['/api/mining/operations'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Connect to mining service WebSocket for real-time updates
  useEffect(() => {
    const connectMiningWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:3001/mining-ws`;
      
      try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('Connected to mining service');
          setWsConnected(true);
        };
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.type === 'rigs:update') {
            setLiveData(message.data);
          }
        };
        
        ws.onclose = () => {
          console.log('Mining service disconnected');
          setWsConnected(false);
          // Reconnect after 5 seconds
          setTimeout(connectMiningWS, 5000);
        };
        
        ws.onerror = () => {
          console.log('Mining service connection error');
          setWsConnected(false);
        };
        
        return ws;
      } catch (error) {
        console.log('Mining service not available, using API data');
        setWsConnected(false);
        return null;
      }
    };

    const ws = connectMiningWS();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Use live data if available, otherwise fall back to API data
  const displayData = liveData.length > 0 ? liveData : miningData?.operations || [];
  const summary = miningData?.summary;

  const openMiningControl = () => {
    window.open('http://localhost:3001', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-foreground">Mining Operations</h3>
          <Badge variant={wsConnected ? "default" : "secondary"}>
            {wsConnected ? "🟢 Live" : "📊 API"}
          </Badge>
        </div>
        <Button 
          onClick={openMiningControl}
          className="cosmic-action-btn"
          size="sm"
        >
          Open Mining Control
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Daily Revenue</div>
              <div className="text-2xl font-bold text-green-400">
                ${summary.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Power Draw</div>
              <div className="text-2xl font-bold text-yellow-400">
                {summary.totalPower}W
              </div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Efficiency</div>
              <div className="text-2xl font-bold text-blue-400">
                {summary.efficiency.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Online Rigs</div>
              <div className="text-2xl font-bold text-purple-400">
                {summary.onlineRigs}/{displayData.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mining Rigs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayData.map((rig) => (
          <Card key={rig.id} className="cosmic-card border-border/50 hover:border-primary/50 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-cyber-gold">
                  {rig.name}
                </CardTitle>
                <Badge 
                  variant={
                    rig.status === 'online' ? 'default' : 
                    rig.status === 'maintenance' ? 'secondary' : 'destructive'
                  }
                  className="text-xs"
                >
                  {rig.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Hashrate</div>
                  <div className="font-mono text-foreground">
                    {rig.hashrate.toFixed(1)} {rig.type === 'bitcoin' ? 'TH/s' : 'GH/s'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Temperature</div>
                  <div className={`font-mono ${
                    rig.temperature > 60 ? 'text-red-400' : 
                    rig.temperature > 50 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {rig.temperature.toFixed(1)}°C
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Power</div>
                  <div className="font-mono text-foreground">{rig.powerDraw}W</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Revenue</div>
                  <div className="font-mono text-green-400">${rig.dailyRevenue}</div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-foreground">{rig.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {displayData.length === 0 && (
        <Card className="cosmic-card">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <i className="fas fa-pickaxe text-4xl text-primary/20" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Mining Operations</h3>
            <p className="text-muted-foreground mb-4">
              Start your mining control service to see real-time data
            </p>
            <Button onClick={openMiningControl} className="cosmic-action-btn">
              Launch Mining Control
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}