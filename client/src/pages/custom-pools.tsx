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
import { Database, Upload, Download, Wifi, WifiOff, Settings, Plus, Trash2, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface MiningPool {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'error';
  hashRate: number;
  address: string;
  username: string;
  password?: string;
  managed: boolean;
  fees: number;
  connectedRigs: number;
  teraTokenSupport: boolean;
  customConfig?: any;
  createdAt: string;
}

interface WithdrawalRequest {
  id: string;
  tokenType: string;
  amount: number;
  toAddress: string;
  status: 'pending' | 'approved' | 'completed' | 'failed';
  approvedBy?: string;
  txHash?: string;
  createdAt: string;
}

export default function CustomPools() {
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [newPool, setNewPool] = useState({
    name: '',
    url: '',
    address: '',
    username: '',
    password: '',
    fees: 1.0,
    teraTokenSupport: false,
  });
  const [withdrawalForm, setWithdrawalForm] = useState({
    tokenType: 'BTC',
    amount: 0,
    toAddress: '',
  });
  const [uploadedConfig, setUploadedConfig] = useState('');

  const queryClient = useQueryClient();

  // Fetch mining pools
  const { data: pools, isLoading: poolsLoading } = useQuery({
    queryKey: ['/api/pools'],
    refetchInterval: 10000,
  });

  // Fetch TERA tokens
  const { data: teraTokens } = useQuery({
    queryKey: ['/api/tera/tokens'],
    refetchInterval: 5000,
  });

  // Fetch withdrawals
  const { data: withdrawals } = useQuery({
    queryKey: ['/api/withdrawals'],
    refetchInterval: 3000,
  });

  // Add pool mutation
  const addPoolMutation = useMutation({
    mutationFn: (poolData: any) => apiRequest('/api/pools', 'POST', poolData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
      setNewPool({
        name: '',
        url: '',
        address: '',
        username: '',
        password: '',
        fees: 1.0,
        teraTokenSupport: false,
      });
    },
  });

  // Update pool mutation
  const updatePoolMutation = useMutation({
    mutationFn: (data: { poolId: string; updates: any }) => 
      apiRequest(`/api/pools/${data.poolId}`, 'PUT', data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
    },
  });

  // Delete pool mutation
  const deletePoolMutation = useMutation({
    mutationFn: (poolId: string) => apiRequest(`/api/pools/${poolId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
    },
  });

  // Withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/withdrawals', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/withdrawals'] });
      setWithdrawalForm({
        tokenType: 'BTC',
        amount: 0,
        toAddress: '',
      });
    },
  });

  // Upload pool config mutation
  const uploadConfigMutation = useMutation({
    mutationFn: (data: { poolId: string; config: any }) => 
      apiRequest(`/api/pools/${data.poolId}/config`, 'POST', data.config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
    },
  });

  const handleAddPool = () => {
    addPoolMutation.mutate(newPool);
  };

  const handleUpdatePool = (poolId: string, updates: any) => {
    updatePoolMutation.mutate({ poolId, updates });
  };

  const handleDeletePool = (poolId: string) => {
    if (confirm('Are you sure you want to delete this pool?')) {
      deletePoolMutation.mutate(poolId);
    }
  };

  const handleWithdrawal = () => {
    withdrawMutation.mutate(withdrawalForm);
  };

  const handleUploadConfig = (poolId: string) => {
    try {
      const config = JSON.parse(uploadedConfig);
      uploadConfigMutation.mutate({ poolId, config });
      setUploadedConfig('');
    } catch (error) {
      alert('Invalid JSON configuration');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const defaultPools = [
    {
      id: 'pool-1',
      name: 'KLOUDBUGSCAFE POOL',
      url: 'stratum+tcp://kloudbugscafe.pool:4444',
      status: 'connected' as const,
      hashRate: 450.5,
      address: 'bc1qj93mnxgm0xuwyh3jvvqurjxjyq8uktg4y0sad6',
      username: 'Kloudbugs7',
      managed: true,
      fees: 1.5,
      connectedRigs: 12,
      teraTokenSupport: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'pool-2', 
      name: 'TERA SOCIAL JUSTICE POOL',
      url: 'stratum+tcp://terasocial.pool:3333',
      status: 'connected' as const,
      hashRate: 380.2,
      address: 'bc1qfavnkrku005m4kdkvdtgthur4ha06us2lppdps',
      username: 'Kloudbugs7',
      managed: true,
      fees: 0.5,
      connectedRigs: 13,
      teraTokenSupport: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const displayPools = pools?.length ? pools : defaultPools;

  const defaultTeraTokens = {
    id: 'tera-1',
    walletAddress: '0x742d35Cc6634C0532925a3b8D6A5C8C7E1234567',
    balance: 125000.50,
    stakingBalance: 50000.00,
    totalEarned: 175000.50,
    socialContribution: 52500.15,
    lastTransaction: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const displayTeraTokens = teraTokens || defaultTeraTokens;

  if (poolsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Database className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <p>Loading mining pools...</p>
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
            <Database className="h-8 w-8 text-blue-500" />
            Custom Mining Pools & Withdrawals
          </h1>
          <p className="text-muted-foreground">
            Manage custom mining pools and withdraw all crypto including TERA tokens
          </p>
        </div>
      </div>

      <Tabs defaultValue="pools" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pools">Mining Pools</TabsTrigger>
          <TabsTrigger value="upload">Upload Config</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="tera">TERA Tokens</TabsTrigger>
        </TabsList>

        {/* Mining Pools Tab */}
        <TabsContent value="pools" className="space-y-4">
          {/* Pool Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pools</CardTitle>
                <Database className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayPools.length}</div>
                <p className="text-xs text-muted-foreground">
                  Configured pools
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected</CardTitle>
                <Wifi className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {displayPools.filter((p: any) => p.status === 'connected').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active connections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hashrate</CardTitle>
                <Database className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {displayPools
                    .filter((p: any) => p.status === 'connected')
                    .reduce((sum: number, pool: any) => sum + pool.hashRate, 0)
                    .toFixed(1)} TH/s
                </div>
                <p className="text-xs text-muted-foreground">
                  Combined pool power
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TERA Support</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {displayPools.filter((p: any) => p.teraTokenSupport).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  TERA token pools
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Existing Pools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayPools.map((pool: any) => (
              <Card key={pool.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pool.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(pool.status)}`} />
                      <Badge variant={pool.teraTokenSupport ? 'default' : 'secondary'}>
                        {pool.teraTokenSupport ? 'TERA' : 'BTC'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{pool.url}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Hashrate</div>
                      <div className="font-medium">{pool.hashRate} TH/s</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Fees</div>
                      <div className="font-medium">{pool.fees}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Connected Rigs</div>
                      <div className="font-medium">{pool.connectedRigs}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <div className="font-medium capitalize">{pool.status}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Address: </span>
                      <code className="text-xs bg-muted px-1 rounded">{pool.address}</code>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Username: </span>
                      <span className="font-medium">{pool.username}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdatePool(pool.id, { 
                        status: pool.status === 'connected' ? 'disconnected' : 'connected' 
                      })}
                    >
                      {pool.status === 'connected' ? 'Disconnect' : 'Connect'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeletePool(pool.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add New Pool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Custom Mining Pool
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  placeholder="Pool Name"
                  value={newPool.name}
                  onChange={(e) => setNewPool({...newPool, name: e.target.value})}
                />
                <Input 
                  placeholder="Pool URL (stratum+tcp://...)"
                  value={newPool.url}
                  onChange={(e) => setNewPool({...newPool, url: e.target.value})}
                />
                <Input 
                  placeholder="Bitcoin Address"
                  value={newPool.address}
                  onChange={(e) => setNewPool({...newPool, address: e.target.value})}
                />
                <Input 
                  placeholder="Username"
                  value={newPool.username}
                  onChange={(e) => setNewPool({...newPool, username: e.target.value})}
                />
                <Input 
                  type="password"
                  placeholder="Password (optional)"
                  value={newPool.password}
                  onChange={(e) => setNewPool({...newPool, password: e.target.value})}
                />
                <Input 
                  type="number"
                  placeholder="Fees (%)"
                  value={newPool.fees}
                  onChange={(e) => setNewPool({...newPool, fees: parseFloat(e.target.value)})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">TERA Token Support</div>
                  <div className="text-sm text-muted-foreground">
                    Enable TERA token mining rewards
                  </div>
                </div>
                <Switch 
                  checked={newPool.teraTokenSupport}
                  onCheckedChange={(checked) => setNewPool({...newPool, teraTokenSupport: checked})}
                />
              </div>

              <Button onClick={handleAddPool} disabled={addPoolMutation.isPending}>
                Add Mining Pool
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Config Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Custom Pool Configuration
              </CardTitle>
              <CardDescription>
                Upload JSON configuration files for advanced pool settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Pool</label>
                <Select value={selectedPool || ''} onValueChange={setSelectedPool}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a pool to configure" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayPools.map((pool: any) => (
                      <SelectItem key={pool.id} value={pool.id}>
                        {pool.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea 
                placeholder="Paste JSON configuration here..."
                value={uploadedConfig}
                onChange={(e) => setUploadedConfig(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />

              <div className="flex gap-2">
                <Button 
                  onClick={() => selectedPool && handleUploadConfig(selectedPool)}
                  disabled={!selectedPool || !uploadedConfig || uploadConfigMutation.isPending}
                >
                  Upload Configuration
                </Button>
                <Button variant="outline" onClick={() => setUploadedConfig('')}>
                  Clear
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Example configuration format:</p>
                <pre className="bg-muted p-2 rounded mt-2">
{`{
  "mining": {
    "algorithm": "sha256",
    "difficulty": "auto",
    "intensity": 20
  },
  "optimization": {
    "autoTune": true,
    "powerLimit": 80,
    "tempLimit": 75
  },
  "tera": {
    "enabled": true,
    "allocation": 0.3,
    "socialMode": true
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-4">
          {/* Withdrawal Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Crypto Withdrawals
              </CardTitle>
              <CardDescription>
                Withdraw Bitcoin, Ethereum, TERA tokens and other cryptocurrencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Token Type</label>
                  <Select 
                    value={withdrawalForm.tokenType} 
                    onValueChange={(value) => setWithdrawalForm({...withdrawalForm, tokenType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                      <SelectItem value="TERA">TERA Token</SelectItem>
                      <SelectItem value="LTC">Litecoin (LTC)</SelectItem>
                      <SelectItem value="BCH">Bitcoin Cash (BCH)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input 
                    type="number"
                    step="0.00000001"
                    placeholder="0.00000000"
                    value={withdrawalForm.amount}
                    onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">To Address</label>
                  <Input 
                    placeholder="Enter wallet address"
                    value={withdrawalForm.toAddress}
                    onChange={(e) => setWithdrawalForm({...withdrawalForm, toAddress: e.target.value})}
                  />
                </div>
              </div>

              <Button onClick={handleWithdrawal} disabled={withdrawMutation.isPending}>
                Request Withdrawal
              </Button>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              {!withdrawals?.length ? (
                <div className="text-center py-8">
                  <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Withdrawals Yet</p>
                  <p className="text-muted-foreground">Your withdrawal history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((withdrawal: any) => (
                    <div key={withdrawal.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{withdrawal.amount} {withdrawal.tokenType}</h4>
                          <p className="text-sm text-muted-foreground">
                            To: {withdrawal.toAddress.substring(0, 20)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(withdrawal.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={
                          withdrawal.status === 'completed' ? 'default' :
                          withdrawal.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {withdrawal.status}
                        </Badge>
                      </div>
                      {withdrawal.txHash && (
                        <p className="text-xs">
                          <span className="text-muted-foreground">TX: </span>
                          <code className="bg-muted px-1 rounded">{withdrawal.txHash}</code>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TERA Tokens Tab */}
        <TabsContent value="tera" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                TERA Token Management
              </CardTitle>
              <CardDescription>
                Manage your TERA tokens, staking, and social contributions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-500">
                    {displayTeraTokens.balance?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Available Balance</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">
                    {displayTeraTokens.stakingBalance?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Staked TERA</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {displayTeraTokens.totalEarned?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Earned</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-500">
                    {displayTeraTokens.socialContribution?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Social Impact</div>
                </div>
              </div>

              {/* Wallet Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium">TERA Wallet Address</label>
                <div className="flex gap-2">
                  <Input 
                    readOnly
                    value={displayTeraTokens.walletAddress || 'Not connected'}
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="sm">
                    Copy
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-4">
                <Button className="flex-1">
                  Stake TERA
                </Button>
                <Button variant="outline" className="flex-1">
                  Unstake
                </Button>
                <Button variant="outline" className="flex-1">
                  Contribute to Social
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}