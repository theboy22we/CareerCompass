import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// TERA Mining Rigs - Enhanced from attached assets
const miningRigs = [
  {
    id: 'tera-core-7',
    name: 'TERACORE7',
    type: 'bitcoin',
    hashrate: 110.0,
    powerDraw: 3250,
    temperature: 67,
    status: 'online',
    efficiency: 95.2,
    dailyRevenue: 45.80,
    location: 'KLOUDBUGS Data Center Alpha',
    pool: 'KLOUDBUGSCAFE POOL',
    hardware: 'ASIC S19 Pro',
    autoConfig: true,
    lastUpdate: Date.now()
  },
  {
    id: 'tera-alpha-7',
    name: 'TERAALPHA7',
    type: 'bitcoin',
    hashrate: 95.0,
    powerDraw: 2900,
    temperature: 63,
    status: 'online',
    efficiency: 93.8,
    dailyRevenue: 38.90,
    location: 'KLOUDBUGS Data Center Beta',
    pool: 'TERA SOCIAL JUSTICE POOL',
    hardware: 'ASIC S17+',
    autoConfig: true,
    lastUpdate: Date.now()
  },
  {
    id: 'tera-omega-7',
    name: 'TERAOMEGA7',
    type: 'bitcoin',
    hashrate: 125.0,
    powerDraw: 3500,
    temperature: 71,
    status: 'online',
    efficiency: 91.4,
    dailyRevenue: 52.30,
    location: 'KLOUDBUGS Data Center Gamma',
    pool: 'KLOUDBUGSCAFE POOL',
    hardware: 'Custom ASIC',
    autoConfig: false,
    lastUpdate: Date.now()
  },
  {
    id: 'tera-node-7',
    name: 'TERANODE7',
    type: 'bitcoin',
    hashrate: 130.0,
    powerDraw: 3600,
    temperature: 69,
    status: 'online',
    efficiency: 97.1,
    dailyRevenue: 56.70,
    location: 'KLOUDBUGS Data Center Delta',
    pool: 'TERA SOCIAL JUSTICE POOL',
    hardware: 'ASIC S19 Pro',
    autoConfig: true,
    lastUpdate: Date.now()
  },
  {
    id: 'tera-optimus-7',
    name: 'TERAOPTIMUS7',
    type: 'bitcoin',
    hashrate: 115.0,
    powerDraw: 3300,
    temperature: 65,
    status: 'maintenance',
    efficiency: 94.5,
    dailyRevenue: 0,
    location: 'KLOUDBUGS Data Center Epsilon',
    pool: 'KLOUDBUGSCAFE POOL',
    hardware: 'ASIC S17+',
    autoConfig: true,
    lastUpdate: Date.now()
  },
  {
    id: 'tera-justice-7',
    name: 'TERAJUSTICE7',
    type: 'bitcoin',
    hashrate: 120.0,
    powerDraw: 3400,
    temperature: 68,
    status: 'online',
    efficiency: 96.3,
    dailyRevenue: 51.20,
    location: 'KLOUDBUGS Data Center Zeta',
    pool: 'TERA SOCIAL JUSTICE POOL',
    hardware: 'Custom ASIC',
    autoConfig: true,
    lastUpdate: Date.now()
  },
  {
    id: 'tera-ann-harris-7',
    name: 'TERAANNHARRIS7',
    type: 'bitcoin',
    hashrate: 105.0,
    powerDraw: 3100,
    temperature: 64,
    status: 'online',
    efficiency: 92.7,
    dailyRevenue: 43.15,
    location: 'KLOUDBUGS Data Center Eta',
    pool: 'KLOUDBUGSCAFE POOL',
    hardware: 'ASIC S19 Pro',
    autoConfig: true,
    lastUpdate: Date.now()
  },
  {
    id: 'tera-zig-miner-7',
    name: 'TERA-ZIG-MINER7',
    type: 'bitcoin',
    hashrate: 140.0,
    powerDraw: 3800,
    temperature: 72,
    status: 'online',
    efficiency: 98.9,
    dailyRevenue: 62.40,
    location: 'KLOUDBUGS Data Center Theta',
    pool: 'TERA SOCIAL JUSTICE POOL',
    hardware: 'Custom ASIC',
    autoConfig: false,
    lastUpdate: Date.now()
  }
];

