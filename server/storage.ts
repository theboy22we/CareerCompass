import { 
  users, 
  trades, 
  botSettings, 
  priceData,
  type User, 
  type InsertUser,
  type Trade,
  type InsertTrade,
  type BotSettings,
  type InsertBotSettings,
  type PriceData,
  type InsertPriceData
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Trade operations
  createTrade(trade: InsertTrade): Promise<Trade>;
  getTrades(limit?: number): Promise<Trade[]>;
  getTradesByDateRange(startDate: Date, endDate: Date): Promise<Trade[]>;
  updateTrade(id: number, updates: Partial<InsertTrade>): Promise<Trade | undefined>;

  // Bot settings operations
  getBotSettings(): Promise<BotSettings>;
  updateBotSettings(settings: Partial<InsertBotSettings>): Promise<BotSettings>;

  // Price data operations
  addPriceData(data: InsertPriceData): Promise<PriceData>;
  getRecentPriceData(limit?: number): Promise<PriceData[]>;
  getPriceDataByTimeRange(startTime: Date, endTime: Date): Promise<PriceData[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trades: Map<number, Trade>;
  private priceDataStore: Map<number, PriceData>;
  private botSettingsStore: BotSettings;
  
  private currentUserId: number;
  private currentTradeId: number;
  private currentPriceDataId: number;

  constructor() {
    this.users = new Map();
    this.trades = new Map();
    this.priceDataStore = new Map();
    this.currentUserId = 1;
    this.currentTradeId = 1;
    this.currentPriceDataId = 1;

    // Initialize default bot settings
    this.botSettingsStore = {
      id: 1,
      isActive: false,
      currentPositionSize: "1.00",
      maxPositionSize: "500.00",
      takeProfitPercent: "0.500",
      stopLossPercent: "0.300",
      consecutiveWins: 0,
      consecutiveLosses: 0,
      totalTrades: 0,
      winningTrades: 0,
      portfolioValue: "1000.00",
      lastUpdateTimestamp: new Date(),
    };
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    const trade: Trade = { 
      ...insertTrade, 
      id, 
      timestamp: new Date() 
    };
    this.trades.set(id, trade);
    return trade;
  }

  async getTrades(limit: number = 50): Promise<Trade[]> {
    const allTrades = Array.from(this.trades.values());
    return allTrades
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getTradesByDateRange(startDate: Date, endDate: Date): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(
      trade => trade.timestamp >= startDate && trade.timestamp <= endDate
    );
  }

  async updateTrade(id: number, updates: Partial<InsertTrade>): Promise<Trade | undefined> {
    const existingTrade = this.trades.get(id);
    if (!existingTrade) return undefined;

    const updatedTrade = { ...existingTrade, ...updates };
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }

  async getBotSettings(): Promise<BotSettings> {
    return this.botSettingsStore;
  }

  async updateBotSettings(updates: Partial<InsertBotSettings>): Promise<BotSettings> {
    this.botSettingsStore = {
      ...this.botSettingsStore,
      ...updates,
      lastUpdateTimestamp: new Date(),
    };
    return this.botSettingsStore;
  }

  async addPriceData(data: InsertPriceData): Promise<PriceData> {
    const id = this.currentPriceDataId++;
    const priceData: PriceData = {
      ...data,
      id,
      timestamp: new Date(),
    };
    this.priceDataStore.set(id, priceData);
    return priceData;
  }

  async getRecentPriceData(limit: number = 100): Promise<PriceData[]> {
    const allData = Array.from(this.priceDataStore.values());
    return allData
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getPriceDataByTimeRange(startTime: Date, endTime: Date): Promise<PriceData[]> {
    return Array.from(this.priceDataStore.values()).filter(
      data => data.timestamp >= startTime && data.timestamp <= endTime
    );
  }
}

export const storage = new MemStorage();
