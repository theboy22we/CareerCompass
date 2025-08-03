import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/mining-ws' });

// Mining Operations Control Center
// This runs as a separate microservice on its own port

app.use(express.json());
app.use(express.static('public'));

// Mock mining data - replace with real mining hardware APIs
const miningRigs = [
  {
    id: 'rig-001',
    name: 'Bitcoin ASIC Farm Alpha',
    type: 'bitcoin',
    hashrate: 150, // TH/s
    powerDraw: 3250, // watts
    temperature: 42,
    status: 'online',
    efficiency: 21.67, // J/TH
    dailyRevenue: 186.50,
    location: 'Texas Facility'
  },
  {
    id: 'rig-002', 
    name: 'Ethereum GPU Farm Beta',
    type: 'ethereum',
    hashrate: 2.8, // GH/s
    powerDraw: 4800,
    temperature: 38,
    status: 'online',
    efficiency: 1.71, // MH/J
    dailyRevenue: 145.20,
    location: 'Washington Facility'
  }
];

// API Routes
app.get('/api/rigs', (req, res) => {
  res.json(miningRigs);
});

app.get('/api/rigs/:id', (req, res) => {
  const rig = miningRigs.find(r => r.id === req.params.id);
  if (!rig) {
    return res.status(404).json({ error: 'Rig not found' });
  }
  res.json(rig);
});

app.post('/api/rigs/:id/command', (req, res) => {
  const { command } = req.body;
  const rig = miningRigs.find(r => r.id === req.params.id);
  
  if (!rig) {
    return res.status(404).json({ error: 'Rig not found' });
  }

  // Simulate rig commands
  switch (command) {
    case 'restart':
      rig.status = 'restarting';
      setTimeout(() => {
        rig.status = 'online';
        broadcastUpdate();
      }, 30000);
      break;
    case 'shutdown':
      rig.status = 'offline';
      break;
    case 'start':
      rig.status = 'online';
      break;
    default:
      return res.status(400).json({ error: 'Invalid command' });
  }

  broadcastUpdate();
  res.json({ success: true, message: `Command ${command} sent to ${rig.name}` });
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('Mining control client connected');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'rigs:update',
    data: miningRigs
  }));

  ws.on('close', () => {
    console.log('Mining control client disconnected');
  });
});

function broadcastUpdate() {
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({
        type: 'rigs:update', 
        data: miningRigs,
        timestamp: Date.now()
      }));
    }
  });
}

// Simulate real-time mining data updates
setInterval(() => {
  miningRigs.forEach(rig => {
    if (rig.status === 'online') {
      // Simulate temperature fluctuations
      rig.temperature += (Math.random() - 0.5) * 2;
      rig.temperature = Math.max(35, Math.min(65, rig.temperature));
      
      // Simulate hashrate variations
      const baseHashrate = rig.type === 'bitcoin' ? 150 : 2.8;
      rig.hashrate = baseHashrate + (Math.random() - 0.5) * 0.1;
    }
  });
  
  broadcastUpdate();
}, 5000); // Update every 5 seconds

const PORT = process.env.MINING_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🔥 KLOUD Mining Control running on port ${PORT}`);
});