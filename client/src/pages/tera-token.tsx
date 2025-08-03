import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Coins, 
  TrendingUp, 
  Users, 
  Target,
  Shield,
  Zap,
  Globe,
  Lock,
  Unlock,
  ArrowUpDown,
  PieChart,
  BarChart3,
  DollarSign,
  Award,
  Heart
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TokenMetrics {
  totalSupply: number;
  circulatingSupply: number;
  lockedTokens: number;
  price: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  burnedTokens: number;
}

interface TokenTransaction {
  id: string;
  type: 'transfer' | 'mint' | 'burn' | 'stake' | 'unstake';
  amount: number;
  from: string;
  to: string;
  timestamp: string;
  txHash: string;
  status: 'confirmed' | 'pending' | 'failed';
}

interface StakingPool {
  id: string;
  name: string;
  apr: number;
  lockPeriod: number;
  totalStaked: number;
  maxStake: number;
  minStake: number;
  rewards: number;
  participants: number;
}

interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  endDate: string;
  category: 'treasury' | 'protocol' | 'social' | 'technical';
}

export default function TeraToken() {
  const [stakingAmount, setStakingAmount] = useState('');
  const [selectedPool, setSelectedPool] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch token metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/tera/metrics'],
    refetchInterval: 10000,
  });

  // Fetch token transactions
  const { data: transactions } = useQuery({
    queryKey: ['/api/tera/transactions'],
    refetchInterval: 15000,
  });

  // Fetch staking pools
  const { data: stakingPools } = useQuery({
    queryKey: ['/api/tera/staking'],
  });

  // Fetch governance proposals
  const { data: proposals } = useQuery({
    queryKey: ['/api/tera/governance'],
  });

  // Stake tokens mutation
  const stakeMutation = useMutation({
    mutationFn: (data: { amount: number; poolId: string }) => 
      apiRequest('/api/tera/stake', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tera/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tera/staking'] });
      setStakingAmount('');
      toast({ title: "Tokens staked successfully", description: "Your TERA tokens are now earning rewards!" });
    },
  });

  // Transfer tokens mutation
  const transferMutation = useMutation({
    mutationFn: (data: { amount: number; to: string }) => 
      apiRequest('/api/tera/transfer', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tera/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tera/transactions'] });
      setTransferAmount('');
      setTransferTo('');
      toast({ title: "Transfer completed", description: "TERA tokens sent successfully!" });
    },
  });

  // Vote on proposal mutation
  const voteMutation = useMutation({
    mutationFn: (data: { proposalId: string; vote: 'for' | 'against' }) => 
      apiRequest('/api/tera/vote', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tera/governance'] });
      toast({ title: "Vote recorded", description: "Your vote has been counted!" });
    },
  });

  // Mock data
  const defaultMetrics: TokenMetrics = {
    totalSupply: 1000000000,
    circulatingSupply: 750000000,
    lockedTokens: 200000000,
    price: 0.52,
    marketCap: 390000000,
    volume24h: 15678900,
    holders: 45678,
    burnedTokens: 50000000
  };

  const defaultTransactions: TokenTransaction[] = [
    {
      id: 'tx-1',
      type: 'transfer',
      amount: 1000,
      from: '0x742d35Cc...C4de',
      to: '0x8ba1f109...B29e',
      timestamp: '2024-01-17T10:30:00Z',
      txHash: '0x123...abc',
      status: 'confirmed'
    },
    {
      id: 'tx-2',
      type: 'stake',
      amount: 5000,
      from: '0x742d35Cc...C4de',
      to: 'Staking Pool #1',
      timestamp: '2024-01-17T09:15:00Z',
      txHash: '0x456...def',
      status: 'confirmed'
    }
  ];

  const defaultStakingPools: StakingPool[] = [
    {
      id: 'pool-1',
      name: 'Justice Impact Pool',
      apr: 15.5,
      lockPeriod: 90,
      totalStaked: 45000000,
      maxStake: 100000,
      minStake: 100,
      rewards: 156789,
      participants: 1247
    },
    {
      id: 'pool-2',
      name: 'Community Development Pool',
      apr: 12.8,
      lockPeriod: 60,
      totalStaked: 32000000,
      maxStake: 50000,
      minStake: 50,
      rewards: 98456,
      participants: 892
    }
  ];

  const defaultProposals: GovernanceProposal[] = [
    {
      id: 'prop-1',
      title: 'Increase Community Development Fund',
      description: 'Proposal to allocate additional 5M TERA tokens to community development initiatives',
      proposer: '0x742d35Cc...C4de',
      status: 'active',
      votesFor: 15678900,
      votesAgainst: 3456789,
      totalVotes: 19135689,
      endDate: '2024-02-15T23:59:59Z',
      category: 'treasury'
    },
    {
      id: 'prop-2',
      title: 'Implement Advanced Staking Rewards',
      description: 'Introduce tiered staking rewards based on lock period and amount',
      proposer: '0x8ba1f109...B29e',
      status: 'passed',
      votesFor: 23456789,
      votesAgainst: 5678901,
      totalVotes: 29135690,
      endDate: '2024-01-15T23:59:59Z',
      category: 'protocol'
    }
  ];

  const displayMetrics = (metrics as TokenMetrics) || defaultMetrics;
  const displayTransactions = (transactions as TokenTransaction[]) || defaultTransactions;
  const displayStakingPools = (stakingPools as StakingPool[]) || defaultStakingPools;
  const displayProposals = (proposals as GovernanceProposal[]) || defaultProposals;

  const handleStake = () => {
    if (!stakingAmount || !selectedPool) {
      toast({ title: "Missing information", description: "Please enter amount and select pool", variant: "destructive" });
      return;
    }
    stakeMutation.mutate({ amount: parseFloat(stakingAmount), poolId: selectedPool });
  };

  const handleTransfer = () => {
    if (!transferAmount || !transferTo) {
      toast({ title: "Missing information", description: "Please enter amount and recipient address", variant: "destructive" });
      return;
    }
    transferMutation.mutate({ amount: parseFloat(transferAmount), to: transferTo });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Coins className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p>Loading TERA Token data...</p>
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
            <Coins className="h-8 w-8 text-green-500" />
            Tera4-24-72 Justice ai-/KLOUD BUGS TERA Token
          </h1>
          <p className="text-muted-foreground">
            Social Justice Token • Community Governance • Staking Rewards
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="default" className="text-lg px-3 py-1">
            <Heart className="h-4 w-4 mr-1" />
            Justice Token
          </Badge>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Award className="h-4 w-4 mr-1" />
            Community Owned
          </Badge>
        </div>
      </div>

      {/* Token Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Price</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${displayMetrics.price.toFixed(4)}</div>
            <p className="text-xs text-green-500">
              +5.2% (24h)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(displayMetrics.marketCap / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              Circulating: {(displayMetrics.circulatingSupply / 1000000).toFixed(0)}M
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Holders</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayMetrics.holders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Growing community
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(displayMetrics.volume24h / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              Trading activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Token Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Circulating Supply</span>
                <span className="font-medium">{((displayMetrics.circulatingSupply / displayMetrics.totalSupply) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(displayMetrics.circulatingSupply / displayMetrics.totalSupply) * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">{(displayMetrics.circulatingSupply / 1000000).toFixed(0)}M TERA</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Locked/Staked</span>
                <span className="font-medium">{((displayMetrics.lockedTokens / displayMetrics.totalSupply) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(displayMetrics.lockedTokens / displayMetrics.totalSupply) * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">{(displayMetrics.lockedTokens / 1000000).toFixed(0)}M TERA</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Burned Tokens</span>
                <span className="font-medium">{((displayMetrics.burnedTokens / displayMetrics.totalSupply) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(displayMetrics.burnedTokens / displayMetrics.totalSupply) * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">{(displayMetrics.burnedTokens / 1000000).toFixed(0)}M TERA</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Development Fund</span>
                <span className="font-medium">5.0%</span>
              </div>
              <Progress value={5} className="h-2" />
              <div className="text-xs text-muted-foreground">50M TERA</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staking">Staking</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Token Utility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { feature: 'Social Justice Funding', status: 'Active', desc: 'Fund community impact projects' },
                    { feature: 'Governance Voting', status: 'Active', desc: 'Vote on protocol decisions' },
                    { feature: 'Staking Rewards', status: 'Active', desc: 'Earn passive income' },
                    { feature: 'Platform Access', status: 'Active', desc: 'Premium features unlock' },
                    { feature: 'Legal Aid Payments', status: 'Coming Soon', desc: 'Pay for TERJustice AI services' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.feature}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                      </div>
                      <Badge variant={item.status === 'Active' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    'Multi-signature treasury management',
                    'Time-locked governance proposals',
                    'Decentralized token distribution',
                    'Community-controlled burn mechanism',
                    'Transparent fund allocation'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Token Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  'Community voted to increase justice fund allocation by 15%',
                  'New staking pool launched with 15.5% APR',
                  '50,000 TERA tokens burned from transaction fees',
                  'Legal aid program funded with 500,000 TERA tokens',
                  'Governance proposal #12 passed with 78% approval'
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{activity}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {Math.floor(Math.random() * 24)} hours ago
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staking Tab */}
        <TabsContent value="staking" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Staking Pools
                  </CardTitle>
                  <CardDescription>
                    Stake your TERA tokens to earn rewards and support the ecosystem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayStakingPools.map((pool: StakingPool) => (
                      <div key={pool.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{pool.name}</h4>
                          <Badge variant="default" className="text-lg">
                            {pool.apr}% APR
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Lock Period</div>
                            <div className="font-medium">{pool.lockPeriod} days</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Total Staked</div>
                            <div className="font-medium">{(pool.totalStaked / 1000000).toFixed(1)}M</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Participants</div>
                            <div className="font-medium">{pool.participants.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Min Stake</div>
                            <div className="font-medium">{pool.minStake.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="flex justify-between text-sm mb-2">
                          <span>Pool Capacity</span>
                          <span>{((pool.totalStaked / pool.maxStake) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(pool.totalStaked / pool.maxStake) * 100} className="mb-4" />

                        <Button 
                          onClick={() => setSelectedPool(pool.id)}
                          variant={selectedPool === pool.id ? 'default' : 'outline'}
                          className="w-full"
                        >
                          {selectedPool === pool.id ? 'Selected' : 'Select Pool'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Stake Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount to Stake</label>
                  <Input
                    placeholder="Enter TERA amount"
                    value={stakingAmount}
                    onChange={(e) => setStakingAmount(e.target.value)}
                    type="number"
                  />
                  <div className="text-xs text-muted-foreground">
                    Balance: 15,750 TERA
                  </div>
                </div>

                {selectedPool && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selected Pool</label>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">
                        {displayStakingPools.find((p: StakingPool) => p.id === selectedPool)?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {displayStakingPools.find((p: StakingPool) => p.id === selectedPool)?.apr}% APR • {displayStakingPools.find((p: StakingPool) => p.id === selectedPool)?.lockPeriod} days lock
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleStake}
                  disabled={!stakingAmount || !selectedPool || stakeMutation.isPending}
                  className="w-full"
                >
                  {stakeMutation.isPending ? 'Staking...' : 'Stake Tokens'}
                </Button>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Your Staking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Staked</span>
                      <span className="font-medium">8,500 TERA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Rewards</span>
                      <span className="font-medium text-green-500">127.5 TERA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Unlock</span>
                      <span className="font-medium">45 days</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <Unlock className="h-4 w-4 mr-2" />
                  Claim Rewards
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Governance Tab */}
        <TabsContent value="governance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Community Governance
              </CardTitle>
              <CardDescription>
                Participate in protocol governance and community decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayProposals.map((proposal: GovernanceProposal) => (
                  <div key={proposal.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={
                        proposal.status === 'active' ? 'default' :
                        proposal.status === 'passed' ? 'secondary' :
                        proposal.status === 'rejected' ? 'destructive' : 'outline'
                      }>
                        {proposal.status}
                      </Badge>
                      <Badge variant="outline">{proposal.category}</Badge>
                    </div>

                    <h4 className="font-medium mb-2">{proposal.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{proposal.description}</p>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>For: {proposal.votesFor.toLocaleString()}</span>
                          <span>Against: {proposal.votesAgainst.toLocaleString()}</span>
                        </div>
                        <div className="flex gap-1">
                          <Progress 
                            value={(proposal.votesFor / proposal.totalVotes) * 100} 
                            className="flex-1 h-2"
                          />
                          <Progress 
                            value={(proposal.votesAgainst / proposal.totalVotes) * 100} 
                            className="flex-1 h-2"
                          />
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Proposed by: {proposal.proposer}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Voting ends: {new Date(proposal.endDate).toLocaleDateString()}
                      </div>

                      {proposal.status === 'active' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => voteMutation.mutate({ proposalId: proposal.id, vote: 'for' })}
                          >
                            Vote For
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => voteMutation.mutate({ proposalId: proposal.id, vote: 'against' })}
                          >
                            Vote Against
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayTransactions.map((tx: TokenTransaction) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                        <ArrowUpDown className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium capitalize">{tx.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {tx.amount.toLocaleString()} TERA
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge variant={
                        tx.status === 'confirmed' ? 'default' :
                        tx.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {tx.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer Tab */}
        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Transfer TERA Tokens
              </CardTitle>
              <CardDescription>
                Send TERA tokens to another wallet address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient Address</label>
                <Input
                  placeholder="0x742d35Cc6ab5aD8C4de22d5f99d11639C7E3C4de"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  placeholder="Enter TERA amount"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  type="number"
                />
                <div className="text-xs text-muted-foreground">
                  Available balance: 15,750 TERA
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Network Fee</label>
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between">
                    <span>Transaction Fee</span>
                    <span>~0.1 TERA</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleTransfer}
                disabled={!transferAmount || !transferTo || transferMutation.isPending}
                className="w-full"
              >
                {transferMutation.isPending ? 'Sending...' : 'Send Tokens'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}