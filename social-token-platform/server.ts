import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// TERA Social Justice Projects
const socialProjects = [
  {
    id: 'proj-education-001',
    title: 'TERA Digital Literacy Program',
    description: 'Providing cryptocurrency and blockchain education to underserved communities, inspired by Tera Ann Harris\'s legacy of justice and innovation.',
    category: 'education',
    fundingGoal: 75000,
    currentFunding: 42350,
    tokenAllocation: 500000,
    impact: {
      peopleHelped: 1250,
      communitiesReached: 8
    },
    status: 'active',
    location: 'Multiple Communities',
    launchDate: '2024-03-15',
    completionDate: '2025-06-30'
  },
  {
    id: 'proj-healthcare-002',
    title: 'Community Health Blockchain Initiative',
    description: 'Using blockchain technology to improve healthcare access and data security in underserved areas, ensuring medical justice for all.',
    category: 'healthcare',
    fundingGoal: 120000,
    currentFunding: 67500,
    tokenAllocation: 750000,
    impact: {
      peopleHelped: 850,
      communitiesReached: 5
    },
    status: 'active',
    location: 'Rural Health Centers',
    launchDate: '2024-04-01',
    completionDate: '2025-12-31'
  },
  {
    id: 'proj-environment-003',
    title: 'Green Mining Carbon Offset Program',
    description: 'Offsetting mining operations with renewable energy investments and environmental restoration projects.',
    category: 'environment',
    fundingGoal: 95000,
    currentFunding: 95000,
    tokenAllocation: 600000,
    impact: {
      peopleHelped: 2500,
      communitiesReached: 12
    },
    status: 'completed',
    location: 'Global Environmental Sites',
    launchDate: '2024-01-10',
    completionDate: '2024-11-30'
  },
  {
    id: 'proj-justice-004',
    title: 'Legal Aid Crypto Fund',
    description: 'Providing legal assistance and advocacy for cryptocurrency-related cases in underserved communities.',
    category: 'education',
    fundingGoal: 85000,
    currentFunding: 31200,
    tokenAllocation: 450000,
    impact: {
      peopleHelped: 320,
      communitiesReached: 6
    },
    status: 'active',
    location: 'Legal Aid Centers',
    launchDate: '2024-05-20',
    completionDate: '2025-08-15'
  },
  {
    id: 'proj-youth-005',
    title: 'TERA Youth Tech Mentorship',
    description: 'Mentoring young people in technology and cryptocurrency, creating pathways to economic empowerment.',
    category: 'education',
    fundingGoal: 55000,
    currentFunding: 18750,
    tokenAllocation: 350000,
    impact: {
      peopleHelped: 180,
      communitiesReached: 4
    },
    status: 'proposed',
    location: 'Youth Centers',
    launchDate: '2025-01-15',
    completionDate: '2025-09-30'
  }
];

// TERA Token Metrics
const tokenMetrics = {
  totalSupply: 1000000000, // 1 billion TERA tokens
  circulatingSupply: 750000000,
  socialProjectsAllocated: 250000000,
  communityRewards: 150000000,
  miningRewards: 350000000,
  currentPrice: 0.0245, // $0.0245
  marketCap: 18375000, // $18.375M
  volume24h: 2450000, // $2.45M
  holders: 12500,
  socialImpactMultiplier: 1.15 // 15% bonus for social impact allocations
};

// Create HTTP server
const server = createServer(app);

// Create WebSocket server for real-time social platform data
const wss = new WebSocketServer({ 
  server,
  path: '/social-ws'
});

// WebSocket connections
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('Social platform client connected');
  clients.add(ws);
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'initial_data',
    data: {
      projects: socialProjects,
      tokenMetrics,
      summary: calculateSocialSummary()
    }
  }));
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Social platform client disconnected');
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleWebSocketMessage(data, ws);
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
});

// Calculate social impact summary
function calculateSocialSummary() {
  const activeProjects = socialProjects.filter(p => p.status === 'active');
  const totalFunding = socialProjects.reduce((sum, p) => sum + p.currentFunding, 0);
  const totalImpact = socialProjects.reduce((sum, p) => sum + p.impact.peopleHelped, 0);
  
  return {
    total: socialProjects.length,
    active: activeProjects.length,
    completed: socialProjects.filter(p => p.status === 'completed').length,
    proposed: socialProjects.filter(p => p.status === 'proposed').length,
    totalFunding,
    totalImpact,
    totalCommunities: socialProjects.reduce((sum, p) => sum + p.impact.communitiesReached, 0),
    socialAllocationUsed: socialProjects.reduce((sum, p) => sum + p.tokenAllocation, 0),
    avgFundingProgress: activeProjects.reduce((sum, p) => sum + (p.currentFunding / p.fundingGoal), 0) / activeProjects.length * 100
  };
}

