import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  TrendingUp, 
  ArrowRightLeft, 
  Play, 
  DollarSign, 
  Bitcoin,
  Zap,
  Target,
  Settings
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface CryptoHolding {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  source: 'mining' | 'trading' | 'tera';
  availableForTrading: number;
  locked: number;
}

interface TradingConfig {
  symbol: string;
  enabled: boolean;
  strategy: 'conservative' | 'aggressive' | 'balanced';
  allocation: number;
  stopLoss: number;
  takeProfit: number;
}

export default function CryptoPortfolio() {
  const [, setLocation] = useLocation();
  const [selectedCrypto, setSelectedCrypto] = useState<string>('');
  const [tradingConfigs, setTradingConfigs] = useState<{ [key: string]: TradingConfig }>({});
  
  const queryClient = useQueryClient();

  // Fetch crypto portfolio
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['/api/crypto/portfolio'],
    refetchInterval: 10000,
  });

  // Fetch trading status
  const { data: tradingStatus } = useQuery({
    queryKey: ['/api/trading/status'],
    refetchInterval: 5000,
  });

  // Start trading mutation
  const startTradingMutation = useMutation({
    mutationFn: (data: { symbol: string; config: TradingConfig }) => 
      apiRequest('/api/trading/start', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
      setLocation('/'); // Navigate to trading dashboard
    },
  });

  // Update trading config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: { symbol: string; config: TradingConfig }) => 
      apiRequest('/api/trading/config', 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading/status'] });
    },
  });

  const handleStartTrading = (symbol: string) => {
    const config = tradingConfigs[symbol] || {
      symbol,
      enabled: true,
      strategy: 'balanced',
      allocation: 50,
      stopLoss: 5,
      takeProfit: 10
    };
    
    startTradingMutation.mutate({ symbol, config });
  };

  const handleUpdateConfig = (symbol: string, updates: Partial<TradingConfig>) => {
    const newConfig = { 
      ...tradingConfigs[symbol], 
      ...updates,
      symbol 
    } as TradingConfig;
    
    setTradingConfigs(prev => ({ ...prev, [symbol]: newConfig }));
    updateConfigMutation.mutate({ symbol, config: newConfig });
  };

  // Mock portfolio data
  const defaultPortfolio: CryptoHolding[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: 0.15423,
      value: 6632.99,
      change24h: 2.45,
      source: 'mining',
      availableForTrading: 0.15423,
      locked: 0
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: 2.8945,
      value: 7238.75,
      change24h: -1.23,
      source: 'mining',
      availableForTrading: 2.8945,
      locked: 0
    },
    {
      symbol: 'TERA',
      name: 'TERA Token',
      balance: 125000.50,
      value: 62500.25,
      change24h: 8.75,
      source: 'tera',
      availableForTrading: 75000.00,
      locked: 50000.50
    },
    {
      symbol: 'LTC',
      name: 'Litecoin',
      balance: 12.456,
      value: 1089.45,
      change24h: 0.89,
      source: 'mining',
      availableForTrading: 12.456,
      locked: 0
    }
  ];

  const displayPortfolio = portfolio || defaultPortfolio;
  const totalValue = displayPortfolio.reduce((sum, holding) => sum + holding.value, 0);
  const totalChange24h = displayPortfolio.reduce((sum, holding) => sum + (holding.value * holding.change24h / 100), 0);
  const totalChangePercent = (totalChange24h / totalValue) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <p>Loading crypto portfolio...</p>
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
            <Wallet className="h-8 w-8 text-blue-500" />
            Crypto Portfolio & Trading
          </h1>
          <p className="text-muted-foreground">
            Manage your mined crypto and deploy automated trading strategies
          </p>
        </div>
        <Button onClick={() => setLocation('/')} className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Go to Trading Dashboard
        </Button>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className={`text-xs ${totalChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}% (24h)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available for Trading</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${displayPortfolio.reduce((sum, h) => sum + (h.availableForTrading / h.balance * h.value), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to trade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
            <Play className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tradingStatus?.activeTrades || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Running strategies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mining Revenue</CardTitle>
            <Bitcoin className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${displayPortfolio.filter(h => h.source === 'mining').reduce((sum, h) => sum + h.value, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From mining operations
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="trading">Trading Setup</TabsTrigger>
          <TabsTrigger value="deploy">Deploy Trading</TabsTrigger>
        </TabsList>

        {/* Holdings Tab */}
        <TabsContent value="holdings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPortfolio.map((holding) => (
              <Card key={holding.symbol} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {holding.symbol.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{holding.symbol}</CardTitle>
                        <CardDescription className="text-xs">{holding.name}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={holding.source === 'mining' ? 'default' : 'secondary'}>
                      {holding.source}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Balance:</span>
                      <span className="font-medium">{holding.balance.toLocaleString()} {holding.symbol}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Value:</span>
                      <span className="font-medium">${holding.value.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>24h Change:</span>
                      <span className={`font-medium ${holding.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {holding.change24h >= 0 ? '+' : ''}{holding.change24h}%
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Available for Trading</span>
                      <span>{((holding.availableForTrading / holding.balance) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(holding.availableForTrading / holding.balance) * 100} className="h-2" />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedCrypto(holding.symbol);
                      // Switch to trading setup tab
                      document.querySelector('[value="trading"]')?.click();
                    }}
                    disabled={holding.availableForTrading === 0}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Setup Trading
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trading Setup Tab */}
        <TabsContent value="trading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Trading Configuration
              </CardTitle>
              <CardDescription>
                Configure automated trading strategies for your crypto holdings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Cryptocurrency</label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose crypto to trade" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayPortfolio.filter(h => h.availableForTrading > 0).map((holding) => (
                      <SelectItem key={holding.symbol} value={holding.symbol}>
                        {holding.symbol} - {holding.name} (${holding.value.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCrypto && (
                <div className="space-y-4 border rounded-lg p-4">
                  <h3 className="font-medium">{selectedCrypto} Trading Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Trading Strategy</label>
                      <Select 
                        value={tradingConfigs[selectedCrypto]?.strategy || 'balanced'}
                        onValueChange={(value) => handleUpdateConfig(selectedCrypto, { strategy: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conservative">Conservative (Low Risk)</SelectItem>
                          <SelectItem value="balanced">Balanced (Medium Risk)</SelectItem>
                          <SelectItem value="aggressive">Aggressive (High Risk)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Allocation Percentage</label>
                      <Input 
                        type="number"
                        min="1"
                        max="100"
                        value={tradingConfigs[selectedCrypto]?.allocation || 50}
                        onChange={(e) => handleUpdateConfig(selectedCrypto, { allocation: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Stop Loss (%)</label>
                      <Input 
                        type="number"
                        min="1"
                        max="20"
                        value={tradingConfigs[selectedCrypto]?.stopLoss || 5}
                        onChange={(e) => handleUpdateConfig(selectedCrypto, { stopLoss: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Take Profit (%)</label>
                      <Input 
                        type="number"
                        min="1"
                        max="50"
                        value={tradingConfigs[selectedCrypto]?.takeProfit || 10}
                        onChange={(e) => handleUpdateConfig(selectedCrypto, { takeProfit: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Enable Automated Trading</div>
                      <div className="text-sm text-muted-foreground">
                        Start trading with configured settings
                      </div>
                    </div>
                    <Switch 
                      checked={tradingConfigs[selectedCrypto]?.enabled || false}
                      onCheckedChange={(checked) => handleUpdateConfig(selectedCrypto, { enabled: checked })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deploy Trading Tab */}
        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Deploy Trading Strategies
              </CardTitle>
              <CardDescription>
                Push your crypto to the trading dashboard and start automated trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {displayPortfolio.filter(h => h.availableForTrading > 0).map((holding) => (
                <div key={holding.symbol} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {holding.symbol.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium">{holding.symbol} - {holding.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Available: {holding.availableForTrading.toLocaleString()} {holding.symbol} 
                          (${(holding.availableForTrading / holding.balance * holding.value).toLocaleString()})
                        </p>
                      </div>
                    </div>
                    <Badge variant={tradingStatus?.activeTrades?.[holding.symbol] ? 'default' : 'secondary'}>
                      {tradingStatus?.activeTrades?.[holding.symbol] ? 'Trading Active' : 'Ready to Trade'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Strategy</div>
                      <div className="font-medium capitalize">
                        {tradingConfigs[holding.symbol]?.strategy || 'Balanced'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Allocation</div>
                      <div className="font-medium">
                        {tradingConfigs[holding.symbol]?.allocation || 50}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Stop Loss</div>
                      <div className="font-medium">
                        {tradingConfigs[holding.symbol]?.stopLoss || 5}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Take Profit</div>
                      <div className="font-medium">
                        {tradingConfigs[holding.symbol]?.takeProfit || 10}%
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleStartTrading(holding.symbol)}
                      disabled={startTradingMutation.isPending || tradingStatus?.activeTrades?.[holding.symbol]}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {tradingStatus?.activeTrades?.[holding.symbol] ? 'Trading Active' : 'Start Trading'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setLocation('/')}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      View on Dashboard
                    </Button>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Ready to Deploy?</h3>
                <p className="text-muted-foreground">
                  Your crypto will be automatically managed by our AI trading system. 
                  Monitor performance and adjust strategies on the main trading dashboard.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => setLocation('/')}
                  className="w-full max-w-md"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Go to Trading Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}