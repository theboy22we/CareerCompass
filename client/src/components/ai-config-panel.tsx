import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

interface AIConfigPanelProps {
  className?: string;
}

interface AIConfig {
  // Signal Generation
  signalConfidenceThreshold: number;
  technicalWeight: number;
  aiWeight: number;
  sentimentWeight: number;
  volumeWeight: number;
  
  // Risk Management
  maxPositionSize: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  maxDailyLoss: number;
  maxConsecutiveLosses: number;
  
  // Pattern Recognition
  enablePatternLearning: boolean;
  minPatternOccurrences: number;
  patternSuccessThreshold: number;
  adaptiveLearning: boolean;
  
  // Market Conditions
  enableBearMarketMode: boolean;
  enableBullMarketMode: boolean;
  volatilityAdjustment: boolean;
  marketRegimeDetection: boolean;
  
  // Advanced Features
  enableDynamicScaling: boolean;
  scalingAggression: number;
  enableEmergencyStop: boolean;
  emergencyStopDrawdown: number;

  // Bot Identity
  botName: string;
  botPersonality: string;
}

export function AIConfigPanel({ className }: AIConfigPanelProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'signals' | 'risk' | 'patterns' | 'market' | 'advanced' | 'identity'>('signals');

  // Fetch current AI configuration
  const { data: config, isLoading } = useQuery<AIConfig>({
    queryKey: ['/api/ai/config'],
    staleTime: 30000,
  });

  // Mutation to update AI configuration
  const updateConfigMutation = useMutation({
    mutationFn: (newConfig: Partial<AIConfig>) => 
      apiRequest('/api/ai/config', 'PUT', newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/status'] });
    },
  });

  const [localConfig, setLocalConfig] = useState<AIConfig | null>(null);

  // Initialize local config when data loads
  if (config && !localConfig) {
    setLocalConfig(config);
  }

  const handleConfigChange = (key: keyof AIConfig, value: any) => {
    if (!localConfig) return;
    
    setLocalConfig(prev => ({
      ...prev!,
      [key]: value
    }));
  };

  const handleSaveConfig = () => {
    if (localConfig) {
      updateConfigMutation.mutate(localConfig);
    }
  };

  const resetToDefaults = () => {
    const defaults: AIConfig = {
      signalConfidenceThreshold: 70,
      technicalWeight: 40,
      aiWeight: 60,
      sentimentWeight: 20,
      volumeWeight: 15,
      maxPositionSize: 25,
      stopLossPercentage: 3,
      takeProfitPercentage: 6,
      maxDailyLoss: 500,
      maxConsecutiveLosses: 3,
      enablePatternLearning: true,
      minPatternOccurrences: 5,
      patternSuccessThreshold: 65,
      adaptiveLearning: true,
      enableBearMarketMode: true,
      enableBullMarketMode: true,
      volatilityAdjustment: true,
      marketRegimeDetection: true,
      enableDynamicScaling: true,
      scalingAggression: 50,
      enableEmergencyStop: true,
      emergencyStopDrawdown: 10,
      botName: 'BitBot Pro',
      botPersonality: 'professional',
    };
    setLocalConfig(defaults);
  };

  if (isLoading || !localConfig) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { id: 'signals', label: 'Signal Generation', icon: 'fa-chart-line' },
    { id: 'risk', label: 'Risk Management', icon: 'fa-shield-alt' },
    { id: 'patterns', label: 'Pattern Learning', icon: 'fa-brain' },
    { id: 'market', label: 'Market Conditions', icon: 'fa-globe' },
    { id: 'advanced', label: 'Advanced', icon: 'fa-cogs' },
  ];

  const getTabColor = (tabId: string) => {
    switch (tabId) {
      case 'signals': return 'text-blue-400 border-blue-400';
      case 'risk': return 'text-red-400 border-red-400';
      case 'patterns': return 'text-purple-400 border-purple-400';
      case 'market': return 'text-green-400 border-green-400';
      case 'advanced': return 'text-orange-400 border-orange-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-robot text-purple-400" />
            <span>AI Configuration</span>
            <Badge variant="outline" className="bg-purple-500/20 text-purple-300">
              Advanced
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="text-gray-300 border-gray-600"
            >
              <i className="fas fa-undo mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={updateConfigMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateConfigMutation.isPending ? (
                <i className="fas fa-spinner fa-spin mr-2" />
              ) : (
                <i className="fas fa-save mr-2" />
              )}
              Save Config
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? `${getTabColor(tab.id)} bg-gray-800`
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <i className={`fas ${tab.icon}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Signal Generation Tab */}
        {activeTab === 'signals' && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-300">
                Signal Confidence Threshold: {localConfig.signalConfidenceThreshold}%
              </Label>
              <p className="text-xs text-gray-500 mb-3">Minimum confidence required to execute trades</p>
              <Slider
                value={[localConfig.signalConfidenceThreshold]}
                onValueChange={([value]) => handleConfigChange('signalConfidenceThreshold', value)}
                min={50}
                max={95}
                step={5}
                className="w-full"
              />
            </div>

            <Separator className="bg-gray-600" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Technical Analysis Weight: {localConfig.technicalWeight}%
                </Label>
                <Slider
                  value={[localConfig.technicalWeight]}
                  onValueChange={([value]) => handleConfigChange('technicalWeight', value)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full mt-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-300">
                  AI Prediction Weight: {localConfig.aiWeight}%
                </Label>
                <Slider
                  value={[localConfig.aiWeight]}
                  onValueChange={([value]) => handleConfigChange('aiWeight', value)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Sentiment Weight: {localConfig.sentimentWeight}%
                </Label>
                <Slider
                  value={[localConfig.sentimentWeight]}
                  onValueChange={([value]) => handleConfigChange('sentimentWeight', value)}
                  min={0}
                  max={50}
                  step={5}
                  className="w-full mt-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Volume Weight: {localConfig.volumeWeight}%
                </Label>
                <Slider
                  value={[localConfig.volumeWeight]}
                  onValueChange={([value]) => handleConfigChange('volumeWeight', value)}
                  min={0}
                  max={30}
                  step={5}
                  className="w-full mt-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Risk Management Tab */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Max Position Size: {localConfig.maxPositionSize}%
                </Label>
                <p className="text-xs text-gray-500 mb-2">Maximum percentage of portfolio per trade</p>
                <Slider
                  value={[localConfig.maxPositionSize]}
                  onValueChange={([value]) => handleConfigChange('maxPositionSize', value)}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Stop Loss: {localConfig.stopLossPercentage}%
                </Label>
                <p className="text-xs text-gray-500 mb-2">Automatic stop loss percentage</p>
                <Slider
                  value={[localConfig.stopLossPercentage]}
                  onValueChange={([value]) => handleConfigChange('stopLossPercentage', value)}
                  min={1}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Take Profit: {localConfig.takeProfitPercentage}%
                </Label>
                <p className="text-xs text-gray-500 mb-2">Automatic profit taking percentage</p>
                <Slider
                  value={[localConfig.takeProfitPercentage]}
                  onValueChange={([value]) => handleConfigChange('takeProfitPercentage', value)}
                  min={2}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-300">Max Daily Loss</Label>
                <p className="text-xs text-gray-500 mb-2">Maximum loss per day in USD</p>
                <Input
                  type="number"
                  value={localConfig.maxDailyLoss}
                  onChange={(e) => handleConfigChange('maxDailyLoss', Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">
                Max Consecutive Losses: {localConfig.maxConsecutiveLosses}
              </Label>
              <p className="text-xs text-gray-500 mb-2">Bot stops after this many consecutive losing trades</p>
              <Slider
                value={[localConfig.maxConsecutiveLosses]}
                onValueChange={([value]) => handleConfigChange('maxConsecutiveLosses', value)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Pattern Learning Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-300">Enable Pattern Learning</Label>
                <p className="text-xs text-gray-500">AI learns from successful trading patterns</p>
              </div>
              <Switch
                checked={localConfig.enablePatternLearning}
                onCheckedChange={(checked) => handleConfigChange('enablePatternLearning', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-300">Adaptive Learning</Label>
                <p className="text-xs text-gray-500">AI adapts strategies based on market conditions</p>
              </div>
              <Switch
                checked={localConfig.adaptiveLearning}
                onCheckedChange={(checked) => handleConfigChange('adaptiveLearning', checked)}
              />
            </div>

            <Separator className="bg-gray-600" />

            <div>
              <Label className="text-sm font-medium text-gray-300">
                Min Pattern Occurrences: {localConfig.minPatternOccurrences}
              </Label>
              <p className="text-xs text-gray-500 mb-2">Minimum times a pattern must occur to be considered valid</p>
              <Slider
                value={[localConfig.minPatternOccurrences]}
                onValueChange={([value]) => handleConfigChange('minPatternOccurrences', value)}
                min={3}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">
                Pattern Success Threshold: {localConfig.patternSuccessThreshold}%
              </Label>
              <p className="text-xs text-gray-500 mb-2">Minimum success rate for patterns to be used</p>
              <Slider
                value={[localConfig.patternSuccessThreshold]}
                onValueChange={([value]) => handleConfigChange('patternSuccessThreshold', value)}
                min={50}
                max={90}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Market Conditions Tab */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Bear Market Mode</Label>
                  <p className="text-xs text-gray-500">Adjust strategy for bear markets</p>
                </div>
                <Switch
                  checked={localConfig.enableBearMarketMode}
                  onCheckedChange={(checked) => handleConfigChange('enableBearMarketMode', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Bull Market Mode</Label>
                  <p className="text-xs text-gray-500">Adjust strategy for bull markets</p>
                </div>
                <Switch
                  checked={localConfig.enableBullMarketMode}
                  onCheckedChange={(checked) => handleConfigChange('enableBullMarketMode', checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Volatility Adjustment</Label>
                  <p className="text-xs text-gray-500">Adjust position sizes based on volatility</p>
                </div>
                <Switch
                  checked={localConfig.volatilityAdjustment}
                  onCheckedChange={(checked) => handleConfigChange('volatilityAdjustment', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Market Regime Detection</Label>
                  <p className="text-xs text-gray-500">Detect trending vs ranging markets</p>
                </div>
                <Switch
                  checked={localConfig.marketRegimeDetection}
                  onCheckedChange={(checked) => handleConfigChange('marketRegimeDetection', checked)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-300">Dynamic Scaling</Label>
                <p className="text-xs text-gray-500">Increase position sizes after wins</p>
              </div>
              <Switch
                checked={localConfig.enableDynamicScaling}
                onCheckedChange={(checked) => handleConfigChange('enableDynamicScaling', checked)}
              />
            </div>

            {localConfig.enableDynamicScaling && (
              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Scaling Aggression: {localConfig.scalingAggression}%
                </Label>
                <p className="text-xs text-gray-500 mb-2">How aggressively to scale positions</p>
                <Slider
                  value={[localConfig.scalingAggression]}
                  onValueChange={([value]) => handleConfigChange('scalingAggression', value)}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            )}

            <Separator className="bg-gray-600" />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-300">Emergency Stop</Label>
                <p className="text-xs text-gray-500">Automatic shutdown on large drawdowns</p>
              </div>
              <Switch
                checked={localConfig.enableEmergencyStop}
                onCheckedChange={(checked) => handleConfigChange('enableEmergencyStop', checked)}
              />
            </div>

            {localConfig.enableEmergencyStop && (
              <div>
                <Label className="text-sm font-medium text-gray-300">
                  Emergency Stop Drawdown: {localConfig.emergencyStopDrawdown}%
                </Label>
                <p className="text-xs text-gray-500 mb-2">Stop trading if drawdown exceeds this percentage</p>
                <Slider
                  value={[localConfig.emergencyStopDrawdown]}
                  onValueChange={([value]) => handleConfigChange('emergencyStopDrawdown', value)}
                  min={5}
                  max={25}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        {/* Status Information */}
        <div className="bg-gray-700 rounded-lg p-4 mt-6">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-300">
              <div className="flex items-center space-x-2 mb-1">
                <i className="fas fa-info-circle text-blue-400" />
                <span className="font-medium">Configuration Status</span>
              </div>
              <div className="text-xs text-gray-400">
                Last updated: {config ? new Date().toLocaleString() : 'Never'}
              </div>
            </div>
            <div className="text-right">
              {updateConfigMutation.isSuccess && (
                <div className="flex items-center text-green-400 text-xs">
                  <i className="fas fa-check-circle mr-1" />
                  <span>Saved successfully</span>
                </div>
              )}
              {updateConfigMutation.isError && (
                <div className="flex items-center text-red-400 text-xs">
                  <i className="fas fa-exclamation-circle mr-1" />
                  <span>Save failed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}