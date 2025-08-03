# KLOUD BOT PRO - Microservices Architecture

Your crypto ecosystem is now organized as separate microservices that can run independently:

## 🏗️ Architecture Overview

```
KLOUD BOT PRO Ecosystem
├── 📊 Main Trading Platform (Port 3000)
│   ├── Bitcoin Trading Bot
│   ├── AI Prediction System
│   ├── Market Analysis
│   └── Portfolio Management
│
├── ⛏️ Mining Control Center (Port 3001)
│   ├── Real-time Rig Monitoring
│   ├── Performance Analytics
│   ├── Remote Rig Control
│   └── Efficiency Tracking
│
└── 💖 Social Justice Platform (Port 3002)
    ├── Project Management
    ├── Token Allocation
    ├── Impact Tracking
    └── Community Engagement
```

## 🚀 How to Run Multiple Apps

### Option 1: Run All Services Separately

```bash
# Terminal 1 - Main Trading Platform (current root)
npm run dev

# Terminal 2 - Mining Control Center
cd mining-control
npm install
npm run dev

# Terminal 3 - Social Justice Platform  
cd social-token-platform
npm install
npm run dev
```

### Option 2: Create Launch Scripts

Add to your main `package.json`:

```json
{
  "scripts": {
    "dev": "npm run dev:main",
    "dev:main": "tsx server/index.ts",
    "dev:mining": "cd mining-control && npm run dev",
    "dev:social": "cd social-token-platform && npm run dev",
    "dev:all": "concurrently \"npm run dev:main\" \"npm run dev:mining\" \"npm run dev:social\""
  }
}
```

### Option 3: Docker Compose (Advanced)

Create `docker-compose.yml` for production:

```yaml
version: '3.8'
services:
  trading-platform:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      
  mining-control:
    build: ./mining-control
    ports:
      - "3001:3001"
      
  social-platform:
    build: ./social-token-platform
    ports:
      - "3002:3002"
```

## 🔗 Service Communication

Services can communicate via:

1. **HTTP APIs** - REST calls between services
2. **WebSockets** - Real-time data sharing
3. **Message Queues** - For async processing
4. **Shared Database** - Common data store

Example API calls between services:

```javascript
// From main platform to mining control
const miningData = await fetch('http://localhost:3001/api/rigs').then(r => r.json());

// From mining to social platform (revenue allocation)
await fetch('http://localhost:3002/api/mining/allocation', {
  method: 'POST',
  body: JSON.stringify({ dailyProfit: 500, allocationPercentage: 30 })
});
```

## 🌟 Benefits of This Architecture

1. **Independent Development** - Work on each service separately
2. **Scalability** - Scale mining control separately from trading
3. **Technology Flexibility** - Use different frameworks per service
4. **Fault Isolation** - If mining control goes down, trading continues
5. **Team Organization** - Different teams can own different services

## 📱 Access Your Apps

- **Main Trading Platform**: http://localhost:3000
- **Mining Control Center**: http://localhost:3001  
- **Social Justice Platform**: http://localhost:3002

## 🔧 Replit-Specific Setup

In Replit, you can:

1. **Use Multiple Tabs** - Each service in its own tab
2. **Port Forwarding** - Replit automatically exposes all ports
3. **Environment Variables** - Share secrets across services
4. **Unified Deployment** - Deploy all services together

## 🎯 Next Steps

1. Choose your preferred setup method
2. Install dependencies for new services
3. Configure cross-service communication
4. Set up shared database if needed
5. Configure unified monitoring/logging

Would you like me to help you set up any specific part of this architecture?