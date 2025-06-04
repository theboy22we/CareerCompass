import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MarketSelectorProps {
  onSelectionChange: (exchange: string, symbol: string) => void;
  className?: string;
}

const EXCHANGES = [
  {
    id: 'kraken',
    name: 'Kraken',
    icon: '🐙',
    status: 'connected',
    description: 'Professional crypto exchange'
  },
  {
    id: 'binance',
    name: 'Binance',
    icon: '🟡',
    status: 'coming-soon',
    description: 'Global crypto exchange'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Pro',
    icon: '🔵',
    status: 'coming-soon',
    description: 'US-based exchange'
  },
  {
    id: 'bybit',
    name: 'Bybit',
    icon: '⚡',
    status: 'coming-soon',
    description: 'Derivatives trading'
  }
];

const CRYPTOCURRENCIES = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    pairs: ['BTCUSD', 'BTCEUR', 'BTCUSDT'],
    color: '#F7931A',
    status: 'active'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    pairs: ['ETHUSD', 'ETHEUR', 'ETHUSDT', 'ETHBTC'],
    color: '#627EEA',
    status: 'coming-soon'
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    icon: '◈',
    pairs: ['ADAUSD', 'ADAEUR', 'ADAUSDT', 'ADABTC'],
    color: '#0033AD',
    status: 'coming-soon'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    icon: '◉',
    pairs: ['SOLUSD', 'SOLEUR', 'SOLUSDT', 'SOLBTC'],
    color: '#9945FF',
    status: 'coming-soon'
  },
  {
    symbol: 'DOT',
    name: 'Polkadot',
    icon: '●',
    pairs: ['DOTUSD', 'DOTEUR', 'DOTUSDT', 'DOTBTC'],
    color: '#E6007A',
    status: 'coming-soon'
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    icon: '🔗',
    pairs: ['LINKUSD', 'LINKEUR', 'LINKUSDT', 'LINKBTC'],
    color: '#375BD2',
    status: 'coming-soon'
  }
];

export function MarketSelector({ onSelectionChange, className }: MarketSelectorProps) {
  const [selectedExchange, setSelectedExchange] = useState('kraken');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [selectedPair, setSelectedPair] = useState('BTCUSD');

  const handleExchangeChange = (exchangeId: string) => {
    setSelectedExchange(exchangeId);
    onSelectionChange(exchangeId, selectedPair);
  };

  const handleCryptoChange = (cryptoSymbol: string) => {
    setSelectedCrypto(cryptoSymbol);
    const crypto = CRYPTOCURRENCIES.find(c => c.symbol === cryptoSymbol);
    if (crypto && crypto.pairs.length > 0) {
      setSelectedPair(crypto.pairs[0]);
      onSelectionChange(selectedExchange, crypto.pairs[0]);
    }
  };

  const handlePairChange = (pair: string) => {
    setSelectedPair(pair);
    onSelectionChange(selectedExchange, pair);
  };

  const selectedCryptoData = CRYPTOCURRENCIES.find(c => c.symbol === selectedCrypto);

  return (
    <Card className={`cosmic-card ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3" style={{fontFamily: 'Orbitron', letterSpacing: '1px'}}>
          <i className="fas fa-chart-line text-accent"></i>
          <span className="text-primary">MARKET SELECTION</span>
          <i className="fas fa-globe text-accent ml-auto"></i>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Exchange Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground" style={{fontFamily: 'Rajdhani', letterSpacing: '0.5px'}}>
            Exchange Platform
          </label>
          <div className="grid grid-cols-2 gap-3">
            {EXCHANGES.map((exchange) => (
              <button
                key={exchange.id}
                onClick={() => exchange.status === 'connected' ? handleExchangeChange(exchange.id) : null}
                disabled={exchange.status !== 'connected'}
                className={`
                  cosmic-action-btn p-4 text-left transition-all duration-300
                  ${selectedExchange === exchange.id 
                    ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 border-accent' 
                    : 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 border-gray-500'
                  }
                  ${exchange.status !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{exchange.icon}</span>
                  <div>
                    <div className="font-bold text-sm">{exchange.name}</div>
                    <div className="text-xs text-muted-foreground">{exchange.description}</div>
                  </div>
                </div>
                {exchange.status === 'coming-soon' && (
                  <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
                )}
                {exchange.status === 'connected' && selectedExchange === exchange.id && (
                  <Badge variant="default" className="mt-2 text-xs bg-accent text-accent-foreground">Active</Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Cryptocurrency Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground" style={{fontFamily: 'Rajdhani', letterSpacing: '0.5px'}}>
            Cryptocurrency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CRYPTOCURRENCIES.map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => crypto.status === 'active' ? handleCryptoChange(crypto.symbol) : null}
                disabled={crypto.status !== 'active'}
                className={`
                  cosmic-action-btn p-3 text-center transition-all duration-300
                  ${selectedCrypto === crypto.symbol 
                    ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 border-accent' 
                    : 'bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 border-gray-500'
                  }
                  ${crypto.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={crypto.status === 'active' ? { borderColor: crypto.color } : {}}
              >
                <div className="text-xl mb-1" style={{ color: crypto.color }}>{crypto.icon}</div>
                <div className="font-bold text-xs">{crypto.symbol}</div>
                <div className="text-xs text-muted-foreground truncate">{crypto.name}</div>
                {crypto.status === 'coming-soon' && (
                  <Badge variant="secondary" className="mt-1 text-xs">Soon</Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Trading Pair Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground" style={{fontFamily: 'Rajdhani', letterSpacing: '0.5px'}}>
            Trading Pair
          </label>
          <Select value={selectedPair} onValueChange={handlePairChange}>
            <SelectTrigger className="cosmic-card border-border">
              <SelectValue placeholder="Select trading pair" />
            </SelectTrigger>
            <SelectContent className="cosmic-card border-border">
              {selectedCryptoData?.pairs.map((pair) => (
                <SelectItem key={pair} value={pair} className="hover:bg-muted">
                  <div className="flex items-center space-x-2">
                    <span style={{ color: selectedCryptoData.color }}>{selectedCryptoData.icon}</span>
                    <span className="font-medium">{pair}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Selection Summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Current Configuration</div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Exchange:</span>
            <Badge variant="outline" className="border-accent text-accent">
              {EXCHANGES.find(e => e.id === selectedExchange)?.name}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Trading Pair:</span>
            <Badge variant="outline" className="border-primary text-primary">
              {selectedPair}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Status:</span>
            <Badge variant="default" className="bg-green-600 text-white">
              <i className="fas fa-circle mr-1 text-xs"></i>
              Connected
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}