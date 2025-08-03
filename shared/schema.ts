import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["BUY", "SELL"] }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  price: decimal("price", { precision: 18, scale: 2 }).notNull(),
  profit: decimal("profit", { precision: 18, scale: 2 }),
  positionSize: decimal("position_size", { precision: 18, scale: 2 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 18, scale: 2 }),
  exitPrice: decimal("exit_price", { precision: 18, scale: 2 }),
  signal: text("signal").notNull(), // "RSI_OVERSOLD", "MOMENTUM_BREAKOUT", etc.
  status: text("status", { enum: ["OPEN", "CLOSED", "FAILED"] }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").default(false).notNull(),
  currentPositionSize: decimal("current_position_size", { precision: 18, scale: 2 }).default("1.00").notNull(),
  maxPositionSize: decimal("max_position_size", { precision: 18, scale: 2 }).default("500.00").notNull(),
  takeProfitPercent: decimal("take_profit_percent", { precision: 5, scale: 3 }).default("0.500").notNull(),
  stopLossPercent: decimal("stop_loss_percent", { precision: 5, scale: 3 }).default("0.300").notNull(),
  consecutiveWins: integer("consecutive_wins").default(0).notNull(),
  consecutiveLosses: integer("consecutive_losses").default(0).notNull(),
  totalTrades: integer("total_trades").default(0).notNull(),
  winningTrades: integer("winning_trades").default(0).notNull(),
  portfolioValue: decimal("portfolio_value", { precision: 18, scale: 2 }).default("1000.00").notNull(),
  lastUpdateTimestamp: timestamp("last_update_timestamp").defaultNow().notNull(),
  
  // AI Configuration Fields
  signalConfidenceThreshold: integer("signal_confidence_threshold").default(70),
  technicalWeight: integer("technical_weight").default(40),
  aiWeight: integer("ai_weight").default(60),
  sentimentWeight: integer("sentiment_weight").default(20),
  volumeWeight: integer("volume_weight").default(15),
  
  // Risk Management
  stopLossPercentage: decimal("stop_loss_percentage", { precision: 5, scale: 2 }).default("3.00"),
  takeProfitPercentage: decimal("take_profit_percentage", { precision: 5, scale: 2 }).default("6.00"),
  maxDailyLoss: decimal("max_daily_loss", { precision: 10, scale: 2 }).default("500.00"),
  maxConsecutiveLosses: integer("max_consecutive_losses").default(3),
  
  // Pattern Recognition
  enablePatternLearning: boolean("enable_pattern_learning").default(true),
  minPatternOccurrences: integer("min_pattern_occurrences").default(5),
  patternSuccessThreshold: integer("pattern_success_threshold").default(65),
  adaptiveLearning: boolean("adaptive_learning").default(true),
  
  // Market Conditions
  enableBearMarketMode: boolean("enable_bear_market_mode").default(true),
  enableBullMarketMode: boolean("enable_bull_market_mode").default(true),
  volatilityAdjustment: boolean("volatility_adjustment").default(true),
  marketRegimeDetection: boolean("market_regime_detection").default(true),
  
  // Advanced Features
  enableDynamicScaling: boolean("enable_dynamic_scaling").default(true),
  scalingAggression: integer("scaling_aggression").default(50),
  enableEmergencyStop: boolean("enable_emergency_stop").default(true),
  emergencyStopDrawdown: integer("emergency_stop_drawdown").default(10),
  
  // Bot Identity
  botName: text("bot_name").default("BitBot Pro"),
  botPersonality: text("bot_personality").default("professional"),
});

export const priceData = pgTable("price_data", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  open: decimal("open", { precision: 18, scale: 2 }).notNull(),
  high: decimal("high", { precision: 18, scale: 2 }).notNull(),
  low: decimal("low", { precision: 18, scale: 2 }).notNull(),
  close: decimal("close", { precision: 18, scale: 2 }).notNull(),
  volume: decimal("volume", { precision: 18, scale: 8 }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  timestamp: true,
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
  lastUpdateTimestamp: true,
});

