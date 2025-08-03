import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';

interface SocialProject {
  id: string;
  title: string;
  description: string;
  category: 'education' | 'healthcare' | 'environment';
  fundingGoal: number;
  currentFunding: number;
  tokenAllocation: number;
  impact: {
    peopleHelped: number;
    communitiesReached: number;
  };
  status: 'active' | 'completed' | 'proposed';
  location: string;
}

interface SocialData {
  projects: SocialProject[];
  summary: {
    total: number;
    active: number;
    totalFunding: number;
    totalImpact: number;
  };
}

interface TokenMetrics {
  totalSupply: number;
  circulatingSupply: number;
  socialProjectsAllocated: number;
  communityRewards: number;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
}

export function SocialImpactDashboard() {
  const [wsConnected, setWsConnected] = useState(false);
  const [liveProjects, setLiveProjects] = useState<SocialProject[]>([]);

  // Fetch social projects data
  const { data: socialData } = useQuery<SocialData>({
    queryKey: ['/api/social/projects'],
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch token metrics
  const { data: tokenMetrics } = useQuery<TokenMetrics>({
    queryKey: ['/api/social/token-metrics'],
    refetchInterval: 30000,
  });

  // Connect to social platform WebSocket for real-time updates
  useEffect(() => {
    const connectSocialWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:3002/social-ws`;
      
      try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('Connected to social platform');
          setWsConnected(true);
        };
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.type === 'projects:update') {
            setLiveProjects(message.data.projects);
          }
        };
        
        ws.onclose = () => {
          console.log('Social platform disconnected');
          setWsConnected(false);
          setTimeout(connectSocialWS, 5000);
        };
        
        ws.onerror = () => {
          console.log('Social platform connection error');
          setWsConnected(false);
        };
        
        return ws;
      } catch (error) {
        console.log('Social platform not available, using API data');
        setWsConnected(false);
        return null;
      }
    };

    const ws = connectSocialWS();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const displayProjects = liveProjects.length > 0 ? liveProjects : socialData?.projects || [];
  const summary = socialData?.summary;

  const openSocialPlatform = () => {
    window.open('http://localhost:3002', '_blank');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'education': return '📚';
      case 'healthcare': return '🏥';
      case 'environment': return '🌱';
      default: return '💖';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'education': return 'text-blue-400';
      case 'healthcare': return 'text-red-400';
      case 'environment': return 'text-green-400';
      default: return 'text-purple-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-foreground">Social Justice Impact</h3>
          <Badge variant={wsConnected ? "default" : "secondary"}>
            {wsConnected ? "🟢 Live" : "📊 API"}
          </Badge>
        </div>
        <Button 
          onClick={openSocialPlatform}
          className="cosmic-action-btn"
          size="sm"
        >
          Open Social Platform
        </Button>
      </div>

      {/* Token Metrics */}
      {tokenMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Token Price</div>
              <div className="text-2xl font-bold text-yellow-400">
                ${tokenMetrics.currentPrice.toFixed(4)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Market Cap</div>
              <div className="text-2xl font-bold text-green-400">
                ${(tokenMetrics.marketCap / 1000000).toFixed(1)}M
              </div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Social Allocation</div>
              <div className="text-2xl font-bold text-purple-400">
                {((tokenMetrics.socialProjectsAllocated / tokenMetrics.totalSupply) * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">24h Volume</div>
              <div className="text-2xl font-bold text-blue-400">
                ${(tokenMetrics.volume24h / 1000).toFixed(0)}K
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Projects</div>
              <div className="text-2xl font-bold text-cyber-gold">
                {summary.total}
              </div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Active Projects</div>
              <div className="text-2xl font-bold text-green-400">
                {summary.active}
              </div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Funding</div>
              <div className="text-2xl font-bold text-blue-400">
                ${summary.totalFunding.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">People Helped</div>
              <div className="text-2xl font-bold text-purple-400">
                {summary.totalImpact.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayProjects.map((project) => {
          const fundingProgress = (project.currentFunding / project.fundingGoal) * 100;
          
          return (
            <Card key={project.id} className="cosmic-card border-border/50 hover:border-primary/50 transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCategoryIcon(project.category)}</span>
                    <div>
                      <CardTitle className="text-lg text-cyber-gold line-clamp-1">
                        {project.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {project.category} • {project.location}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      project.status === 'active' ? 'default' : 
                      project.status === 'completed' ? 'secondary' : 'outline'
                    }
                    className="text-xs"
                  >
                    {project.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
                
                {/* Funding Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Funding Progress</span>
                    <span className="text-foreground">
                      ${project.currentFunding.toLocaleString()} / ${project.fundingGoal.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={fundingProgress} 
                    className="h-2"
                  />
                  <div className="text-right text-xs text-muted-foreground">
                    {fundingProgress.toFixed(1)}% funded
                  </div>
                </div>
                
                {/* Impact Metrics */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">
                      {project.impact.peopleHelped.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">People Helped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">
                      {project.impact.communitiesReached}
                    </div>
                    <div className="text-xs text-muted-foreground">Communities</div>
                  </div>
                </div>
                
                {/* Token Allocation */}
                <div className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground">Token Allocation</span>
                  <span className="font-mono text-yellow-400">
                    {project.tokenAllocation.toLocaleString()} TOKENS
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {displayProjects.length === 0 && (
        <Card className="cosmic-card">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <i className="fas fa-heart text-4xl text-primary/20" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Social Projects</h3>
            <p className="text-muted-foreground mb-4">
              Start your social platform service to see impact projects
            </p>
            <Button onClick={openSocialPlatform} className="cosmic-action-btn">
              Launch Social Platform
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}