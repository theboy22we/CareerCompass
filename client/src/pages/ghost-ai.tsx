import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Ghost, Shield, CheckCircle, AlertTriangle, Settings, Code, Users, Lock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface GhostAI {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  permissions: string[];
  config: {
    approvalThreshold: number;
    autoApprove: boolean;
    securityLevel: 'low' | 'medium' | 'high';
    monitoringEnabled: boolean;
  };
  pythonScript: string;
  lastActive: string;
  decisions: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  };
}

export default function GhostAI() {
  const [selectedScript, setSelectedScript] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [config, setConfig] = useState({
    approvalThreshold: 85,
    autoApprove: false,
    securityLevel: 'high' as const,
    monitoringEnabled: true,
  });

  const queryClient = useQueryClient();

  // Fetch Ghost AI data
  const { data: ghostAI, isLoading } = useQuery({
    queryKey: ['/api/ai/ghost'],
    refetchInterval: 5000,
  });

  // Fetch pending approvals
  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['/api/ai/ghost/approvals'],
    refetchInterval: 3000,
  });

  // Update Ghost AI mutation
  const updateGhostMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/ai/ghost/update', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/ghost'] });
    },
  });

  // Approve/Reject actions mutation
  const approveMutation = useMutation({
    mutationFn: (data: { id: string; action: 'approve' | 'reject'; reason?: string }) => 
      apiRequest('/api/ai/ghost/approve', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/ghost/approvals'] });
    },
  });

  const handleUpdatePythonScript = () => {
    updateGhostMutation.mutate({
      pythonScript: selectedScript,
      config,
      permissions,
    });
  };

  const handleApproval = (id: string, action: 'approve' | 'reject', reason?: string) => {
    approveMutation.mutate({ id, action, reason });
  };

  const defaultPythonScript = `
# GHOST AI - Master Control & Approval System
import json
import time
from datetime import datetime

class GhostAI:
    def __init__(self, config):
        self.config = config
        self.approval_threshold = config.get('approvalThreshold', 85)
        self.auto_approve = config.get('autoApprove', False)
        self.security_level = config.get('securityLevel', 'high')
        
    def evaluate_withdrawal(self, withdrawal):
        """Evaluate withdrawal requests with multi-factor analysis"""
        score = 0
        
        # Amount risk assessment
        if withdrawal['amount'] < 0.1:
            score += 30
        elif withdrawal['amount'] < 1.0:
            score += 20
        else:
            score += 10
            
        # Historical behavior
        if withdrawal['user_history']['successful_withdrawals'] > 5:
            score += 25
            
        # Time-based analysis
        hour = datetime.now().hour
        if 9 <= hour <= 17:  # Business hours
            score += 20
            
        # Address verification
        if withdrawal['address_verified']:
            score += 15
            
        return score
        
    def evaluate_mining_operation(self, operation):
        """Evaluate mining operation changes"""
        score = 0
        
        # Power efficiency check
        if operation['efficiency'] > 95:
            score += 40
            
        # Temperature safety
        if operation['temperature'] < 70:
            score += 30
            
        # Pool reliability
        if operation['pool_uptime'] > 99:
            score += 20
            
        return score
        
    def approve_request(self, request):
        """Main approval logic"""
        if request['type'] == 'withdrawal':
            score = self.evaluate_withdrawal(request)
        elif request['type'] == 'mining':
            score = self.evaluate_mining_operation(request)
        else:
            score = 50  # Default moderate score
            
        # Auto-approve if conditions met
        if self.auto_approve and score >= self.approval_threshold:
            return {'approved': True, 'score': score, 'reason': 'Auto-approved'}
            
        # Manual review required
        return {'approved': False, 'score': score, 'reason': 'Manual review required'}

# Initialize Ghost AI
ghost = GhostAI(config)
print("Ghost AI initialized and monitoring all operations...")
  `;

  const availablePermissions = [
    'APPROVE_WITHDRAWALS',
    'MODIFY_MINING_RIGS',
    'CHANGE_POOLS',
    'EMERGENCY_STOP',
    'USER_MANAGEMENT',
    'SYSTEM_SETTINGS',
    'AI_COORDINATION',
    'SECURITY_OVERRIDES'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Ghost className="h-12 w-12 mx-auto mb-4 text-purple-500" />
          <p>Loading Ghost AI...</p>
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
            <Ghost className="h-8 w-8 text-purple-500" />
            Ghost AI - Master Control
          </h1>
          <p className="text-muted-foreground">
            The supreme AI that controls and approves all operations across the TERA ecosystem
          </p>
        </div>
        <Badge variant={(ghostAI as any)?.status === 'online' ? 'default' : 'destructive'} className="text-lg px-4 py-2">
          {(ghostAI as any)?.status?.toUpperCase() || 'OFFLINE'}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="python">Python Scripts</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Decisions</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(ghostAI as any)?.decisions?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Lifetime decisions made
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                <Shield className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(ghostAI as any)?.decisions?.total ? 
                    Math.round(((ghostAI as any).decisions.approved / (ghostAI as any).decisions.total) * 100) : 0}%
                </div>
                <Progress 
                  value={(ghostAI as any)?.decisions?.total ? 
                    ((ghostAI as any).decisions.approved / (ghostAI as any).decisions.total) * 100 : 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingApprovals.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-500">HIGH</div>
                  <div className="text-sm text-muted-foreground">Security Level</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-500">85%</div>
                  <div className="text-sm text-muted-foreground">Approval Threshold</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-500">24/7</div>
                  <div className="text-sm text-muted-foreground">Monitoring</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-500">8</div>
                  <div className="text-sm text-muted-foreground">Active Permissions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Requests awaiting Ghost AI approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-lg font-medium">All Clear!</p>
                  <p className="text-muted-foreground">No pending approvals at this time</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((approval: any) => (
                    <div key={approval.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{approval.type.toUpperCase()}</h4>
                          <p className="text-sm text-muted-foreground">{approval.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Requested: {new Date(approval.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={approval.priority === 'high' ? 'destructive' : 'secondary'}>
                          {approval.priority}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApproval(approval.id, 'approve')}
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApproval(approval.id, 'reject', 'Manual rejection')}
                          disabled={approveMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Python Scripts Tab */}
        <TabsContent value="python" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Python AI Scripts
              </CardTitle>
              <CardDescription>
                Manage Ghost AI Python scripts for automated decision making
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Enter Python script for Ghost AI..."
                value={selectedScript || defaultPythonScript}
                onChange={(e) => setSelectedScript(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleUpdatePythonScript} disabled={updateGhostMutation.isPending}>
                  Deploy Script
                </Button>
                <Button variant="outline" onClick={() => setSelectedScript(defaultPythonScript)}>
                  Load Default
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Ghost AI Permissions
              </CardTitle>
              <CardDescription>
                Configure what Ghost AI can control and approve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePermissions.map((permission) => (
                  <div key={permission} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{permission.replace(/_/g, ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {permission === 'APPROVE_WITHDRAWALS' && 'Allow Ghost AI to approve crypto withdrawals'}
                        {permission === 'MODIFY_MINING_RIGS' && 'Control mining rig operations'}
                        {permission === 'CHANGE_POOLS' && 'Switch mining pools automatically'}
                        {permission === 'EMERGENCY_STOP' && 'Emergency shutdown capabilities'}
                        {permission === 'USER_MANAGEMENT' && 'Manage user accounts and access'}
                        {permission === 'SYSTEM_SETTINGS' && 'Modify system configurations'}
                        {permission === 'AI_COORDINATION' && 'Coordinate other AI agents'}
                        {permission === 'SECURITY_OVERRIDES' && 'Override security protocols'}
                      </div>
                    </div>
                    <Switch 
                      checked={permissions.includes(permission)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPermissions([...permissions, permission]);
                        } else {
                          setPermissions(permissions.filter(p => p !== permission));
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ghost AI Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Approval Threshold (%)</label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    value={config.approvalThreshold}
                    onChange={(e) => setConfig({...config, approvalThreshold: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-Approve Mode</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically approve requests above threshold
                    </div>
                  </div>
                  <Switch 
                    checked={config.autoApprove}
                    onCheckedChange={(checked) => setConfig({...config, autoApprove: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Continuous Monitoring</div>
                    <div className="text-sm text-muted-foreground">
                      24/7 system monitoring and alerts
                    </div>
                  </div>
                  <Switch 
                    checked={config.monitoringEnabled}
                    onCheckedChange={(checked) => setConfig({...config, monitoringEnabled: checked})}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button onClick={handleUpdatePythonScript} disabled={updateGhostMutation.isPending}>
                  Save Configuration
                </Button>
                <Button variant="outline">
                  Test Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}