export const insertPriceDataSchema = createInsertSchema(priceData).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettings.$inferSelect;

export type InsertPriceData = z.infer<typeof insertPriceDataSchema>;
export type PriceData = typeof priceData.$inferSelect;

// AI Agents Management
export const aiAgents = pgTable("ai_agents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'ghost', 'mining', 'trading', 'social'
  status: text("status").notNull().default('offline'), // 'online', 'offline', 'error'
  config: text("config"), // JSON string
  pythonScript: text("python_script"),
  permissions: text("permissions"), // JSON array
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enhanced Mining Rigs (25 rigs)
export const miningRigs = pgTable("mining_rigs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull().default('bitcoin'),
  hashrate: decimal("hashrate", { precision: 10, scale: 2 }),
  powerDraw: integer("power_draw"),
  temperature: integer("temperature"),
  status: text("status").notNull().default('offline'), // 'online', 'offline', 'maintenance', 'error'
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }),
  dailyRevenue: decimal("daily_revenue", { precision: 10, scale: 2 }),
  location: text("location"),
  poolId: text("pool_id"),
  hardware: text("hardware"),
  autoConfig: boolean("auto_config").default(true),
  pythonScript: text("python_script"),
  aiAgentId: text("ai_agent_id"),
  lastUpdate: timestamp("last_update").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Custom Mining Pools
export const miningPools = pgTable("mining_pools", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  url: text("url").notNull(),
  status: text("status").notNull().default('disconnected'), // 'connected', 'disconnected', 'error'
  hashRate: decimal("hash_rate", { precision: 12, scale: 2 }),
  address: text("address").notNull(),
  username: text("username").notNull(),
  password: text("password"),
  managed: boolean("managed").default(true),
  fees: decimal("fees", { precision: 5, scale: 2 }),
  connectedRigs: integer("connected_rigs").default(0),
  teraTokenSupport: boolean("tera_token_support").default(false),
  customConfig: text("custom_config"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TERA Token Management
export const teraTokens = pgTable("tera_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  walletAddress: text("wallet_address").notNull(),
  balance: decimal("balance", { precision: 18, scale: 8 }),
  stakingBalance: decimal("staking_balance", { precision: 18, scale: 8 }),
  totalEarned: decimal("total_earned", { precision: 18, scale: 8 }),
  socialContribution: decimal("social_contribution", { precision: 18, scale: 8 }),
  lastTransaction: timestamp("last_transaction"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Withdrawal Management
export const withdrawals = pgTable("withdrawals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: integer("user_id").references(() => users.id),
  tokenType: text("token_type").notNull(), // 'BTC', 'ETH', 'TERA', etc.
  amount: decimal("amount", { precision: 18, scale: 8 }),
  toAddress: text("to_address").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'completed', 'failed'
  approvedBy: text("approved_by"), // AI agent that approved
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// AI Agent schemas
export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({
  id: true,
  createdAt: true,
  lastActive: true,
});

export const insertMiningRigSchema = createInsertSchema(miningRigs).omit({
  id: true,
  createdAt: true,
  lastUpdate: true,
});

export const insertMiningPoolSchema = createInsertSchema(miningPools).omit({
  id: true,
  createdAt: true,
});

export const insertTeraTokenSchema = createInsertSchema(teraTokens).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types
export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;
export type MiningRig = typeof miningRigs.$inferSelect;
export type InsertMiningRig = z.infer<typeof insertMiningRigSchema>;
export type MiningPool = typeof miningPools.$inferSelect;
export type InsertMiningPool = z.infer<typeof insertMiningPoolSchema>;
export type TeraToken = typeof teraTokens.$inferSelect;
export type InsertTeraToken = z.infer<typeof insertTeraTokenSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
