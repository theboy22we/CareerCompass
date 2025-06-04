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
