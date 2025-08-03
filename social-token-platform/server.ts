import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/social-ws' });

// Social Justice Token Platform
// Separate microservice for managing social impact projects

app.use(express.json());
app.use(express.static('public'));

// Mock social projects data
const socialProjects = [
  {
    id: 'proj-001',
    title: 'Digital Literacy for Rural Communities',
    description: 'Providing computer training and internet access to underserved areas',
    category: 'education',
    fundingGoal: 50000,
    currentFunding: 32000,
    tokenAllocation: 11111111,
    impact: {
      peopleHelped: 1250,
      communitiesReached: 8
    },
    status: 'active',
    location: 'Rural Texas & Louisiana',
    startDate: '2024-01-15',
    milestones: [
      { title: 'Setup 5 Community Centers', completed: true, reward: 2222222 },
      { title: 'Train 1000 Participants', completed: false, reward: 4444444 },
      { title: 'Establish Sustainable Programs', completed: false, reward: 4444445 }
    ]
  },
  {
    id: 'proj-002',
    title: 'Clean Energy for Community Centers',
    description: 'Installing solar panels to power community facilities sustainably',
    category: 'environment',
    fundingGoal: 75000,
    currentFunding: 18000,
    tokenAllocation: 16666666,
    impact: {
      peopleHelped: 0,
      communitiesReached: 0
    },
    status: 'proposed',
    location: 'Multiple States',
    startDate: '2024-04-01',
    milestones: [
      { title: 'Site Assessments', completed: false, reward: 5555555 },
      { title: 'Solar Installation Phase 1', completed: false, reward: 5555555 },
      { title: 'Community Training', completed: false, reward: 5555556 }
    ]
  },
  {
    id: 'proj-003',
    title: 'Mobile Health Clinics',
    description: 'Bringing healthcare services to remote and underserved communities',
    category: 'healthcare',
    fundingGoal: 100000,
    currentFunding: 45000,
    tokenAllocation: 22222222,
    impact: {
      peopleHelped: 890,
      communitiesReached: 12
    },
    status: 'active',
    location: 'Rural America',
    startDate: '2024-02-01',
    milestones: [
      { title: 'Purchase Mobile Units', completed: true, reward: 7407407 },
      { title: 'Staff Training & Certification', completed: true, reward: 7407407 },
      { title: 'Establish Service Routes', completed: false, reward: 7407408 }
    ]
  }
];

const tokenMetrics = {
  totalSupply: 1000000000,
  circulatingSupply: 250000000,
  socialProjectsAllocated: 400000000,
  communityRewards: 200000000,
  currentPrice: 0.0045,
  marketCap: 1125000,
  volume24h: 125000
};

// API Routes
app.get('/api/projects', (req, res) => {
  res.json({
    projects: socialProjects,
    summary: {
      total: socialProjects.length,
      active: socialProjects.filter(p => p.status === 'active').length,
      totalFunding: socialProjects.reduce((sum, p) => sum + p.currentFunding, 0),
      totalImpact: socialProjects.reduce((sum, p) => sum + p.impact.peopleHelped, 0)
    }
  });
});

app.get('/api/projects/:id', (req, res) => {
  const project = socialProjects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

app.post('/api/projects/:id/fund', (req, res) => {
  const { amount } = req.body;
  const project = socialProjects.find(p => p.id === req.params.id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  project.currentFunding += amount;
  
  if (project.currentFunding >= project.fundingGoal) {
    project.status = 'completed';
  }

  broadcastUpdate();
  res.json({ 
    success: true, 
    message: `$${amount} funded to ${project.title}`,
    newTotal: project.currentFunding
  });
});

app.get('/api/token/metrics', (req, res) => {
  res.json(tokenMetrics);
});

app.post('/api/mining/allocation', (req, res) => {
  const { dailyProfit, allocationPercentage } = req.body;
  const socialAllocation = dailyProfit * (allocationPercentage / 100);
  
  // Distribute among active projects
  const activeProjects = socialProjects.filter(p => p.status === 'active');
  const amountPerProject = activeProjects.length > 0 ? socialAllocation / activeProjects.length : 0;
  
  activeProjects.forEach(project => {
    project.currentFunding += amountPerProject;
  });

  broadcastUpdate();
  res.json({
    success: true,
    allocated: socialAllocation,
    projectsSupported: activeProjects.length,
    amountPerProject
  });
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('Social platform client connected');
  
  ws.send(JSON.stringify({
    type: 'projects:update',
    data: { projects: socialProjects, tokenMetrics }
  }));

  ws.on('close', () => {
    console.log('Social platform client disconnected');
  });
});

function broadcastUpdate() {
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type: 'projects:update',
        data: { projects: socialProjects, tokenMetrics },
        timestamp: Date.now()
      }));
    }
  });
}

// Simulate funding updates from mining revenue
setInterval(() => {
  // Simulate small funding increments from mining revenue
  const activeProjects = socialProjects.filter(p => p.status === 'active');
  
  activeProjects.forEach(project => {
    // Small random funding increment (simulating mining revenue allocation)
    const increment = Math.random() * 50 + 10; // $10-60
    project.currentFunding += increment;
    
    // Update impact metrics
    if (project.status === 'active') {
      project.impact.peopleHelped += Math.floor(Math.random() * 3);
    }
  });
  
  broadcastUpdate();
}, 30000); // Update every 30 seconds

const PORT = process.env.SOCIAL_PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`💖 KLOUD Social Platform running on port ${PORT}`);
});