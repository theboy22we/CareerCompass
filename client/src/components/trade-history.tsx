import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Trade {
  id: number;
  type: 'BUY' | 'SELL';
  amount: string;
  price: string;
  profit?: string;
  positionSize: string;
  entryPrice?: string;
  exitPrice?: string;
  signal: string;
  status: 'OPEN' | 'CLOSED' | 'FAILED';
  timestamp: Date;
}

interface TradeHistoryProps {
  trades: Trade[];
  className?: string;
}

export function TradeHistory({ trades, className }: TradeHistoryProps) {
  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toLocaleString()}`;
  };

  const formatProfit = (profit?: string) => {
    if (!profit) return '$0.00';
    const value = parseFloat(profit);
    return `${value >= 0 ? '+' : ''}$${value.toFixed(2)}`;
  };

  const getProfitColor = (profit?: string) => {
    if (!profit) return 'text-gray-400';
    const value = parseFloat(profit);
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="outline" className="text-blue-400 border-blue-400">OPEN</Badge>;
      case 'CLOSED':
        return <Badge variant="outline" className="text-green-400 border-green-400">CLOSED</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="text-red-400 border-red-400">FAILED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'BUY' 
      ? 'fas fa-arrow-up text-green-400' 
      : 'fas fa-arrow-down text-red-400';
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <i className="fas fa-history text-blue-400" />
          <span>Trade History</span>
          <Badge variant="outline" className="ml-auto">
            {trades.length} trades
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {trades.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <i className="fas fa-chart-line text-4xl mb-4 opacity-50" />
                <p>No trades yet</p>
                <p className="text-sm">Start the bot to begin trading</p>
              </div>
            ) : (
              trades.map((trade) => (
                <div
                  key={trade.id}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <i className={getTypeIcon(trade.type)} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{trade.type}</span>
                          {getStatusBadge(trade.status)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getProfitColor(trade.profit)}`}>
                        {formatProfit(trade.profit)}
                      </div>
                      <div className="text-sm text-gray-400">
                        ${trade.positionSize}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Entry: </span>
                      <span className="text-white">
                        {formatPrice(trade.entryPrice || trade.price)}
                      </span>
                    </div>
                    {trade.exitPrice && (
                      <div>
                        <span className="text-gray-400">Exit: </span>
                        <span className="text-white">
                          {formatPrice(trade.exitPrice)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-400 bg-gray-800 rounded px-2 py-1">
                    {trade.signal}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
