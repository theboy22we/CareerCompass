interface SocialProject {
  id: string;
  name: string;
  description: string;
  category: 'education' | 'healthcare' | 'environment' | 'community' | 'technology';
  fundingGoal: number;
  currentFunding: number;
  tokenAllocation: number;
  status: 'proposed' | 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  impact: {
    peopleHelped: number;
    communitiesReached: number;
    sustainabilityScore: number;
  };
  milestones: ProjectMilestone[];
}

interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completed: boolean;
  completedDate?: Date;
  tokenReward: number;
}

interface TokenMetrics {
  totalSupply: number;
  circulatingSupply: number;
  socialProjectsAllocated: number;
  communityRewards: number;
  platformDevelopment: number;
  marketPrice?: number;
  marketCap?: number;
  volume24h?: number;
}

interface MiningOperation {
  id: string;
  name: string;
  location: string;
  type: 'bitcoin' | 'ethereum' | 'multi';
  hashrate: number;
  powerConsumption: number; // watts
  efficiency: number; // J/TH for Bitcoin
  status: 'online' | 'offline' | 'maintenance';
  dailyRevenue: number;
  dailyCost: number;
  profitability: number;
  temperature: number;
  uptime: number; // percentage
  lastMaintenance: Date;
  nextMaintenance: Date;
}

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  transactionVolume: number;
  socialProjectsFunded: number;
  totalImpact: {
    peopleHelped: number;
    communitiesSupported: number;
    environmentalProjects: number;
    educationInitiatives: number;
  };
}

class SocialTokenManager {
  private projects: SocialProject[] = [];
  private tokenMetrics: TokenMetrics;
  private miningOperations: MiningOperation[] = [];
  private platformMetrics: PlatformMetrics;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize token metrics
    this.tokenMetrics = {
      totalSupply: 1000000000, // 1B tokens
      circulatingSupply: 250000000, // 250M tokens
      socialProjectsAllocated: 400000000, // 40% for social projects
      communityRewards: 200000000, // 20% for community rewards
      platformDevelopment: 150000000, // 15% for platform development
      marketPrice: 0.0045, // Example price in USD
      marketCap: 1125000, // circulating supply * price
      volume24h: 125000
    };

    // Initialize sample projects
    this.projects = [
      {
        id: 'proj-education-001',
        name: 'Digital Literacy for Underserved Communities',
        description: 'Providing computer training and internet access to rural communities',
        category: 'education',
        fundingGoal: 50000,
        currentFunding: 32000,
        tokenAllocation: 11111111, // ~50k USD worth of tokens
        status: 'active',
        startDate: new Date('2024-01-15'),
        impact: {
          peopleHelped: 1250,
          communitiesReached: 8,
          sustainabilityScore: 85
        },
        milestones: [
          {
            id: 'ms-001',
            title: 'Setup 5 Community Centers',
            description: 'Establish computer labs in 5 rural locations',
            targetDate: new Date('2024-03-01'),
            completed: true,
            completedDate: new Date('2024-02-28'),
            tokenReward: 2222222
          },
          {
            id: 'ms-002',
            title: 'Train 1000 Participants',
            description: 'Complete digital literacy training for 1000 people',
            targetDate: new Date('2024-06-01'),
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
        startDate: new Date('2024-04-01'),
        impact: {
          peopleHelped: 0,
          communitiesReached: 0,
          sustainabilityScore: 95
        },
        milestones: []
      }
    ];

    // Initialize mining operations
    this.miningOperations = [
      {
        id: 'mine-btc-001',
        name: 'Primary Bitcoin Mining Facility',
        location: 'Texas, USA',
        type: 'bitcoin',
        hashrate: 150, // TH/s
        powerConsumption: 3250, // watts
        efficiency: 21.67, // J/TH
        status: 'online',
        dailyRevenue: 186.50,
        dailyCost: 78.00,
        profitability: 58.13, // percentage
        temperature: 42,
        uptime: 99.2,
        lastMaintenance: new Date('2024-01-15'),
        nextMaintenance: new Date('2024-04-15')
      },
      {
        id: 'mine-eth-001',
        name: 'Ethereum Mining Farm',
        location: 'Washington, USA',
        type: 'ethereum',
        hashrate: 2.8, // GH/s
        powerConsumption: 4800,
        efficiency: 1.71, // MH/J
        status: 'online',
        dailyRevenue: 145.20,
        dailyCost: 115.20,
        profitability: 20.66,
        temperature: 38,
        uptime: 97.8,
        lastMaintenance: new Date('2024-01-20'),
        nextMaintenance: new Date('2024-04-20')
      }
    ];

    // Initialize platform metrics
    this.platformMetrics = {
      totalUsers: 12847,
      activeUsers: 3291,
      transactionVolume: 2456789.50,
      socialProjectsFunded: 15,
      totalImpact: {
        peopleHelped: 8934,
        communitiesSupported: 45,
        environmentalProjects: 6,
        educationInitiatives: 9
      }
    };
  }

  // Social Projects Management
  getProjects(): SocialProject[] {
    return [...this.projects];
  }

  getActiveProjects(): SocialProject[] {
    return this.projects.filter(p => p.status === 'active');
  }

  getProjectById(id: string): SocialProject | undefined {
    return this.projects.find(p => p.id === id);
  }

  addProject(project: Omit<SocialProject, 'id'>): SocialProject {
    const newProject: SocialProject = {
      id: `proj-${Date.now()}`,
      ...project
    };
    this.projects.push(newProject);
    return newProject;
  }

  updateProjectFunding(projectId: string, amount: number): boolean {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      project.currentFunding += amount;
      if (project.currentFunding >= project.fundingGoal) {
        project.status = 'completed';
      }
      return true;
    }
    return false;
  }

