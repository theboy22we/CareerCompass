import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, TestTube2, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface CustomAIForm {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  modelName: string;
  type: 'prediction' | 'analysis' | 'sentiment' | 'strategy';
  headers: string; // JSON string
}

interface CustomAIManagerProps {
  models: any[];
  onModelAdded?: () => void;
}

export function CustomAIManager({ models, onModelAdded }: CustomAIManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [form, setForm] = useState<CustomAIForm>({
    id: '',
    name: '',
    endpoint: '',
    apiKey: '',
    modelName: '',
    type: 'prediction',
    headers: '{}'
  });

  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Add custom model mutation
  const addModelMutation = useMutation({
    mutationFn: async (modelData: any) => {
      return apiRequest('/api/ai/models', {
        method: 'POST',
        body: JSON.stringify(modelData)
      });
    },
    onSuccess: () => {
      toast({
        title: "AI Model Added",
        description: "Your custom AI model has been successfully integrated!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/models'] });
      setIsAddingModel(false);
      setForm({
        id: '',
        name: '',
        endpoint: '',
        apiKey: '',
        modelName: '',
        type: 'prediction',
        headers: '{}'
      });
      if (onModelAdded) onModelAdded();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add custom AI model",
        variant: "destructive"
      });
    }
  });

  // Remove model mutation
  const removeModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      return apiRequest(`/api/ai/models/${modelId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "AI Model Removed",
        description: "Custom AI model has been removed successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/models'] });
    }
  });

  // Test model mutation
  const testModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      return apiRequest(`/api/ai/models/${modelId}/test`, {
        method: 'POST'
      });
    },
    onSuccess: (data, modelId) => {
      setTestResults(prev => ({ ...prev, [modelId]: data }));
      toast({
        title: data.success ? "Test Successful" : "Test Failed",
        description: data.success ? "Your AI model is working correctly!" : data.error,
        variant: data.success ? "default" : "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const headers = JSON.parse(form.headers);
      const modelData = {
        ...form,
        headers
      };
      addModelMutation.mutate(modelData);
    } catch (error) {
      toast({
        title: "Invalid Headers",
        description: "Please provide valid JSON for headers",
        variant: "destructive"
      });
    }
  };

  const customModels = models.filter(m => m.provider === 'custom');

  const generateModelId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `custom-${form.type}-${timestamp}-${random}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-cyber-gold">Custom AI Models</h3>
          <p className="text-sm text-muted-foreground">
            Integrate your own AI models into KLOUD BOT PRO
          </p>
        </div>
        <Button 
          onClick={() => setIsAddingModel(true)} 
          className="cosmic-button"
          disabled={isAddingModel}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add AI Model
        </Button>
      </div>

      {/* Add Model Form */}
      {isAddingModel && (
        <Card className="cosmic-card border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyber-gold">Add Custom AI Model</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Model Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Custom AI Model"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Model Type</Label>
                  <Select 
                    value={form.type} 
                    onValueChange={(value: any) => setForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prediction">Price Prediction</SelectItem>
                      <SelectItem value="analysis">Market Analysis</SelectItem>
                      <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                      <SelectItem value="strategy">Trading Strategy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endpoint">API Endpoint</Label>
                  <Input
                    id="endpoint"
                    value={form.endpoint}
                    onChange={(e) => setForm(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="https://your-ai-api.com/predict"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modelName">Model Name/ID</Label>
                  <Input
                    id="modelName"
                    value={form.modelName}
                    onChange={(e) => setForm(prev => ({ ...prev, modelName: e.target.value }))}
                    placeholder="your-model-v1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="your-api-key"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headers">Custom Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={form.headers}
                  onChange={(e) => setForm(prev => ({ ...prev, headers: e.target.value }))}
                  placeholder='{"X-Custom-Header": "value"}'
                  className="h-20"
                />
              </div>

              <div className="hidden">
                <Input
                  value={form.id || generateModelId()}
                  onChange={(e) => setForm(prev => ({ ...prev, id: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="cosmic-button"
                  disabled={addModelMutation.isPending}
                >
                  {addModelMutation.isPending ? 'Adding...' : 'Add Model'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingModel(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Custom Models List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customModels.map((model) => (
          <Card key={model.id} className="cosmic-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{model.name}</span>
                  {model.active ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <Badge variant="outline" className="bg-purple-500/20 text-purple-300">
                  CUSTOM
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                <div><strong>Type:</strong> {model.type.toUpperCase()}</div>
                <div><strong>Model:</strong> {model.model}</div>
                <div><strong>Endpoint:</strong> {model.endpoint?.substring(0, 40)}...</div>
              </div>

              {testResults[model.id] && (
                <div className={`text-xs p-2 rounded border ${
                  testResults[model.id].success 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {testResults[model.id].success ? '✅ Working' : '❌ Error: ' + testResults[model.id].error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testModelMutation.mutate(model.id)}
                  disabled={testModelMutation.isPending}
                  className="flex-1"
                >
                  <TestTube2 className="h-3 w-3 mr-1" />
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeModelMutation.mutate(model.id)}
                  disabled={removeModelMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Last used: {new Date(model.lastUsed).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        ))}

        {customModels.length === 0 && (
          <Card className="cosmic-card col-span-full">
            <CardContent className="text-center py-8">
              <div className="text-muted-foreground">
                <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No custom AI models added yet</p>
                <p className="text-sm">Add your own AI models to enhance trading capabilities</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* API Integration Guide */}
      <Card className="cosmic-card border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyber-gold">API Integration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Your AI model should accept POST requests with this format:</strong></p>
            <pre className="bg-black/50 p-3 rounded text-xs text-green-400">
{`{
  "type": "prediction|analysis|sentiment|strategy",
  "marketData": {
    "price": 43000,
    "change24h": 2.5,
    "volume": 1000000
  },
  "indicators": {
    "rsi": 65,
    "macd": 0.5,
    "bollinger": { "upper": 44000, "lower": 42000 }
  }
}`}
            </pre>
            
            <p><strong>Expected response format:</strong></p>
            <pre className="bg-black/50 p-3 rounded text-xs text-cyan-400">
{`{
  "prediction": "BUY|SELL|HOLD",
  "confidence": 85,
  "reasoning": "Technical analysis shows...",
  "timeframe": "1-4 hours",
  "targetPrice": 45000,
  "stopLoss": 41000
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}