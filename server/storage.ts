import { causes, type CauseItem, type InsertCause, type SearchHistory, type InsertSearchHistory, searchHistory, analysisSessions, type AnalysisSession, type InsertAnalysisSession } from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

export interface IStorage {
  getCauses(): Promise<CauseItem[]>;
  createCause(cause: InsertCause): Promise<CauseItem>;
  getSearchHistory(): Promise<SearchHistory[]>;
  addSearchHistory(history: InsertSearchHistory): Promise<SearchHistory>;
  
  createAnalysisSession(session: InsertAnalysisSession): Promise<AnalysisSession>;
  getAnalysisSession(id: number): Promise<AnalysisSession | undefined>;
  updateAnalysisSession(id: number, update: Partial<AnalysisSession>): Promise<AnalysisSession>;
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
    return await db.select().from(searchHistory).orderBy(desc(searchHistory.timestamp)).limit(5);
  }

  async addSearchHistory(insertHistory: InsertSearchHistory): Promise<SearchHistory> {
    const [history] = await db.insert(searchHistory).values(insertHistory).returning();
    return history;
  }

  async createAnalysisSession(insertSession: InsertAnalysisSession): Promise<AnalysisSession> {
    const [session] = await db.insert(analysisSessions).values(insertSession).returning();
    return session;
  }

  async getAnalysisSession(id: number): Promise<AnalysisSession | undefined> {
    const [session] = await db.select().from(analysisSessions).where(eq(analysisSessions.id, id));
    return session;
  }

  async updateAnalysisSession(id: number, update: Partial<AnalysisSession>): Promise<AnalysisSession> {
    const [session] = await db.update(analysisSessions).set(update).where(eq(analysisSessions.id, id)).returning();
    return session;
  }
}

export const storage = new DatabaseStorage();
