import { causes, type CauseItem, type InsertCause, type SearchHistory, type InsertSearchHistory, searchHistory } from "@shared/schema";
import { db } from "./db";
import { desc } from "drizzle-orm";

export interface IStorage {
  // Causes
  getCauses(): Promise<CauseItem[]>;
  createCause(cause: InsertCause): Promise<CauseItem>;
  
  // Search History
  getSearchHistory(): Promise<SearchHistory[]>;
  addSearchHistory(history: InsertSearchHistory): Promise<SearchHistory>;
}

export class DatabaseStorage implements IStorage {
  async getCauses(): Promise<CauseItem[]> {
    return await db.select().from(causes);
  }

  async createCause(insertCause: InsertCause): Promise<CauseItem> {
    const [cause] = await db.insert(causes).values(insertCause).returning();
    return cause;
  }

  async getSearchHistory(): Promise<SearchHistory[]> {
    return await db.select().from(searchHistory).orderBy(desc(searchHistory.timestamp));
  }

  async addSearchHistory(insertHistory: InsertSearchHistory): Promise<SearchHistory> {
    const [history] = await db.insert(searchHistory).values(insertHistory).returning();
    return history;
  }
}

export const storage = new DatabaseStorage();