  completeMilestone(projectId: string, milestoneId: string): boolean {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      const milestone = project.milestones.find(m => m.id === milestoneId);
      if (milestone && !milestone.completed) {
        milestone.completed = true;
        milestone.completedDate = new Date();
        return true;
      }
    }
    return false;
  }

  // Token Management
  getTokenMetrics(): TokenMetrics {
    return { ...this.tokenMetrics };
  }

  updateTokenPrice(price: number): void {
    this.tokenMetrics.marketPrice = price;
    this.tokenMetrics.marketCap = this.tokenMetrics.circulatingSupply * price;
  }

  allocateTokensToProject(projectId: string, amount: number): boolean {
    if (this.tokenMetrics.socialProjectsAllocated >= amount) {
      this.tokenMetrics.socialProjectsAllocated -= amount;
      const project = this.projects.find(p => p.id === projectId);
      if (project) {
        project.tokenAllocation += amount;
        return true;
      }
    }
    return false;
  }

  // Mining Operations Management
  getMiningOperations(): MiningOperation[] {
    return [...this.miningOperations];
  }

  getActiveMiningOperations(): MiningOperation[] {
    return this.miningOperations.filter(op => op.status === 'online');
  }

  getMiningOperation(id: string): MiningOperation | undefined {
    return this.miningOperations.find(op => op.id === id);
  }

  updateMiningMetrics(operationId: string, metrics: Partial<MiningOperation>): boolean {
    const operation = this.miningOperations.find(op => op.id === operationId);
    if (operation) {
      Object.assign(operation, metrics);
      return true;
    }
    return false;
  }

  getTotalMiningRevenue(): number {
    return this.miningOperations.reduce((total, op) => total + op.dailyRevenue, 0);
  }

  getTotalMiningCosts(): number {
    return this.miningOperations.reduce((total, op) => total + op.dailyCost, 0);
  }

  getTotalMiningProfit(): number {
    return this.getTotalMiningRevenue() - this.getTotalMiningCosts();
  }

  getAverageEfficiency(): number {
    const operations = this.getActiveMiningOperations();
    if (operations.length === 0) return 0;
    
    const totalEfficiency = operations.reduce((sum, op) => sum + op.efficiency, 0);
    return totalEfficiency / operations.length;
  }

  // Platform Analytics
  getPlatformMetrics(): PlatformMetrics {
    return { ...this.platformMetrics };
  }

  updatePlatformMetrics(metrics: Partial<PlatformMetrics>): void {
    Object.assign(this.platformMetrics, metrics);
  }

  getSocialImpactSummary() {
    const activeProjects = this.getActiveProjects();
    const totalFunding = this.projects.reduce((sum, p) => sum + p.currentFunding, 0);
    const totalTokensAllocated = this.projects.reduce((sum, p) => sum + p.tokenAllocation, 0);
    
    return {
      activeProjects: activeProjects.length,
      totalProjects: this.projects.length,
      totalFunding,
      totalTokensAllocated,
      impactMetrics: this.platformMetrics.totalImpact,
      fundingProgress: this.projects.map(p => ({
        name: p.name,
        progress: (p.currentFunding / p.fundingGoal) * 100,
        category: p.category
      }))
    };
  }

  // Revenue sharing for social projects
  allocateMiningRevenue(percentage: number): number {
    const totalProfit = this.getTotalMiningProfit();
    const socialAllocation = totalProfit * (percentage / 100);
    
    // Distribute proportionally among active projects
    const activeProjects = this.getActiveProjects();
    const allocationPerProject = activeProjects.length > 0 ? socialAllocation / activeProjects.length : 0;
    
    activeProjects.forEach(project => {
      this.updateProjectFunding(project.id, allocationPerProject);
    });
    
    return socialAllocation;
  }

  // Performance Analytics
  getOperationalSummary() {
    const mining = {
      totalRevenue: this.getTotalMiningRevenue(),
      totalCosts: this.getTotalMiningCosts(),
      totalProfit: this.getTotalMiningProfit(),
      averageUptime: this.miningOperations.reduce((sum, op) => sum + op.uptime, 0) / this.miningOperations.length,
      activeOperations: this.getActiveMiningOperations().length,
      totalOperations: this.miningOperations.length
    };

    const social = this.getSocialImpactSummary();
    const token = this.getTokenMetrics();

    return {
      mining,
      social,
      token,
      platform: this.platformMetrics
    };
  }
}

export const socialTokenManager = new SocialTokenManager();