// Handle WebSocket messages
function handleWebSocketMessage(data: any, ws: WebSocket) {
  switch (data.type) {
    case 'project_update':
      handleProjectUpdate(data.projectId, data.updates);
      break;
    case 'funding_allocation':
      handleFundingAllocation(data.amount, data.source);
      break;
    case 'request_update':
      sendRealTimeUpdate();
      break;
  }
}

// Handle project updates
function handleProjectUpdate(projectId: string, updates: any) {
  const projectIndex = socialProjects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) return;
  
  const project = socialProjects[projectIndex];
  
  // Update project data
  if (updates.funding) {
    project.currentFunding = Math.min(project.fundingGoal, project.currentFunding + updates.funding);
    
    // Check if project is now fully funded
    if (project.currentFunding >= project.fundingGoal && project.status === 'active') {
      project.status = 'completed';
    }
  }
  
  if (updates.impact) {
    project.impact.peopleHelped += updates.impact.peopleHelped || 0;
    project.impact.communitiesReached += updates.impact.communitiesReached || 0;
  }
  
  sendRealTimeUpdate();
}

// Handle funding allocation from mining profits
function handleFundingAllocation(amount: number, source: string) {
  // Distribute funding across active projects based on priority and need
  const activeProjects = socialProjects.filter(p => p.status === 'active');
  const amountPerProject = amount / activeProjects.length;
  
  activeProjects.forEach(project => {
    const remainingNeeded = project.fundingGoal - project.currentFunding;
    const allocation = Math.min(amountPerProject, remainingNeeded);
    project.currentFunding += allocation;
    
    // Update impact metrics based on funding
    project.impact.peopleHelped += Math.floor(allocation / 50); // $50 per person helped
  });
  
  sendRealTimeUpdate();
}

// Send real-time updates to all clients
function sendRealTimeUpdate() {
  const updateData = {
    type: 'projects:update',
    data: {
      projects: socialProjects,
      tokenMetrics,
      summary: calculateSocialSummary()
    },
    timestamp: Date.now()
  };
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(updateData));
    }
  });
}

// REST API Endpoints

// Get all projects
app.get('/api/projects', (req, res) => {
  res.json({
    projects: socialProjects,
    summary: calculateSocialSummary()
  });
});