// Mining pools from attached assets
const miningPools = [
  {
    id: 'kloudbugscafe-pool',
    name: 'KLOUDBUGSCAFE POOL',
    url: 'stratum+tcp://kloudbugscafe.pool:4444',
    status: 'connected',
    hashRate: 450,
    address: 'bc1qj93mnxgm0xuwyh3jvvqurjxjyq8uktg4y0sad6',
    username: 'Kloudbugs7',
    managed: true,
    fees: 1.5,
    connectedRigs: 4
  },
  {
    id: 'tera-social-justice-pool',
    name: 'TERA SOCIAL JUSTICE POOL',
    url: 'stratum+tcp://terasocial.pool:3333',
    status: 'connected',
    hashRate: 490,
    address: 'bc1qfavnkrku005m4kdkvdtgthur4ha06us2lppdps',
    username: 'Kloudbugs7',
    managed: true,
    fees: 0.5,
    connectedRigs: 4
  }
];

// Create HTTP server
const server = createServer(app);

// Create WebSocket server for real-time mining data
const wss = new WebSocketServer({ 
  server,
  path: '/mining-ws'
});

// WebSocket connections
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('Mining control client connected');
  clients.add(ws);
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'initial_data',
    data: {
      rigs: miningRigs,
      pools: miningPools,
      summary: calculateSummary()
    }
  }));
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Mining control client disconnected');
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

// Calculate mining summary
function calculateSummary() {
  const onlineRigs = miningRigs.filter(rig => rig.status === 'online');
  const totalRevenue = onlineRigs.reduce((sum, rig) => sum + rig.dailyRevenue, 0);
  const totalPower = onlineRigs.reduce((sum, rig) => sum + rig.powerDraw, 0);
  const avgEfficiency = onlineRigs.reduce((sum, rig) => sum + rig.efficiency, 0) / onlineRigs.length;
  
  return {
    totalRevenue: totalRevenue.toFixed(2),
    totalPower,
    efficiency: avgEfficiency.toFixed(1),
    onlineRigs: onlineRigs.length,
    totalRigs: miningRigs.length,
    totalHashrate: onlineRigs.reduce((sum, rig) => sum + rig.hashrate, 0)
  };
}

// Handle WebSocket messages
function handleWebSocketMessage(data: any, ws: WebSocket) {
  switch (data.type) {
    case 'rig_control':
      handleRigControl(data.rigId, data.action);
      break;
    case 'request_update':
      sendRealTimeUpdate();
      break;
    case 'auto_configure':
      handleAutoConfiguration(data.rigId);
      break;
  }
}

// Handle rig control commands
function handleRigControl(rigId: string, action: string) {
  const rigIndex = miningRigs.findIndex(rig => rig.id === rigId);
  if (rigIndex === -1) return;
  
  const rig = miningRigs[rigIndex];
  
  switch (action) {
    case 'start':
      rig.status = 'online';
      rig.temperature = Math.floor(Math.random() * 10) + 60;
      break;
    case 'stop':
      rig.status = 'offline';
      rig.dailyRevenue = 0;
      break;
    case 'restart':
      rig.status = 'maintenance';
      setTimeout(() => {
        rig.status = 'online';
        rig.temperature = Math.floor(Math.random() * 15) + 55;
        sendRealTimeUpdate();
      }, 3000);
      break;
  }
  
  rig.lastUpdate = Date.now();
  sendRealTimeUpdate();
}

// Handle auto-configuration
function handleAutoConfiguration(rigId: string) {
  const rigIndex = miningRigs.findIndex(rig => rig.id === rigId);
  if (rigIndex === -1) return;
  
  const rig = miningRigs[rigIndex];
  rig.autoConfig = !rig.autoConfig;
  rig.status = 'configuring';
  
  setTimeout(() => {
    rig.status = 'online';
    rig.temperature = Math.floor(Math.random() * 15) + 55;
    rig.efficiency = Math.min(99, rig.efficiency + Math.random() * 3);
    sendRealTimeUpdate();
  }, 2000);
  
  sendRealTimeUpdate();
}

// Send real-time updates to all clients
function sendRealTimeUpdate() {
  const updateData = {
    type: 'rigs:update',
    data: miningRigs,
    summary: calculateSummary(),
    timestamp: Date.now()
  };
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(updateData));
    }
  });
}

// REST API Endpoints

