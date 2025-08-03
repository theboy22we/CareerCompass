# KLOUD BOT PRO - Cosmic Bitcoin Trading Bot

## Overview

KLOUD BOT PRO is an advanced AI-powered Bitcoin trading bot with a cosmic-themed interface. The application combines real-time market analysis, machine learning predictions, and automated trading capabilities. It features a sophisticated React frontend with a Node.js/Express backend, utilizing WebSocket connections for real-time data streaming and PostgreSQL for persistent storage.

The system is designed as a comprehensive trading platform that provides technical analysis, AI-driven predictions, portfolio management, and automated trading execution. The cosmic theme creates an immersive user experience with space-inspired visual elements and animations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite build system
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom cosmic theme variables and animations
- **State Management**: TanStack Query for server state management and caching
- **Real-time Communication**: WebSocket hooks for live data streaming
- **Charts**: Chart.js with date-fns adapter for candlestick and line charts
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with WebSocket for real-time updates
- **Real-time Features**: WebSocket server for live market data and bot state updates
- **Modular Structure**: Separate modules for trading logic, ML predictions, technical analysis, and portfolio management

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless PostgreSQL
- **Schema**: Structured tables for users, trades, bot settings, and price data
- **Migrations**: Drizzle Kit for database schema management
- **Storage Abstraction**: Interface-based storage layer supporting both database and in-memory implementations

### Trading System Architecture
- **Market Data**: Kraken API integration for real-time Bitcoin price feeds
- **Technical Analysis**: Custom indicators including RSI, MACD, Bollinger Bands, and moving averages
- **AI Predictions**: Machine learning predictor with pattern recognition and success rate tracking
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
- **Machine Learning**: Pattern recognition and prediction algorithms

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