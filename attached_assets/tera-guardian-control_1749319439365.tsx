import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Bot, 
  Shield, 
  DollarSign, 
  Cpu, 
  Settings,
  Power,
  Brain,
  Zap,
  Activity
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TeraGuardian {
  id: number;
  name: string;
  role: string;
  status: string;
  aiLoadLevel: number;
  processingPower: number;
  capabilities: string[];
  accessLevel: string;
  lastUpdate: string;
}

export default function TeraGuardianControl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query TERA Guardian system status
  const { data: guardians, isLoading } = useQuery({
    queryKey: ['/api/tera/guardians'],
    refetchInterval: 5000
  });

  // Mutation to activate/deactivate guardians
  const toggleGuardianMutation = useMutation({
    mutationFn: ({ guardianId, action }: { guardianId: number; action: 'activate' | 'deactivate' }) =>
      apiRequest({
        url: `/api/tera/guardians/${guardianId}/${action}`,
        method: 'POST'
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tera/guardians'] });
      toast({
        title: `Guardian ${variables.action === 'activate' ? 'Activated' : 'Deactivated'}`,
        description: `TERA Guardian system updated successfully`
      });
    }
  });

  // Mutation to start AI optimization
  const startOptimizationMutation = useMutation({
    mutationFn: () => apiRequest({
      url: '/api/optimizer/start',
      method: 'POST',
      data: { mode: 'aggressive', interval: 30, considerLatency: true }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tera/guardians'] });
      toast({
        title: "TERA Optimization Started",
        description: "AI system is now optimizing mining performance"
      });
    }
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'PLATFORM_OVERSEER': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'MINING_SPECIALIST': return <Cpu className="w-5 h-5 text-green-500" />;
      case 'SECURITY_SPECIALIST': return <Shield className="w-5 h-5 text-red-500" />;
      case 'FINANCE_SPECIALIST': return <DollarSign className="w-5 h-5 text-yellow-500" />;
      default: return <Bot className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'standby': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="w-5 h-5 mr-2 text-blue-500" />
            TERA Guardian AI System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-blue-500" />
            TERA Guardian AI System
          </CardTitle>
          <CardDescription>
            Advanced AI entities managing mining operations, security, and optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Active Guardians</span>
                <Activity className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-500">
                {guardians?.filter((g: TeraGuardian) => g.status === 'active').length || 0}
              </div>
              <div className="text-xs text-slate-400">
                of {guardians?.length || 0} total
              </div>
            </div>
            
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Avg AI Load</span>
                <Zap className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-yellow-500">
                {guardians?.reduce((acc: number, g: TeraGuardian) => acc + g.aiLoadLevel, 0) / (guardians?.length || 1) || 0}%
              </div>
              <div className="text-xs text-slate-400">system capacity</div>
            </div>
            
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Processing Power</span>
                <Cpu className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-500">
                {guardians?.reduce((acc: number, g: TeraGuardian) => acc + g.processingPower, 0) / (guardians?.length || 1) || 0}%
              </div>
              <div className="text-xs text-slate-400">avg performance</div>
            </div>
          </div>

          <Button
            onClick={() => startOptimizationMutation.mutate()}
            disabled={startOptimizationMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Brain className="w-4 h-4 mr-2" />
            Start AI Optimization
          </Button>
        </CardContent>
      </Card>

      {/* Individual Guardian Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {guardians?.map((guardian: TeraGuardian) => (
          <Card key={guardian.id} className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getRoleIcon(guardian.role)}
                  <div>
                    <CardTitle className="text-lg">{guardian.name}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {guardian.role.replace('_', ' ')}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(guardian.status)}`} />
                  <Badge className={`${getStatusColor(guardian.status)} text-white`}>
                    {guardian.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">AI Load Level</div>
                  <div className="flex items-center space-x-2">
                    <Progress value={guardian.aiLoadLevel} className="flex-1" />
                    <span className="text-sm font-medium">{guardian.aiLoadLevel}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Processing Power</div>
                  <div className="flex items-center space-x-2">
                    <Progress value={guardian.processingPower} className="flex-1" />
                    <span className="text-sm font-medium">{guardian.processingPower}%</span>
                  </div>
                </div>
              </div>
              
              {/* Capabilities */}
              <div>
                <div className="text-sm text-slate-400 mb-2">Core Capabilities</div>
                <div className="flex flex-wrap gap-1">
                  {guardian.capabilities.slice(0, 3).map((capability, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {capability.replace('_', ' ')}
                    </Badge>
                  ))}
                  {guardian.capabilities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{guardian.capabilities.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => toggleGuardianMutation.mutate({
                    guardianId: guardian.id,
                    action: guardian.status === 'active' ? 'deactivate' : 'activate'
                  })}
                  disabled={toggleGuardianMutation.isPending}
                  variant={guardian.status === 'active' ? 'destructive' : 'default'}
                  size="sm"
                  className="flex-1"
                >
                  <Power className="w-3 h-3 mr-1" />
                  {guardian.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                
                <Button variant="outline" size="sm">
                  <Settings className="w-3 h-3 mr-1" />
                  Configure
                </Button>
              </div>

              <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                Last Update: {formatDate(guardian.lastUpdate)} | Access: {guardian.accessLevel}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Training Center */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-500" />
            Guardian Training Center
          </CardTitle>
          <CardDescription>
            Enhance AI capabilities and train new mining strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800 rounded-lg text-center">
              <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Security Training</h4>
              <p className="text-sm text-slate-400 mb-3">Advanced threat detection protocols</p>
              <Button variant="outline" size="sm" className="w-full">
                Start Training
              </Button>
            </div>
            
            <div className="p-4 bg-slate-800 rounded-lg text-center">
              <Cpu className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Mining Optimization</h4>
              <p className="text-sm text-slate-400 mb-3">Enhanced performance algorithms</p>
              <Button variant="outline" size="sm" className="w-full">
                Start Training
              </Button>
            </div>
            
            <div className="p-4 bg-slate-800 rounded-lg text-center">
              <DollarSign className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Market Analysis</h4>
              <p className="text-sm text-slate-400 mb-3">Real-time profitability tracking</p>
              <Button variant="outline" size="sm" className="w-full">
                Start Training
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}