// Get all rigs
app.get('/api/rigs', (req, res) => {
  res.json({
    rigs: miningRigs,
    summary: calculateSummary()
  });
});

// Get specific rig
app.get('/api/rigs/:id', (req, res) => {
  const rig = miningRigs.find(r => r.id === req.params.id);
  if (!rig) {
    return res.status(404).json({ error: 'Rig not found' });
  }
  res.json(rig);
});

// Control rig
app.post('/api/rigs/:id/control', (req, res) => {
  const { action } = req.body;
  handleRigControl(req.params.id, action);
  res.json({ success: true, action });
});

// Get pools
app.get('/api/pools', (req, res) => {
  res.json(miningPools);
});

// Mining operations summary
app.get('/api/operations', (req, res) => {
  res.json({
    operations: miningRigs,
    pools: miningPools,
    summary: calculateSummary(),
    platformCapacity: 7000,
    socialAllocation: {
      percentage: 30,
      dailyAmount: (parseFloat(calculateSummary().totalRevenue) * 0.3).toFixed(2)
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'mining-control',
    port: PORT,
    rigs: miningRigs.length,
    onlineRigs: miningRigs.filter(r => r.status === 'online').length
  });
});

// Serve mining control interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>KLOUDBUGS Mining Control Center</title>
        <style>
            body { 
                font-family: 'Orbitron', monospace; 
                background: linear-gradient(135deg, #0a0a0a, #1a1a2e); 
                color: #ffd700; 
                margin: 0; 
                padding: 20px;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                text-shadow: 0 0 20px #ffd700;
            }
            .rig-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                gap: 20px; 
            }
            .rig-card { 
                background: linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(10, 10, 10, 0.95));
                border: 1px solid #8a2be2; 
                border-radius: 10px; 
                padding: 20px; 
                box-shadow: 0 0 30px rgba(138, 43, 226, 0.2);
            }
            .status-online { border-color: #00ff00; }
            .status-offline { border-color: #ff0000; }
            .status-maintenance { border-color: #ffff00; }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
    </head>
    <body>
        <div class="header">
            <h1>🚀 KLOUDBUGS MINING COMMAND CENTER 🚀</h1>
            <h2>TERA Guardian Mining Operations</h2>
            <p>Real-time monitoring and control of TERA mining fleet</p>
        </div>
        
        <div class="rig-grid">
            ${miningRigs.map(rig => `
                <div class="rig-card status-${rig.status}">
                    <h3>${rig.name}</h3>
                    <p><strong>Hardware:</strong> ${rig.hardware}</p>
                    <p><strong>Hashrate:</strong> ${rig.hashrate} TH/s</p>
                    <p><strong>Power:</strong> ${rig.powerDraw}W</p>
                    <p><strong>Temperature:</strong> ${rig.temperature}°C</p>
                    <p><strong>Pool:</strong> ${rig.pool}</p>
                    <p><strong>Daily Revenue:</strong> $${rig.dailyRevenue}</p>
                    <p><strong>Status:</strong> ${rig.status.toUpperCase()}</p>
                    <p><strong>Location:</strong> ${rig.location}</p>
                </div>
            `).join('')}
        </div>
        
        <script>
            // WebSocket connection for real-time updates
            const ws = new WebSocket('ws://localhost:3001/mining-ws');
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'rigs:update') {
                    // Update UI with real-time data
                    console.log('Mining data updated:', data);
                }
            };
        </script>
    </body>
    </html>
  `);
});

// Simulate real-time data updates
setInterval(() => {
  // Update rig temperatures and efficiency randomly
  miningRigs.forEach(rig => {
    if (rig.status === 'online') {
      rig.temperature += (Math.random() - 0.5) * 2;
      rig.temperature = Math.max(55, Math.min(80, rig.temperature));
      rig.efficiency += (Math.random() - 0.5) * 0.5;
      rig.efficiency = Math.max(85, Math.min(99, rig.efficiency));
      rig.lastUpdate = Date.now();
    }
  });
  
  sendRealTimeUpdate();
}, 10000); // Update every 10 seconds

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 KLOUDBUGS Mining Control Center running on port ${PORT}`);
  console.log(`📊 Managing ${miningRigs.length} TERA mining rigs`);
  console.log(`⚡ Total hashrate: ${miningRigs.reduce((sum, rig) => sum + (rig.status === 'online' ? rig.hashrate : 0), 0)} TH/s`);
});

export default app;