// Get specific project
app.get('/api/projects/:id', (req, res) => {
  const project = socialProjects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

// Update project funding
app.post('/api/projects/:id/fund', (req, res) => {
  const { amount, source } = req.body;
  handleProjectUpdate(req.params.id, { funding: amount });
  res.json({ success: true, amount, source });
});

// Get token metrics
app.get('/api/token-metrics', (req, res) => {
  res.json(tokenMetrics);
});

// Allocate mining profits to social projects
app.post('/api/mining-allocation', (req, res) => {
  const { dailyProfit, allocationPercentage } = req.body;
  const socialAllocation = dailyProfit * (allocationPercentage / 100);
  
  handleFundingAllocation(socialAllocation, 'mining_profits');
  
  res.json({
    success: true,
    totalProfit: dailyProfit,
    socialAllocation,
    allocationPercentage,
    impactEstimate: Math.floor(socialAllocation / 50) // Estimated people helped
  });
});

// Get social impact summary
app.get('/api/impact-summary', (req, res) => {
  const summary = calculateSocialSummary();
  res.json({
    ...summary,
    tokenMetrics: {
      socialTokensInCirculation: tokenMetrics.socialProjectsAllocated,
      communityTokensDistributed: tokenMetrics.communityRewards,
      impactMultiplier: tokenMetrics.socialImpactMultiplier
    },
    recentImpact: {
      lastMonth: {
        newPeopleHelped: 240,
        newCommunitiesReached: 3,
        fundingDeployed: 15750
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'tera-social-platform',
    port: PORT,
    projects: socialProjects.length,
    activeProjects: socialProjects.filter(p => p.status === 'active').length
  });
});

// Serve social platform interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>TERA Social Justice Platform</title>
        <style>
            body { 
                font-family: 'Orbitron', monospace; 
                background: linear-gradient(135deg, #0a0a0a, #2e1a1a); 
                color: #ffd700; 
                margin: 0; 
                padding: 20px;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                text-shadow: 0 0 20px #ffd700;
            }
            .project-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
                gap: 20px; 
            }
            .project-card { 
                background: linear-gradient(135deg, rgba(46, 26, 46, 0.9), rgba(30, 10, 10, 0.95));
                border: 1px solid #c71585; 
                border-radius: 10px; 
                padding: 20px; 
                box-shadow: 0 0 30px rgba(199, 21, 133, 0.3);
            }
            .progress-bar {
                width: 100%;
                height: 10px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 5px;
                overflow: hidden;
                margin: 10px 0;
            }
            .progress-fill {
                height: 100%;
                background: linear-gradient(45deg, #c71585, #ffd700);
                transition: width 0.3s ease;
            }
            .token-metrics {
                background: linear-gradient(135deg, rgba(26, 46, 26, 0.9), rgba(10, 30, 10, 0.95));
                border: 1px solid #00ff00;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
            }
            .category-education { border-left: 4px solid #4b0082; }
            .category-healthcare { border-left: 4px solid #c71585; }
            .category-environment { border-left: 4px solid #00ff00; }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
    </head>
    <body>
        <div class="header">
            <h1>💖 TERA SOCIAL JUSTICE PLATFORM 💖</h1>
            <h2>Crypto Mining for Community Impact</h2>
            <p>Named in honor of Tera Ann Harris - Fighting for justice through blockchain</p>
        </div>
        
        <div class="token-metrics">
            <h3>TERA Token Impact Metrics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <strong>Token Price:</strong> $${tokenMetrics.currentPrice}<br>
                    <strong>Market Cap:</strong> $${(tokenMetrics.marketCap / 1000000).toFixed(1)}M
                </div>
                <div>
                    <strong>Social Allocation:</strong> ${(tokenMetrics.socialProjectsAllocated / 1000000).toFixed(0)}M TERA<br>
                    <strong>Community Rewards:</strong> ${(tokenMetrics.communityRewards / 1000000).toFixed(0)}M TERA
                </div>
                <div>
                    <strong>People Helped:</strong> ${calculateSocialSummary().totalImpact}<br>
                    <strong>Communities:</strong> ${calculateSocialSummary().totalCommunities}
                </div>
                <div>
                    <strong>Total Funding:</strong> $${calculateSocialSummary().totalFunding.toLocaleString()}<br>
                    <strong>Active Projects:</strong> ${calculateSocialSummary().active}
                </div>
            </div>
        </div>
        
        <div class="project-grid">
            ${socialProjects.map(project => {
              const progressPercent = (project.currentFunding / project.fundingGoal) * 100;
              return `
                <div class="project-card category-${project.category}">
                    <h3>${project.title}</h3>
                    <p><strong>Category:</strong> ${project.category.toUpperCase()}</p>
                    <p>${project.description}</p>
                    <p><strong>Location:</strong> ${project.location}</p>
                    
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <p><strong>Funding:</strong> $${project.currentFunding.toLocaleString()} / $${project.fundingGoal.toLocaleString()} (${progressPercent.toFixed(1)}%)</p>
                    
                    <p><strong>Impact:</strong></p>
                    <ul>
                        <li>People Helped: ${project.impact.peopleHelped}</li>
                        <li>Communities Reached: ${project.impact.communitiesReached}</li>
                    </ul>
                    
                    <p><strong>TERA Allocation:</strong> ${project.tokenAllocation.toLocaleString()} tokens</p>
                    <p><strong>Status:</strong> <span style="color: ${
                      project.status === 'active' ? '#00ff00' : 
                      project.status === 'completed' ? '#ffd700' : '#ff9900'
                    }">${project.status.toUpperCase()}</span></p>
                </div>
              `;
            }).join('')}
        </div>
        
        <script>
            // WebSocket connection for real-time updates
            const ws = new WebSocket('ws://localhost:3002/social-ws');
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'projects:update') {
                    console.log('Social projects updated:', data);
                    // In a real implementation, update the UI here
                }
            };
        </script>
    </body>
    </html>
  `);
});

// Simulate regular funding from mining operations
setInterval(() => {
  // Simulate receiving mining profits allocation
  const miningProfit = Math.random() * 200 + 100; // $100-300 random profit
  const socialAllocationPercent = 30; // 30% goes to social projects
  const socialAllocation = miningProfit * (socialAllocationPercent / 100);
  
  handleFundingAllocation(socialAllocation, 'mining_profits');
  
  // Update token metrics
  tokenMetrics.volume24h += Math.random() * 50000 + 25000;
  tokenMetrics.currentPrice += (Math.random() - 0.5) * 0.001;
  tokenMetrics.currentPrice = Math.max(0.001, tokenMetrics.currentPrice);
  
  console.log(`💖 Social allocation: $${socialAllocation.toFixed(2)} from mining profits`);
}, 30000); // Every 30 seconds

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`💖 TERA Social Justice Platform running on port ${PORT}`);
  console.log(`🌟 Managing ${socialProjects.length} social impact projects`);
  console.log(`👥 Total people helped: ${calculateSocialSummary().totalImpact}`);
  console.log(`🏘️ Communities reached: ${calculateSocialSummary().totalCommunities}`);
});

export default app;