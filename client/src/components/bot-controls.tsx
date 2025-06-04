import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface BotControlsProps {
  isActive: boolean;
  currentPosition: {
    isOpen: boolean;
    type: 'BUY' | 'SELL' | null;
    amount: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    duration: number;
    stopLoss: number;
    takeProfit: number;
  } | null;
  settings: {
    currentPositionSize: string;
    maxPositionSize: string;
    takeProfitPercent: string;
    stopLossPercent: string;
  };
  onSettingsUpdate: () => void;
}

export function BotControls({ 
  isActive, 
  currentPosition, 
  settings, 
  onSettingsUpdate 
}: BotControlsProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const [formSettings, setFormSettings] = useState({
    maxPositionSize: settings.maxPositionSize,
    takeProfitPercent: settings.takeProfitPercent,
    stopLossPercent: settings.stopLossPercent
  });

  const handleStart = async () => {
    try {
      setIsUpdating(true);
      await apiRequest('POST', '/api/bot/start');
      toast({
        title: 'Bot Started',
        description: 'Trading bot is now active and monitoring markets.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start trading bot.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsUpdating(true);
      await apiRequest('POST', '/api/bot/stop');
      toast({
        title: 'Bot Stopped',
        description: 'Trading bot has been stopped.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop trading bot.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmergencyStop = async () => {
    if (!confirm('Are you sure you want to execute an emergency stop? This will immediately close all positions.')) {
      return;
    }

    try {
      setIsUpdating(true);
      await apiRequest('POST', '/api/bot/emergency-stop');
      toast({
        title: 'Emergency Stop Executed',
        description: 'All positions have been closed and the bot has been stopped.',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute emergency stop.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForceSignal = async (type: 'BUY' | 'SELL') => {
    if (!confirm(`Are you sure you want to force a ${type} signal?`)) {
      return;
    }

    try {
      setIsUpdating(true);
      await apiRequest('POST', '/api/bot/force-signal', { type });
      toast({
        title: 'Signal Executed',
        description: `Force ${type} signal has been executed.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to execute ${type} signal.`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      setIsUpdating(true);
      await apiRequest('PUT', '/api/bot/settings', formSettings);
      onSettingsUpdate();
      toast({
        title: 'Settings Updated',
        description: 'Bot settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update bot settings.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Bot Status - Cosmic Style */}
      <Card className="cosmic-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3" style={{fontFamily: 'Orbitron', letterSpacing: '1px'}}>
            <div className={`w-4 h-4 rounded-full ${isActive ? 'status-online' : 'status-offline'}`} />
            <span className="text-primary">KLOUD BOT STATUS</span>
            <i className="fas fa-satellite text-accent ml-auto"></i>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex space-x-4">
            {!isActive ? (
              <button 
                onClick={handleStart}
                disabled={isUpdating}
                className="cosmic-main-btn flex-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"
              >
                <span className="flex items-center justify-center">
                  <i className="fas fa-rocket mr-3 text-xl" />
                  ACTIVATE KLOUD BOT
                </span>
              </button>
            ) : (
              <button 
                onClick={handleStop}
                disabled={isUpdating}
                className="cosmic-main-btn flex-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-500"
              >
                <span className="flex items-center justify-center">
                  <i className="fas fa-pause mr-3 text-xl" />
                  DEACTIVATE BOT
                </span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleForceSignal('BUY')}
              disabled={isUpdating || !isActive || currentPosition?.isOpen}
              className="cosmic-action-btn bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-arrow-up mr-2" />
              <span>FORCE BUY</span>
            </button>
            <button
              onClick={() => handleForceSignal('SELL')}
              disabled={isUpdating || !isActive || currentPosition?.isOpen}
              className="cosmic-action-btn bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-arrow-down mr-2" />
              <span>FORCE SELL</span>
            </button>
          </div>

          <button 
            onClick={handleEmergencyStop}
            disabled={isUpdating}
            className="cosmic-action-btn w-full bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 border-red-500"
          >
            <i className="fas fa-exclamation-triangle mr-3" />
            <span>EMERGENCY SHUTDOWN</span>
          </button>
        </CardContent>
      </Card>

      {/* Current Position */}
      {currentPosition?.isOpen && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Current Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Position Type</div>
                <div className={`font-medium ${
                  currentPosition.type === 'BUY' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {currentPosition.type}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Position Size</div>
                <div className="font-medium">${currentPosition.amount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400">Entry Price</div>
                <div className="font-medium">${currentPosition.entryPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400">Current P&L</div>
                <div className={`font-medium ${
                  currentPosition.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {currentPosition.pnl >= 0 ? '+' : ''}${currentPosition.pnl.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Duration</div>
                <div className="font-medium">{formatDuration(currentPosition.duration)}</div>
              </div>
              <div>
                <div className="text-gray-400">Current Price</div>
                <div className="font-medium">${currentPosition.currentPrice.toLocaleString()}</div>
              </div>
            </div>
            
            <Separator className="bg-gray-600" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Take Profit</div>
                <div className="text-green-400 font-medium">
                  ${currentPosition.takeProfit.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Stop Loss</div>
                <div className="text-red-400 font-medium">
                  ${currentPosition.stopLoss.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bot Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Bot Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="currentSize" className="text-sm text-gray-400">
                Current Position Size
              </Label>
              <Input
                id="currentSize"
                value={`$${settings.currentPositionSize}`}
                disabled
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div>
              <Label htmlFor="maxSize" className="text-sm text-gray-400">
                Max Position Size ($)
              </Label>
              <Input
                id="maxSize"
                type="number"
                value={formSettings.maxPositionSize}
                onChange={(e) => setFormSettings(prev => ({
                  ...prev,
                  maxPositionSize: e.target.value
                }))}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div>
              <Label htmlFor="takeProfit" className="text-sm text-gray-400">
                Take Profit (%)
              </Label>
              <Input
                id="takeProfit"
                type="number"
                step="0.1"
                value={formSettings.takeProfitPercent}
                onChange={(e) => setFormSettings(prev => ({
                  ...prev,
                  takeProfitPercent: e.target.value
                }))}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div>
              <Label htmlFor="stopLoss" className="text-sm text-gray-400">
                Stop Loss (%)
              </Label>
              <Input
                id="stopLoss"
                type="number"
                step="0.1"
                value={formSettings.stopLossPercent}
                onChange={(e) => setFormSettings(prev => ({
                  ...prev,
                  stopLossPercent: e.target.value
                }))}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <Button
              onClick={handleSettingsUpdate}
              disabled={isUpdating}
              className="w-full"
            >
              Update Settings
            </Button>
          </div>

          <Separator className="bg-gray-600" />

          <div className="flex items-center justify-between">
            <Label htmlFor="audio" className="text-sm text-gray-400">
              Audio Alerts
            </Label>
            <Switch
              id="audio"
              checked={audioEnabled}
              onCheckedChange={setAudioEnabled}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
