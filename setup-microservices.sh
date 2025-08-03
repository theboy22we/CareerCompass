#!/bin/bash

echo "🚀 Setting up KLOUD BOT PRO Microservices..."

# Setup mining control
echo "📦 Setting up Mining Control Center..."
cd mining-control
npm install
cd ..

# Setup social platform  
echo "💖 Setting up Social Justice Platform..."
cd social-token-platform
npm install
cd ..

echo "✅ All microservices are ready!"
echo ""
echo "🌟 How to run your ecosystem:"
echo "Option 1 - Manual (3 terminals):"
echo "  Terminal 1: npm run dev (main trading platform - port 3000)"
echo "  Terminal 2: cd mining-control && npm run dev (port 3001)"
echo "  Terminal 3: cd social-token-platform && npm run dev (port 3002)"
echo ""
echo "Option 2 - With concurrently:"
echo "  npx concurrently \"npm run dev\" \"cd mining-control && npm run dev\" \"cd social-token-platform && npm run dev\""
echo ""
echo "🔗 Your apps will be available at:"
echo "  Main Trading Platform: http://localhost:3000"
echo "  Mining Control Center: http://localhost:3001"
echo "  Social Justice Platform: http://localhost:3002"