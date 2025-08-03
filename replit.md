# KLOUD BOT PRO - Cosmic Bitcoin Trading Bot

## Overview

KLOUD BOT PRO is an advanced AI-powered crypto ecosystem with a microservices architecture and cosmic-themed interface. The platform combines real-time Bitcoin trading, mining operation management, and social justice token initiatives into a unified yet modular system. It features a sophisticated React frontend with multiple Node.js/Express microservices, utilizing WebSocket connections for real-time data streaming across all services.

The system is designed as a comprehensive crypto ecosystem with three main components: the main trading platform with AI predictions and portfolio management, a dedicated mining control center for real-time rig monitoring, and a social justice platform for community impact projects. The microservices architecture allows independent scaling and deployment while maintaining seamless data integration. Mining profits automatically fund social projects, creating a complete ecosystem for crypto operations and community impact. The cosmic theme creates an immersive user experience with space-inspired visual elements and animations across all services.

## User Preferences

Preferred communication style: Simple, everyday language.
AI Strategy: Building own custom AI models rather than using third-party providers like OpenAI/Anthropic.
Business Focus: Crypto mining operations, platform management, and social justice token for community impact projects.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite build system
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom cosmic theme variables and animations
- **State Management**: TanStack Query for server state management and caching
- **Real-time Communication**: WebSocket hooks for live data streaming
- **Charts**: Chart.js with date-fns adapter for candlestick and line charts
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture - Microservices
- **Main Trading Platform** (Port 3000): Node.js with Express.js framework
  - Bitcoin trading bot and AI predictions
  - Market analysis and portfolio management  
  - WebSocket for live market data and bot state updates
- **Mining Control Center** (Port 3001): Independent Node.js service
  - Real-time mining rig monitoring and control
  - Temperature, hashrate, and profitability tracking
  - WebSocket for live mining data updates
- **Social Justice Platform** (Port 3002): Dedicated Node.js service
  - Community impact project management
  - Token allocation and funding tracking
  - WebSocket for real-time project updates
- **Cross-Service Communication**: RESTful APIs for data sharing between services
- **Language**: TypeScript with ES modules across all services
- **Deployment**: Independent services with unified launch scripts

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless PostgreSQL
- **Schema**: Structured tables for users, trades, bot settings, and price data
- **Migrations**: Drizzle Kit for database schema management
- **Storage Abstraction**: Interface-based storage layer supporting both database and in-memory implementations

### Trading System Architecture
- **Market Data**: Kraken API integration for real-time Bitcoin price feeds
- **Technical Analysis**: Custom indicators including RSI, MACD, Bollinger Bands, and moving averages
- **AI System**: Modular AI manager supporting multiple AI providers and custom models
- **Custom AI Integration**: Framework for integrating user's own AI models via HTTP API
- **Multi-Model Predictions**: Simultaneous predictions from multiple AI models with confidence scoring
- **Risk Management**: Portfolio manager with position sizing, stop-loss, and take-profit mechanisms
- **Automated Scaling**: Dynamic position size adjustment based on performance metrics

### Authentication & Security
- **Session Management**: Express sessions with PostgreSQL store
- **API Security**: CORS configuration and request validation
- **Environment Variables**: Secure configuration for API keys and database credentials

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Code Quality**: TypeScript strict mode with comprehensive type definitions
- **Path Aliases**: Configured aliases for clean import statements
- **Development Server**: Hot module replacement with error overlay

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **ws**: WebSocket implementation for real-time communication
- **express**: Web application framework
- **chart.js**: Canvas-based charting library for market data visualization

### UI Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **@tanstack/react-query**: Server state management and caching
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variant management
- **date-fns**: Date utility library for time-based operations

### Trading & Market Data
- **Kraken API**: Real-time cryptocurrency market data (WebSocket and REST)
- **Technical Indicators**: Custom implementation of trading indicators
- **AI Manager**: Comprehensive AI system for custom model integration
- **Custom AI Framework**: HTTP API interface for user's own AI models
- **Multi-Provider Support**: Framework supporting OpenAI, Anthropic, and custom AI providers

### Development Dependencies
- **typescript**: Static type checking
- **vite**: Build tool and development server
- **tsx**: TypeScript execution environment
- **esbuild**: Fast JavaScript bundler for production builds

### External Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Kraken Exchange**: Cryptocurrency market data provider
- **Google Fonts**: Orbitron and Rajdhani fonts for cosmic theme
- **Font Awesome**: Icon library for UI elements