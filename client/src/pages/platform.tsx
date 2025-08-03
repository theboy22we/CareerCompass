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
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Layers, 
  Cpu, 
  Cloud, 
  Shield,
  Zap,
  Globe,
  Users,
  Settings,
  Monitor,
  Database,
  Network,
  Server,
  Activity,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Folder,
  FileCode,
  Package
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PlatformService {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'deploying';
  type: 'microservice' | 'database' | 'api' | 'frontend' | 'ai' | 'blockchain';
  version: string;
  uptime: number;
  cpu: number;
  memory: number;
  requests: number;
  errors: number;
  endpoint?: string;
  description: string;
}

interface AppIntegration {
  id: string;
  name: string;
  type: 'external' | 'local' | 'container' | 'serverless';
  status: 'active' | 'inactive' | 'pending' | 'error';
  path?: string;
  port?: number;
  endpoints: string[];
  dependencies: string[];
  config: Record<string, any>;
}

interface DeploymentConfig {
  id: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  replicas: number;
  resources: {
    cpu: string;
    memory: string;
    storage: string;
  };
  scaling: {
    min: number;
    max: number;
    targetCpu: number;
  };
}

export default function Platform() {
  const [selectedService, setSelectedService] = useState<string>('');
  const [newAppPath, setNewAppPath] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [deploymentEnv, setDeploymentEnv] = useState<string>('development');
  const [activeTab, setActiveTab] = useState('overview');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch platform services
  const { data: services, isLoading } = useQuery({
    queryKey: ['/api/platform/services'],
    refetchInterval: 10000,
  });

  // Fetch app integrations
  const { data: integrations } = useQuery({
    queryKey: ['/api/platform/integrations'],
    refetchInterval: 15000,
  });

  // Fetch deployment configs
  const { data: deployments } = useQuery({
    queryKey: ['/api/platform/deployments'],
  });

  // Deploy service mutation
  const deployMutation = useMutation({
    mutationFn: (data: { serviceId: string; config: any }) => 
      apiRequest('/api/platform/deploy', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform/services'] });
      toast({ title: "Service deployed", description: "Service is now running successfully!" });
    },
  });

  // Integrate app mutation
  const integrateMutation = useMutation({
    mutationFn: (data: { name: string; path: string; type: string }) => 
      apiRequest('/api/platform/integrate', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform/integrations'] });
      setNewAppPath('');
      setNewAppName('');
      toast({ title: "App integrated", description: "Application has been successfully integrated!" });
    },
  });

  // Mock data
  const defaultServices: PlatformService[] = [
    {
      id: 'trading-api',
      name: 'Trading API',
      status: 'running',
      type: 'api',
      version: '2.1.4',
      uptime: 99.8,
      cpu: 35,
      memory: 512,
      requests: 15678,
      errors: 12,
      endpoint: '/api/trading',
      description: 'Core trading functionality and market data'
    },
    {
      id: 'mining-service',
      name: 'Mining Control Service',
      status: 'running',
      type: 'microservice',
      version: '1.8.2',
      uptime: 99.9,
      cpu: 28,
      memory: 256,
      requests: 8934,
      errors: 3,
      endpoint: '/api/mining',
      description: 'Mining rig monitoring and control'
    },
    {
      id: 'terajustice-ai',
      name: 'TERJustice AI Engine',
      status: 'running',
      type: 'ai',
      version: '3.0.1',
      uptime: 98.5,
      cpu: 65,
      memory: 1024,
      requests: 4567,
      errors: 8,
      endpoint: '/api/terajustice',
      description: 'Legal research and case analysis AI'
    },
    {
      id: 'cafe-platform',
      name: 'Cafe Management Platform',
      status: 'running',
      type: 'frontend',
      version: '1.2.0',
      uptime: 99.7,
      cpu: 15,
      memory: 128,
      requests: 2345,
      errors: 1,
      endpoint: '/cafe',
      description: 'Community cafe ordering and events'
    },
    {
      id: 'tera-blockchain',
      name: 'TERA Token Blockchain',
      status: 'running',
      type: 'blockchain',
      version: '2.4.6',
      uptime: 100.0,
      cpu: 45,
      memory: 2048,
      requests: 12890,
      errors: 0,
      endpoint: '/api/tera',
      description: 'TERA token operations and governance'
    },
    {
      id: 'postgres-db',
      name: 'PostgreSQL Database',
      status: 'running',
      type: 'database',
      version: '14.2',
      uptime: 99.9,
      cpu: 25,
      memory: 1536,
      requests: 45678,
      errors: 5,
      description: 'Primary data storage for all services'
    }
  ];

  const defaultIntegrations: AppIntegration[] = [
    {
      id: 'external-exchange',
      name: 'External Exchange Connector',
      type: 'external',
      status: 'active',
      endpoints: ['/api/external/binance', '/api/external/coinbase'],
      dependencies: ['trading-api'],
      config: { 
        apiKeys: 'configured',
        rateLimit: '1000/min',
        timeout: '30s'
      }
    },
    {
      id: 'local-analytics',
      name: 'Local Analytics Engine',
      type: 'local',
      status: 'active',
      path: '/apps/analytics',
      port: 8080,
      endpoints: ['/analytics/reports', '/analytics/metrics'],
      dependencies: ['postgres-db'],
      config: {
        dataRetention: '90 days',
        reportInterval: '1 hour'
      }
    },
    {
      id: 'ml-container',
      name: 'ML Prediction Container',
      type: 'container',
      status: 'pending',
      endpoints: ['/ml/predict', '/ml/train'],
      dependencies: ['trading-api', 'postgres-db'],
      config: {
        modelVersion: '2.1.0',
        updateInterval: '6 hours'
      }
    }
  ];

  const defaultDeployments: DeploymentConfig[] = [
    {
      id: 'prod-config',
      name: 'Production Environment',
      environment: 'production',
      replicas: 3,
      resources: {
        cpu: '2 cores',
        memory: '4 GB',
        storage: '100 GB'
      },
      scaling: {
        min: 2,
        max: 10,
        targetCpu: 70
      }
    },
    {
      id: 'dev-config',
      name: 'Development Environment',
      environment: 'development',
      replicas: 1,
      resources: {
        cpu: '1 core',
        memory: '2 GB',
        storage: '50 GB'
      },
      scaling: {
        min: 1,
        max: 3,
        targetCpu: 80
      }
    }
  ];

  const displayServices = (services as PlatformService[]) || defaultServices;
  const displayIntegrations = (integrations as AppIntegration[]) || defaultIntegrations;
  const displayDeployments = (deployments as DeploymentConfig[]) || defaultDeployments;

  const handleDeploy = (serviceId: string) => {
    const config = displayDeployments.find((d: DeploymentConfig) => d.environment === deploymentEnv);
    deployMutation.mutate({ serviceId, config });
  };

  const handleIntegrateApp = () => {
    if (!newAppName || !newAppPath) {
      toast({ title: "Missing information", description: "Please provide app name and path", variant: "destructive" });
      return;
    }
    integrateMutation.mutate({ 
      name: newAppName, 
      path: newAppPath, 
      type: 'local' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': case 'active': return 'text-green-500';
      case 'stopped': case 'inactive': return 'text-gray-500';
      case 'error': return 'text-red-500';
      case 'deploying': case 'pending': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': case 'active': return CheckCircle;
      case 'stopped': case 'inactive': return Clock;
      case 'error': return AlertTriangle;
      case 'deploying': case 'pending': return Activity;
      default: return Clock;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Layers className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <p>Loading platform services...</p>
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
            <Layers className="h-8 w-8 text-blue-500" />
            Tera4-24-72 Justice ai-/KLOUD BUGS Platform
          </h1>
          <p className="text-muted-foreground">
            Microservices Management • App Integration • Deployment Control
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="default" className="text-lg px-3 py-1">
            <Cloud className="h-4 w-4 mr-1" />
            Cloud Native
          </Badge>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Shield className="h-4 w-4 mr-1" />
            Secure Platform
          </Badge>
        </div>
      </div>

      {/* Platform Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayServices.filter((s: PlatformService) => s.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {displayServices.length} total services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.7%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayServices.reduce((sum: number, s: PlatformService) => sum + s.requests, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.08%</div>
            <p className="text-xs text-muted-foreground">
              Very low error rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Platform Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { layer: 'Frontend Layer', services: 'React Apps, Web Interfaces', status: 'Healthy' },
                    { layer: 'API Gateway', services: 'Load Balancer, Rate Limiting', status: 'Healthy' },
                    { layer: 'Microservices', services: 'Trading, Mining, AI, Cafe', status: 'Healthy' },
                    { layer: 'Data Layer', services: 'PostgreSQL, Cache, Storage', status: 'Healthy' },
                    { layer: 'External APIs', services: 'Kraken, Exchanges, Services', status: 'Healthy' }
                  ].map((layer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{layer.layer}</div>
                        <div className="text-sm text-muted-foreground">{layer.services}</div>
                      </div>
                      <Badge variant="default">{layer.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>34%</span>
                    </div>
                    <Progress value={34} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Storage Usage</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Network I/O</span>
                      <span>23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center">
                  <Package className="h-6 w-6 mb-2" />
                  Deploy Service
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Folder className="h-6 w-6 mb-2" />
                  Integrate App
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Monitor className="h-6 w-6 mb-2" />
                  View Logs
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Settings className="h-6 w-6 mb-2" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Platform Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayServices.map((service: PlatformService) => {
                      const StatusIcon = getStatusIcon(service.status);
                      return (
                        <div key={service.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <StatusIcon className={`h-5 w-5 ${getStatusColor(service.status)}`} />
                              <div>
                                <h4 className="font-medium">{service.name}</h4>
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={service.status === 'running' ? 'default' : 'secondary'}>
                                {service.status}
                              </Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                v{service.version}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Uptime</div>
                              <div className="font-medium">{service.uptime}%</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">CPU</div>
                              <div className="font-medium">{service.cpu}%</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Memory</div>
                              <div className="font-medium">{service.memory}MB</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Requests</div>
                              <div className="font-medium">{service.requests.toLocaleString()}</div>
                            </div>
                          </div>

                          {service.endpoint && (
                            <div className="mt-3 text-xs text-muted-foreground">
                              Endpoint: {service.endpoint}
                            </div>
                          )}

                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline">
                              <Monitor className="h-4 w-4 mr-1" />
                              Logs
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4 mr-1" />
                              Config
                            </Button>
                            {service.status !== 'running' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleDeploy(service.id)}
                                disabled={deployMutation.isPending}
                              >
                                <Zap className="h-4 w-4 mr-1" />
                                Start
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Service Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Performance Overview</h4>
                  {displayServices.slice(0, 3).map((service: PlatformService, index: number) => (
                    <div key={service.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{service.name}</span>
                        <span>{service.cpu}% CPU</span>
                      </div>
                      <Progress value={service.cpu} className="h-1" />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Error Rates</h4>
                  <div className="text-sm space-y-2">
                    {displayServices.map((service: PlatformService) => (
                      <div key={service.id} className="flex justify-between">
                        <span className="truncate">{service.name}</span>
                        <span className={service.errors > 10 ? 'text-red-500' : 'text-green-500'}>
                          {service.errors} errors
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    App Integrations
                  </CardTitle>
                  <CardDescription>
                    Manage external apps and services integrated with the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayIntegrations.map((integration: AppIntegration) => {
                      const StatusIcon = getStatusIcon(integration.status);
                      return (
                        <div key={integration.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <StatusIcon className={`h-5 w-5 ${getStatusColor(integration.status)}`} />
                              <div>
                                <h4 className="font-medium">{integration.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {integration.type}
                                  </Badge>
                                  <Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
                                    {integration.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          {integration.path && (
                            <div className="text-sm text-muted-foreground mb-2">
                              Path: {integration.path} {integration.port && `(Port: ${integration.port})`}
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Endpoints:</span>
                              <div className="mt-1 space-y-1">
                                {integration.endpoints.map((endpoint: string, index: number) => (
                                  <div key={index} className="text-xs text-muted-foreground font-mono">
                                    {endpoint}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="text-sm">
                              <span className="font-medium">Dependencies:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {integration.dependencies.map((dep: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {dep}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4 mr-1" />
                              Configure
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileCode className="h-4 w-4 mr-1" />
                              View Config
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Add Integration
                </CardTitle>
                <CardDescription>
                  Integrate apps from local folders or external services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">App Name</label>
                  <Input
                    placeholder="My Custom App"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Folder Path</label>
                  <Input
                    placeholder="/apps/my-custom-app"
                    value={newAppPath}
                    onChange={(e) => setNewAppPath(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Path to the app folder containing the main files
                  </div>
                </div>

                <Button 
                  onClick={handleIntegrateApp}
                  disabled={!newAppName || !newAppPath || integrateMutation.isPending}
                  className="w-full"
                >
                  {integrateMutation.isPending ? 'Integrating...' : 'Integrate App'}
                </Button>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Integration Guide</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>1. Place your app in a folder</div>
                    <div>2. Ensure main entry point is index.js or main.py</div>
                    <div>3. Include package.json or requirements.txt</div>
                    <div>4. App will be auto-detected and configured</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayDeployments.map((deployment: DeploymentConfig) => (
              <Card key={deployment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{deployment.name}</CardTitle>
                    <Badge variant={deployment.environment === 'production' ? 'default' : 'secondary'}>
                      {deployment.environment}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Replicas</div>
                      <div className="font-medium">{deployment.replicas}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">CPU</div>
                      <div className="font-medium">{deployment.resources.cpu}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Memory</div>
                      <div className="font-medium">{deployment.resources.memory}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Storage</div>
                      <div className="font-medium">{deployment.resources.storage}</div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm mb-2">Auto-Scaling</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Min</div>
                        <div className="font-medium">{deployment.scaling.min}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Max</div>
                        <div className="font-medium">{deployment.scaling.max}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Target CPU</div>
                        <div className="font-medium">{deployment.scaling.targetCpu}%</div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => setDeploymentEnv(deployment.environment)}
                    variant={deploymentEnv === deployment.environment ? 'default' : 'outline'}
                  >
                    {deploymentEnv === deployment.environment ? 'Selected' : 'Select Config'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Deployment Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-16 flex flex-col items-center justify-center">
                  <Zap className="h-5 w-5 mb-1" />
                  Deploy All Services
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <Database className="h-5 w-5 mb-1" />
                  Backup Database
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <TrendingUp className="h-5 w-5 mb-1" />
                  Scale Services
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { metric: 'API Response Time', value: '145ms', status: 'good' },
                    { metric: 'Database Connections', value: '45/100', status: 'good' },
                    { metric: 'Error Rate', value: '0.08%', status: 'good' },
                    { metric: 'Memory Usage', value: '67%', status: 'warning' },
                    { metric: 'Disk Usage', value: '45%', status: 'good' }
                  ].map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{metric.metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.value}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          metric.status === 'good' ? 'bg-green-500' : 
                          metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {[
                      'TERJustice AI service restarted successfully',
                      'Database backup completed',
                      'New app integration: Analytics Engine',
                      'Trading API scaled to 3 replicas',
                      'System health check passed',
                      'Memory usage alert resolved',
                      'Cache cleared and rebuilt'
                    ].map((event, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>{event}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {Math.floor(Math.random() * 60)} min ago
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}