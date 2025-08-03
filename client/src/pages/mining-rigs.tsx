import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Pickaxe, Zap, Thermometer, Activity, Settings, Code, Plus, Trash2, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface MiningRig {
  id: string;
  name: string;
  type: string;
  hashrate: number;
  powerDraw: number;
  temperature: number;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  efficiency: number;
  dailyRevenue: number;
  location: string;
  poolId: string;
  hardware: string;
  autoConfig: boolean;
  pythonScript?: string;
  aiAgentId?: string;
  lastUpdate: string;
}

export default function MiningRigs() {
  const [selectedRig, setSelectedRig] = useState<string | null>(null);
  const [pythonScript, setPythonScript] = useState('');
  const [newRig, setNewRig] = useState({
    name: '',
    type: 'bitcoin',
    hardware: '',
    location: '',
    hashrate: 0,
    powerDraw: 0,
  });

  const queryClient = useQueryClient();

  // Fetch mining rigs
  const { data: rigs, isLoading } = useQuery({
    queryKey: ['/api/mining/rigs'],
    refetchInterval: 5000,
  });

  // Fetch mining pools for selection
  const { data: pools } = useQuery({
    queryKey: ['/api/mining/pools'],
  });

  // Fetch AI agents for assignment
  const { data: aiAgents } = useQuery({
    queryKey: ['/api/ai/agents'],
  });

  // Control rig mutation
  const controlRigMutation = useMutation({
    mutationFn: (data: { rigId: string; action: string }) => 
      apiRequest(`/api/mining/rigs/${data.rigId}/control`, 'POST', { action: data.action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mining/rigs'] });
    },
  });

  // Update rig mutation
  const updateRigMutation = useMutation({
    mutationFn: (data: { rigId: string; updates: any }) => 
      apiRequest(`/api/mining/rigs/${data.rigId}`, 'PUT', data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mining/rigs'] });
    },
  });

  // Add new rig mutation
  const addRigMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/mining/rigs', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mining/rigs'] });
      setNewRig({
        name: '',
        type: 'bitcoin',
        hardware: '',
        location: '',
        hashrate: 0,
        powerDraw: 0,
      });
    },
  });

  // Delete rig mutation
  const deleteRigMutation = useMutation({
    mutationFn: (rigId: string) => apiRequest(`/api/mining/rigs/${rigId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mining/rigs'] });
    },
  });

  const handleRigControl = (rigId: string, action: string) => {
    controlRigMutation.mutate({ rigId, action });
  };

  const handleUpdatePythonScript = (rigId: string) => {
    updateRigMutation.mutate({
      rigId,
      updates: { pythonScript }
    });
  };

  const handleAddRig = () => {
    addRigMutation.mutate(newRig);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const defaultPythonScript = `
# Mining Rig AI Controller
import time
import json
from datetime import datetime

class MiningRigAI:
    def __init__(self, rig_config):
        self.rig_config = rig_config
        self.optimal_temp = 65  # Celsius
        self.max_temp = 80
        self.min_efficiency = 90
        
    def monitor_temperature(self):
        """Monitor and adjust rig temperature"""
        current_temp = self.get_temperature()
        
        if current_temp > self.max_temp:
            self.reduce_power(10)  # Reduce by 10%
            print(f"Temperature too high ({current_temp}°C), reducing power")
            
        elif current_temp < self.optimal_temp:
            self.increase_power(5)  # Increase by 5%
            print(f"Temperature optimal ({current_temp}°C), increasing power")
            
    def optimize_efficiency(self):
        """Optimize mining efficiency"""
        current_efficiency = self.get_efficiency()
        
        if current_efficiency < self.min_efficiency:
            # Try different optimization strategies
            self.adjust_memory_clock()
            self.adjust_core_clock()
            self.optimize_fan_curve()
            
    def auto_pool_switch(self):
        """Switch to most profitable pool"""
        pools = self.get_available_pools()
        best_pool = max(pools, key=lambda x: x['profitability'])
        
        if best_pool['id'] != self.current_pool:
            self.switch_pool(best_pool['id'])
            print(f"Switched to more profitable pool: {best_pool['name']}")
            
    def maintenance_check(self):
        """Perform maintenance checks"""
        issues = []
        
        # Check hashrate stability
        if self.hashrate_variance() > 0.1:
            issues.append("Hashrate unstable")
            
        # Check power consumption
        if self.power_efficiency() < 0.8:
            issues.append("Power efficiency low")
            
        # Check temperature trends
        if self.temperature_trend() > 5:
            issues.append("Temperature rising")
            
        return issues
        
    def run_optimization_cycle(self):
        """Main optimization loop"""
        print(f"Starting optimization cycle for {self.rig_config['name']}")
        
        self.monitor_temperature()
        self.optimize_efficiency()
        self.auto_pool_switch()
        
        issues = self.maintenance_check()
        if issues:
            print(f"Maintenance required: {', '.join(issues)}")
            
        print("Optimization cycle complete")

# Initialize and run
rig_ai = MiningRigAI(config)
rig_ai.run_optimization_cycle()
  `;

  // Generate 25 default rigs if none exist
  const generateDefaultRigs = () => {
    const rigNames = [
      'TERACORE7', 'TERAALPHA7', 'TERAOMEGA7', 'TERANODE7', 'TERAOPTIMUS7',
      'TERAJUSTICE7', 'TERAANNHARRIS7', 'TERA-ZIG-MINER7', 'TERAELITE7', 'TERAPOWER7',
      'TERASUPREME7', 'TERAMAX7', 'TERAULTIMATE7', 'TERAPRIME7', 'TERABOOST7',
      'TERAFORCE7', 'TERAENERGY7', 'TERASPEED7', 'TERASTRONG7', 'TERABEAST7',
      'TERATITAN7', 'TERAGIANT7', 'TERALIGHTNING7', 'TERATHUNDER7', 'TERASTORM7'
    ];

    return rigNames.map((name, index) => ({
      id: `rig-${index + 1}`,
      name,
      type: 'bitcoin',
      hashrate: 100 + Math.random() * 50,
      powerDraw: 3000 + Math.random() * 1000,
      temperature: 60 + Math.random() * 15,
      status: ['online', 'offline', 'maintenance'][Math.floor(Math.random() * 3)] as any,
      efficiency: 85 + Math.random() * 15,
      dailyRevenue: 40 + Math.random() * 30,
      location: `KLOUDBUGS Data Center ${String.fromCharCode(65 + Math.floor(index / 5))}`,
      poolId: 'pool-1',
      hardware: ['ASIC S19 Pro', 'ASIC S17+', 'Custom ASIC'][Math.floor(Math.random() * 3)],
      autoConfig: Math.random() > 0.3,
      lastUpdate: new Date().toISOString(),
    }));
  };

  const displayRigs = rigs?.length ? rigs : generateDefaultRigs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Pickaxe className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          <p>Loading mining rigs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Pickaxe className="h-8 w-8 text-orange-500" />
            Mining Rigs Management
          </h1>
          <p className="text-muted-foreground">
            Manage 25 TERA mining rigs with Python AI integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/mining/rigs'] })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rigs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rigs">All Rigs</TabsTrigger>
          <TabsTrigger value="control">Rig Control</TabsTrigger>
          <TabsTrigger value="python">Python Scripts</TabsTrigger>
          <TabsTrigger value="add">Add New Rig</TabsTrigger>
        </TabsList>

        {/* All Rigs Tab */}
        <TabsContent value="rigs" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rigs</CardTitle>
                <Pickaxe className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayRigs.length}</div>
                <p className="text-xs text-muted-foreground">
                  TERA mining fleet
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Rigs</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {displayRigs.filter((r: any) => r.status === 'online').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently mining
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hashrate</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {displayRigs
                    .filter((r: any) => r.status === 'online')
                    .reduce((sum: number, rig: any) => sum + rig.hashrate, 0)
                    .toFixed(1)} TH/s
                </div>
                <p className="text-xs text-muted-foreground">
                  Combined mining power
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
                <Thermometer className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${displayRigs
                    .filter((r: any) => r.status === 'online')
                    .reduce((sum: number, rig: any) => sum + rig.dailyRevenue, 0)
                    .toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total daily earnings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Rigs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayRigs.map((rig: any) => (
              <Card key={rig.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedRig(rig.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{rig.name}</CardTitle>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(rig.status)}`} />
                  </div>
                  <CardDescription>{rig.hardware}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Hashrate</div>
                      <div className="font-medium">{rig.hashrate.toFixed(1)} TH/s</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Power</div>
                      <div className="font-medium">{rig.powerDraw}W</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Temp</div>
                      <div className="font-medium">{rig.temperature}°C</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Revenue</div>
                      <div className="font-medium">${rig.dailyRevenue.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Efficiency</span>
                      <span>{rig.efficiency.toFixed(1)}%</span>
                    </div>
                    <Progress value={rig.efficiency} className="h-2" />
                  </div>

                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant={rig.status === 'online' ? 'secondary' : 'default'}
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRigControl(rig.id, rig.status === 'online' ? 'stop' : 'start');
                      }}
                    >
                      {rig.status === 'online' ? 'Stop' : 'Start'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRigControl(rig.id, 'restart');
                      }}
                    >
                      Restart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rig Control Tab */}
        <TabsContent value="control" className="space-y-4">
          {selectedRig ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Control: {displayRigs.find((r: any) => r.id === selectedRig)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rig details and controls would go here */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => handleRigControl(selectedRig, 'start')}>
                    Start Mining
                  </Button>
                  <Button onClick={() => handleRigControl(selectedRig, 'stop')}>
                    Stop Mining
                  </Button>
                  <Button onClick={() => handleRigControl(selectedRig, 'restart')}>
                    Restart Rig
                  </Button>
                  <Button onClick={() => handleRigControl(selectedRig, 'optimize')}>
                    Auto Optimize
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Select a rig to control</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Python Scripts Tab */}
        <TabsContent value="python" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Python AI Mining Scripts
              </CardTitle>
              <CardDescription>
                Deploy custom Python scripts to individual mining rigs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Mining Rig</label>
                <Select value={selectedRig || ''} onValueChange={setSelectedRig}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a rig to configure" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayRigs.map((rig: any) => (
                      <SelectItem key={rig.id} value={rig.id}>
                        {rig.name} - {rig.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea 
                placeholder="Enter Python script for mining rig AI..."
                value={pythonScript || defaultPythonScript}
                onChange={(e) => setPythonScript(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />

              <div className="flex gap-2">
                <Button 
                  onClick={() => selectedRig && handleUpdatePythonScript(selectedRig)}
                  disabled={!selectedRig || updateRigMutation.isPending}
                >
                  Deploy to Rig
                </Button>
                <Button variant="outline" onClick={() => setPythonScript(defaultPythonScript)}>
                  Load Default Script
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add New Rig Tab */}
        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Mining Rig
              </CardTitle>
              <CardDescription>
                Configure and deploy a new TERA mining rig
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rig Name</label>
                  <Input 
                    placeholder="e.g., TERANEW7"
                    value={newRig.name}
                    onChange={(e) => setNewRig({...newRig, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Hardware Type</label>
                  <Input 
                    placeholder="e.g., ASIC S19 Pro"
                    value={newRig.hardware}
                    onChange={(e) => setNewRig({...newRig, hardware: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input 
                    placeholder="e.g., KLOUDBUGS Data Center Alpha"
                    value={newRig.location}
                    onChange={(e) => setNewRig({...newRig, location: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mining Type</label>
                  <Select value={newRig.type} onValueChange={(value) => setNewRig({...newRig, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bitcoin">Bitcoin</SelectItem>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="litecoin">Litecoin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Hashrate (TH/s)</label>
                  <Input 
                    type="number"
                    placeholder="110.0"
                    value={newRig.hashrate}
                    onChange={(e) => setNewRig({...newRig, hashrate: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Power Draw (W)</label>
                  <Input 
                    type="number"
                    placeholder="3250"
                    value={newRig.powerDraw}
                    onChange={(e) => setNewRig({...newRig, powerDraw: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button onClick={handleAddRig} disabled={addRigMutation.isPending}>
                  Add Mining Rig
                </Button>
                <Button variant="outline" onClick={() => setNewRig({
                  name: '',
                  type: 'bitcoin',
                  hardware: '',
                  location: '',
                  hashrate: 0,
                  powerDraw: 0,
                })}>
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}