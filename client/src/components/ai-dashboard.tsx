import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Brain, TrendingUp, BarChart3, Target, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { CustomAIManager } from '@/components/custom-ai-manager';

interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic';
  model: string;
  type: 'prediction' | 'analysis' | 'sentiment' | 'strategy';
  active: boolean;
  confidence: number;
  lastUsed: Date;
}

interface PredictionResult {
  model: string;
  prediction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  timeframe: string;
  targetPrice?: number;
  stopLoss?: number;
}

interface AnalysisResult {
  model: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  keyFactors: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  marketRegime: string;
}

export function AIDashboard() {
  const [activeTab, setActiveTab] = useState('models');

  // Fetch AI models and stats
  const { data: modelData } = useQuery({
    queryKey: ['/api/ai/models'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch AI predictions
  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['/api/ai/predictions'],
    refetchInterval: 60000, // Refresh every minute
    enabled: activeTab === 'predictions'
  });

  // Fetch AI analysis
  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/ai/analysis'],
    refetchInterval: 90000, // Refresh every 90 seconds
    enabled: activeTab === 'analysis'
  });

  // Fetch AI strategies
  const { data: strategies, isLoading: strategiesLoading } = useQuery({
    queryKey: ['/api/ai/strategies'],
    refetchInterval: 300000, // Refresh every 5 minutes
    enabled: activeTab === 'strategies'
  });

  const models = modelData?.models || [];
  const stats = modelData?.stats || { total: 0, active: 0, byProvider: {}, byType: {} };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-green-500';
      case 'anthropic': return 'bg-purple-500';
      case 'custom': return 'bg-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'prediction': return <TrendingUp className="h-4 w-4" />;
      case 'analysis': return <BarChart3 className="h-4 w-4" />;
      case 'sentiment': return <Brain className="h-4 w-4" />;
      case 'strategy': return <Target className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case 'BUY': return 'text-green-500 bg-green-500/10';
      case 'SELL': return 'text-red-500 bg-red-500/10';
      case 'HOLD': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'text-green-500 bg-green-500/10';
      case 'BEARISH': return 'text-red-500 bg-red-500/10';
      case 'NEUTRAL': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-500';
      case 'MEDIUM': return 'text-yellow-500';
      case 'HIGH': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI System Overview */}
      <Card className="cosmic-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyber-gold" />
            AI Trading System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyber-gold">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active Models</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.byProvider?.openai || 0}</div>
              <div className="text-sm text-muted-foreground">OpenAI Models</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{stats.byProvider?.anthropic || 0}</div>
              <div className="text-sm text-muted-foreground">Anthropic Models</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-500">{stats.byProvider?.custom || 0}</div>
              <div className="text-sm text-muted-foreground">Your AI Models</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="custom">Your AI</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map((model: AIModel) => (
              <Card key={model.id} className={`cosmic-card ${model.active ? 'border-green-500/50' : 'border-gray-500/50'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(model.type)}
                      <span className="text-sm">{model.name}</span>
                    </div>
                    {model.active ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`${getProviderColor(model.provider)} text-white`}>
                      {model.provider === 'custom' ? 'YOUR AI' : model.provider.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {model.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Model: {model.model}
                  </div>
                  {model.active && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Confidence</span>
                        <span>{model.confidence}%</span>
                      </div>
                      <Progress value={model.confidence} className="h-1" />
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Last used: {new Date(model.lastUsed).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Custom AI Tab */}
        <TabsContent value="custom" className="space-y-4">
          <CustomAIManager 
            models={models} 
            onModelAdded={() => {
              // Refresh models data when a new custom model is added
              // This will be handled by the query invalidation in CustomAIManager
            }}
          />
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {predictionsLoading ? (
            <div className="text-center py-8">Loading AI predictions...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictions?.predictions?.map((pred: PredictionResult, idx: number) => (
                <Card key={idx} className="cosmic-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-sm">{pred.model}</span>
                      <Badge className={getPredictionColor(pred.prediction)}>
                        {pred.prediction}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Confidence</span>
                        <span>{pred.confidence}%</span>
                      </div>
                      <Progress value={pred.confidence} className="h-1" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Timeframe:</strong> {pred.timeframe}
                    </div>
                    {pred.targetPrice && (
                      <div className="text-sm text-green-500">
                        <strong>Target:</strong> ${pred.targetPrice.toLocaleString()}
                      </div>
                    )}
                    {pred.stopLoss && (
                      <div className="text-sm text-red-500">
                        <strong>Stop Loss:</strong> ${pred.stopLoss.toLocaleString()}
                      </div>
                    )}
                    <Separator />
                    <div className="text-xs text-muted-foreground">
                      {pred.reasoning}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {analysisLoading ? (
            <div className="text-center py-8">Loading AI analysis...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis?.analysis?.map((anal: AnalysisResult, idx: number) => (
                <Card key={idx} className="cosmic-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-sm">{anal.model}</span>
                      <Badge className={getSentimentColor(anal.sentiment)}>
                        {anal.sentiment}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Market Score</span>
                      <span className="font-bold">{anal.score}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Risk Level</span>
                      <span className={`font-bold ${getRiskColor(anal.riskLevel)}`}>
                        {anal.riskLevel}
                      </span>
                    </div>
                    <div className="text-sm">
                      <strong>Market Regime:</strong> {anal.marketRegime}
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Key Factors:</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {anal.keyFactors.map((factor, i) => (
                          <li key={i}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Strategies Tab */}
        <TabsContent value="strategies" className="space-y-4">
          {strategiesLoading ? (
            <div className="text-center py-8">Loading AI strategies...</div>
          ) : (
            <div className="space-y-4">
              {strategies?.strategies?.map((strat: any, idx: number) => (
                <Card key={idx} className="cosmic-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {strat.model}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(strat.strategy, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}