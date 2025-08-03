import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Users, 
  GraduationCap, 
  Leaf, 
  Building, 
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';

export function SocialImpactDashboard() {
  const { data: projectsData } = useQuery({
    queryKey: ['/api/social/projects'],
    refetchInterval: 60000,
  });

  const { data: impactSummary } = useQuery({
    queryKey: ['/api/social/impact-summary'],
    refetchInterval: 30000,
  });

  const { data: tokenMetrics } = useQuery({
    queryKey: ['/api/social/token-metrics'],
    refetchInterval: 15000,
  });

  // Mock data - replace with actual API data
  const projects = projectsData?.projects || [
    {
      id: 'proj-education-001',
      name: 'Digital Literacy for Underserved Communities',
      description: 'Providing computer training and internet access to rural communities',
      category: 'education',
      fundingGoal: 50000,
      currentFunding: 32000,
      tokenAllocation: 11111111,
      status: 'active',
      impact: {
        peopleHelped: 1250,
        communitiesReached: 8,
        sustainabilityScore: 85
      },
      milestones: [
        {
          id: 'ms-001',
          title: 'Setup 5 Community Centers',
          completed: true,
          tokenReward: 2222222
        },
        {
          id: 'ms-002',
          title: 'Train 1000 Participants',
          completed: false,
          tokenReward: 4444444
        }
      ]
    },
    {
      id: 'proj-environment-001',
      name: 'Solar Power for Community Centers',
      description: 'Installing solar panels to power community facilities sustainably',
      category: 'environment',
      fundingGoal: 75000,
      currentFunding: 18000,
      tokenAllocation: 16666666,
      status: 'proposed',
      impact: {
        peopleHelped: 0,
        communitiesReached: 0,
        sustainabilityScore: 95
      },
      milestones: []
    }
  ];

  const summary = impactSummary || {
    totalProjects: 15,
    activeProjects: 8,
    peopleHelped: 8934,
    communitiesSupported: 45,
    totalFunding: 456789,
    tokenAllocated: 101666777
  };

  const token = tokenMetrics || {
    totalSupply: 1000000000,
    socialProjectsAllocated: 400000000,
    marketPrice: 0.0045,
    communityRewards: 200000000
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'education': return <GraduationCap className="h-4 w-4" />;
      case 'environment': return <Leaf className="h-4 w-4" />;
      case 'healthcare': return <Heart className="h-4 w-4" />;
      case 'community': return <Users className="h-4 w-4" />;
      case 'technology': return <Building className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'education': return 'text-blue-500 bg-blue-500/10';
      case 'environment': return 'text-green-500 bg-green-500/10';
      case 'healthcare': return 'text-red-500 bg-red-500/10';
      case 'community': return 'text-purple-500 bg-purple-500/10';
      case 'technology': return 'text-cyan-500 bg-cyan-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-500/10';
      case 'completed': return 'text-blue-500 bg-blue-500/10';
      case 'proposed': return 'text-yellow-500 bg-yellow-500/10';
      case 'paused': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Impact Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cosmic-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">People Helped</p>
                <p className="text-2xl font-bold text-green-500">
                  {summary.peopleHelped.toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Communities</p>
                <p className="text-2xl font-bold text-blue-500">
                  {summary.communitiesSupported}
                </p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Funding</p>
                <p className="text-2xl font-bold text-cyber-gold">
                  ${summary.totalFunding.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-cyber-gold" />
            </div>
          </CardContent>
        </Card>

        <Card className="cosmic-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold text-purple-500">
                  {summary.activeProjects}/{summary.totalProjects}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Allocation */}
      <Card className="cosmic-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-cyber-gold" />
            Social Justice Token Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {((token.socialProjectsAllocated / token.totalSupply) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">For Social Projects</div>
              <div className="text-xs text-green-400 mt-1">
                {(token.socialProjectsAllocated / 1000000).toFixed(0)}M tokens
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-500/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-500">
                {((token.communityRewards / token.totalSupply) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Community Rewards</div>
              <div className="text-xs text-purple-400 mt-1">
                {(token.communityRewards / 1000000).toFixed(0)}M tokens
              </div>
            </div>
            
            <div className="text-center p-4 bg-cyber-gold/10 rounded-lg">
              <div className="text-2xl font-bold text-cyber-gold">
                ${token.marketPrice?.toFixed(4)}
              </div>
              <div className="text-sm text-muted-foreground">Current Price</div>
              <div className="text-xs text-cyber-gold mt-1">
                ${((token.marketPrice || 0) * (token.totalSupply / 1000000)).toFixed(0)}M Market Cap
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Projects */}
      <Card className="cosmic-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-cyber-gold" />
            Social Impact Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="cosmic-card border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(project.category)}
                      <div>
                        <div className="text-sm font-medium">{project.name}</div>
                        <div className="text-xs text-muted-foreground">{project.description}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getCategoryColor(project.category)}>
                        {project.category.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Funding Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Funding Progress</span>
                      <span>
                        ${project.currentFunding.toLocaleString()} / ${project.fundingGoal.toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={(project.currentFunding / project.fundingGoal) * 100} 
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      {((project.currentFunding / project.fundingGoal) * 100).toFixed(1)}% completed
                    </div>
                  </div>

                  {/* Impact Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-blue-500/10 rounded">
                      <div className="text-blue-500 font-medium">
                        {project.impact.peopleHelped.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">People Helped</div>
                    </div>
                    <div className="text-center p-2 bg-green-500/10 rounded">
                      <div className="text-green-500 font-medium">
                        {project.impact.communitiesReached}
                      </div>
                      <div className="text-muted-foreground">Communities</div>
                    </div>
                    <div className="text-center p-2 bg-purple-500/10 rounded">
                      <div className="text-purple-500 font-medium">
                        {project.impact.sustainabilityScore}%
                      </div>
                      <div className="text-muted-foreground">Sustainability</div>
                    </div>
                  </div>

                  {/* Milestones */}
                  {project.milestones.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Project Milestones</div>
                      {project.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-center gap-2 text-xs">
                          {milestone.completed ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <Clock className="h-3 w-3 text-yellow-500" />
                          )}
                          <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                            {milestone.title}
                          </span>
                          <Badge variant="outline" className="ml-auto">
                            {(milestone.tokenReward / 1000000).toFixed(1)}M tokens
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Token Allocation */}
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm text-muted-foreground">Token Allocation</span>
                    <span className="font-medium text-cyber-gold">
                      {(project.tokenAllocation / 1000000).toFixed(1)}M tokens
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}