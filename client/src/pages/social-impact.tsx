import { SocialImpactDashboard } from '@/components/social-impact-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function SocialImpact() {
  const { data: socialData } = useQuery({
    queryKey: ['/api/social/projects'],
    refetchInterval: 30000,
  });

  const { data: impactSummary } = useQuery({
    queryKey: ['/api/social/impact-summary'],
    refetchInterval: 60000,
  });

  const { data: tokenMetrics } = useQuery({
    queryKey: ['/api/social/token-metrics'],
    refetchInterval: 30000,
  });

  return (
    <div className="mobile-compact mobile-compact-space">
      {/* Impact Overview Cards */}
      <div className="mobile-grid-3 mobile-compact-grid">
        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Total Impact</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card">
            <div className="text-xl sm:text-3xl font-bold text-accent mobile-header">
              ${(impactSummary?.totalFundingProvided || 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mobile-card">
              Funding provided
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Active Projects</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card">
            <div className="text-xl sm:text-3xl font-bold text-green-400 mobile-header">
              {socialData?.projects?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground mobile-card">
              Currently funded
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">TERA Tokens</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card">
            <div className="text-xl sm:text-3xl font-bold text-primary mobile-header">
              {(tokenMetrics?.circulatingSupply || 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mobile-card">
              In circulation
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Projects */}
      <Card className="cosmic-card">
        <CardHeader className="mobile-compact-card">
          <CardTitle className="mobile-header">Active Social Justice Projects</CardTitle>
        </CardHeader>
        <CardContent className="mobile-compact-card">
          {socialData?.projects ? (
            <div className="mobile-compact-space">
              {socialData.projects.map((project: any) => (
                <div key={project.id} className="border-b border-border/20 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold mobile-header">{project.name}</h3>
                      <p className="text-sm text-muted-foreground mobile-card">{project.description}</p>
                    </div>
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                  
                  <div className="mobile-compact-space">
                    <div className="flex justify-between text-sm mobile-card">
                      <span>Funding Progress</span>
                      <span>${project.currentFunding?.toLocaleString()} / ${project.targetFunding?.toLocaleString()}</span>
                    </div>
                    <Progress value={(project.currentFunding / project.targetFunding) * 100} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm mobile-card">
                    <div>
                      <span className="text-muted-foreground">Category:</span> {project.category}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Impact:</span> {project.impactMetric}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <i className="fas fa-heart text-4xl mb-4 opacity-50"></i>
              <p className="mobile-card">Loading social impact projects...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Social Impact Dashboard */}
      <SocialImpactDashboard />

      {/* Impact Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 mobile-compact-grid">
        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">TERA Token Metrics</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card mobile-compact-space">
            {tokenMetrics && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground mobile-card">Total Supply</span>
                  <span className="font-semibold mobile-card">{tokenMetrics.totalSupply?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground mobile-card">Market Cap</span>
                  <span className="font-semibold mobile-card">${tokenMetrics.marketCap?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground mobile-card">Price</span>
                  <span className="font-semibold text-green-400 mobile-card">${tokenMetrics.currentPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground mobile-card">24h Change</span>
                  <span className={`font-semibold mobile-card ${tokenMetrics.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tokenMetrics.change24h >= 0 ? '+' : ''}{tokenMetrics.change24h}%
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardHeader className="mobile-compact-card">
            <CardTitle className="mobile-header">Global Impact Stats</CardTitle>
          </CardHeader>
          <CardContent className="mobile-compact-card mobile-compact-space">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">Countries Reached</span>
              <span className="font-semibold mobile-card">{impactSummary?.countriesReached || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">People Helped</span>
              <span className="font-semibold text-green-400 mobile-card">{(impactSummary?.peopleHelped || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">Projects Completed</span>
              <span className="font-semibold mobile-card">{impactSummary?.projectsCompleted || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground mobile-card">Success Rate</span>
              <span className="font-semibold text-accent mobile-card">{impactSummary?.successRate || 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}