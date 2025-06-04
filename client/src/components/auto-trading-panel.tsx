import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AutoTradingPanelProps {
  isActive: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function AutoTradingPanel({ isActive, onToggle, className }: AutoTradingPanelProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    priceAlerts: true,
    signalAlerts: true,
    tradeAlerts: true,
    aiPredictionAlerts: true,
    minConfidence: 75,
    soundEnabled: true,
    autoTradeEnabled: isActive
  });

  const handleAutoTradeToggle = async (enabled: boolean) => {
    try {
      setIsUpdating(true);
      await apiRequest('POST', '/api/bot/auto-trade', { enabled });
      
      setAlertSettings(prev => ({ ...prev, autoTradeEnabled: enabled }));
      onToggle(enabled);
      
      toast({
        title: enabled ? 'Auto-Trading Enabled' : 'Auto-Trading Disabled',
        description: enabled 
          ? 'Bot will now automatically execute trades based on AI and technical analysis'
          : 'Bot will only generate signals without executing trades',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle auto-trading mode',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSettingChange = (setting: string, value: boolean | number) => {
    setAlertSettings(prev => ({ ...prev, [setting]: value }));
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <i className="fas fa-robot text-blue-400" />
          <span>Auto-Trading Control</span>
          <Badge 
            variant={isActive ? "default" : "outline"}
            className={isActive ? "bg-green-600" : ""}
          >
            {isActive ? 'ACTIVE' : 'MANUAL'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-Trading Toggle */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label htmlFor="autoTrade" className="text-base font-medium">
                Auto-Trading Mode
              </Label>
              <p className="text-sm text-gray-400 mt-1">
                Enable fully automated trading based on AI predictions and technical signals
              </p>
            </div>
            <Switch
              id="autoTrade"
              checked={alertSettings.autoTradeEnabled}
              onCheckedChange={handleAutoTradeToggle}
              disabled={isUpdating}
            />
          </div>
          
          {alertSettings.autoTradeEnabled && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle text-green-400" />
                <span className="text-sm text-green-300 font-medium">
                  Auto-trading is active
                </span>
              </div>
              <p className="text-xs text-green-400 mt-1">
                Bot will execute trades automatically when confidence levels are met
              </p>
            </div>
          )}
        </div>

        <Separator className="bg-gray-600" />

        {/* Alert Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Alert Preferences</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="priceAlerts" className="text-sm">
                Price Movement Alerts
              </Label>
              <Switch
                id="priceAlerts"
                checked={alertSettings.priceAlerts}
                onCheckedChange={(checked) => handleSettingChange('priceAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="signalAlerts" className="text-sm">
                Trading Signal Alerts
              </Label>
              <Switch
                id="signalAlerts"
                checked={alertSettings.signalAlerts}
                onCheckedChange={(checked) => handleSettingChange('signalAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="tradeAlerts" className="text-sm">
                Trade Execution Alerts
              </Label>
              <Switch
                id="tradeAlerts"
                checked={alertSettings.tradeAlerts}
                onCheckedChange={(checked) => handleSettingChange('tradeAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="aiAlerts" className="text-sm">
                AI Prediction Alerts
              </Label>
              <Switch
                id="aiAlerts"
                checked={alertSettings.aiPredictionAlerts}
                onCheckedChange={(checked) => handleSettingChange('aiPredictionAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="soundAlerts" className="text-sm">
                Sound Notifications
              </Label>
              <Switch
                id="soundAlerts"
                checked={alertSettings.soundEnabled}
                onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
              />
            </div>
          </div>
        </div>

        <Separator className="bg-gray-600" />

        {/* Trading Thresholds */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Trading Thresholds</h3>
          
          <div>
            <Label htmlFor="minConfidence" className="text-sm text-gray-400">
              Minimum Confidence for Auto-Trading (%)
            </Label>
            <div className="flex items-center space-x-3 mt-2">
              <Input
                id="minConfidence"
                type="number"
                min="50"
                max="95"
                value={alertSettings.minConfidence}
                onChange={(e) => handleSettingChange('minConfidence', parseInt(e.target.value))}
                className="bg-gray-700 border-gray-600 w-20"
              />
              <div className="flex-1">
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${alertSettings.minConfidence}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Higher values = fewer but more confident trades
            </p>
          </div>
        </div>

        <Separator className="bg-gray-600" />

        {/* Risk Management */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Risk Management</h3>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-700 rounded p-3">
              <div className="text-gray-400">Max Trades/Hour</div>
              <div className="font-semibold text-white">10</div>
            </div>
            <div className="bg-gray-700 rounded p-3">
              <div className="text-gray-400">Risk Level</div>
              <div className="font-semibold text-yellow-400">Moderate</div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <i className="fas fa-exclamation-triangle text-yellow-400 text-sm mt-0.5" />
              <div>
                <div className="text-sm text-yellow-300 font-medium">
                  Auto-Trading Risks
                </div>
                <p className="text-xs text-yellow-400 mt-1">
                  Automated trading involves financial risk. Monitor performance and adjust settings as needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Quick Actions</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              className="text-green-400 border-green-400 hover:bg-green-400/20"
              disabled={!alertSettings.autoTradeEnabled}
            >
              <i className="fas fa-play mr-2" />
              Resume
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/20"
              disabled={!alertSettings.autoTradeEnabled}
            >
              <i className="fas fa-pause mr-2" />
              Pause
            </Button>
          </div>
          
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
          >
            <i className="fas fa-stop mr-2" />
            Emergency Stop All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}