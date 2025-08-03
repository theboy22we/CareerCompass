#!/bin/bash

echo "🚀 Starting KLOUD BOT PRO Ecosystem..."
echo "Starting all services on different ports..."

# Use concurrently to run all services
npx concurrently \
  --names "MAIN,MINING,SOCIAL" \
  --prefix-colors "cyan,yellow,magenta" \
  "npm run dev" \
  "cd mining-control && npm run dev" \
  "cd social-token-platform && npm run dev"