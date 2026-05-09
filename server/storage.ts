import { Cause, type SearchHistory, type InsertSearchHistory, type AnalysisSession, type InsertAnalysisSession } from "@shared/schema";
import { type User, type InsertUser, type VerificationToken, type InsertVerificationToken, type InviteCode, type InsertInviteCode, type UserStatusAudit } from "@shared/schema";
import { hashPassword } from "./services/auth";
import { db } from './db';
import { users, inviteCodes, userStatusAudit, causes, searchHistory, analysisSessions, verificationTokens } from '@shared/schema';
import { eq, like, or, desc, asc, and, count, sql as drizzleSql, sql } from 'drizzle-orm';

// Use PostgreSQL storage if database is connected, otherwise use in-memory
const usePostgres = db !== null;

if (usePostgres) {
  console.log('📦 Using PostgreSQL storage');
} else {
  console.log('📦 Using in-memory storage (fallback)');
}

// PostgreSQL Storage Class - Actually uses PostgreSQL database
class PostgresStorage {
  private causes: Cause[] = []; // Only for conditions (loaded from JSON)
  private searchHistory: SearchHistory[] = [];
  private analysisSessions: AnalysisSession[] = [];
  private verificationTokens: VerificationToken[] = [];
  private nextId = 1;

  constructor() {
    // Load conditions from my-conditions.json file
    this.loadConditionsFromJSON();
  }

  private async loadConditionsFromJSON() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      // Get __dirname equivalent for ES modules
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      
      // Try multiple possible paths
      const possiblePaths = [
        path.join(process.cwd(), 'client', 'public', 'my-conditions.json'),
        path.join(process.cwd(), 'public', 'my-conditions.json'),
        path.join(__dirname, '..', 'client', 'public', 'my-conditions.json'),
      ];
      
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const conditions = JSON.parse(fileContent);
          this.causes = conditions;
          console.log(`✅ Loaded ${conditions.length} conditions from my-conditions.json`);
          return;
        }
      }
      
      console.warn('⚠️ my-conditions.json not found, using empty database');
    } catch (error) {
      console.error('❌ Failed to load conditions from JSON:', error);
    }
  }

  async getCauses(): Promise<Cause[]> {
    return this.causes;
  }

  async createCause(insertCause: Omit<Cause, 'id'>): Promise<Cause> {
    const newCause = {
      id: this.nextId.toString(),
      ...insertCause
    };
    this.causes.push(newCause);
    return newCause;
  }

  async getSearchHistory(): Promise<SearchHistory[]> {
    return [...this.searchHistory].sort((a, b) => 
      new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
    ).slice(0, 5);
  }

  async addSearchHistory(insertHistory: InsertSearchHistory): Promise<SearchHistory> {
    const newHistory = {
      id: this.nextId++,
      ...insertHistory,
      timestamp: new Date()
    };
    this.searchHistory.push(newHistory);
    return newHistory;
  }

  async createAnalysisSession(insertSession: InsertAnalysisSession): Promise<AnalysisSession> {
    const newSession = {
      id: this.nextId++,
      status: "active",  // Ensure status is provided as it's required
      currentQuestion: null,  // Ensure currentQuestion is provided (can be null)
      answers: null,  // Ensure answers is provided (can be null)
      diagnosisScores: null,  // Ensure diagnosisScores is provided (can be null)
      ...insertSession,
      createdAt: new Date()
    };
    this.analysisSessions.push(newSession);
    return newSession;
  }

  async getAnalysisSession(id: string): Promise<AnalysisSession | undefined> {
    return this.analysisSessions.find(session => session.id === Number(id));
  }

  async updateAnalysisSession(id: string, update: Partial<AnalysisSession>): Promise<AnalysisSession> {
    const index = this.analysisSessions.findIndex(session => session.id === Number(id));
    if (index !== -1) {
      this.analysisSessions[index] = { ...this.analysisSessions[index], ...update };
      return this.analysisSessions[index];
    }
    throw new Error("Session not found");
  }

  // User Management Methods
  async getUserCount(): Promise<number> {
    const result = await db.select().from(users);
    return result.length;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0];
  }

  async getAllUsers(filters?: {
    search?: string;
    status?: string;
    role?: string;
    profession?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<User[]> {
    let query = db.select().from(users);

    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          like(users.fullName, `%${filters.search}%`),
          like(users.email, `%${filters.search}%`),
          like(users.phone, `%${filters.search}%`)
        )
      );
    }

    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(users.status, filters.status));
    }

    if (filters?.role && filters.role !== 'all') {
      conditions.push(eq(users.role, filters.role));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const sortField = filters?.sortBy === 'fullName' ? users.fullName : users.createdAt;
    const sortOrder = filters?.sortOrder === 'asc' ? asc : desc;
    query = query.orderBy(sortOrder(sortField));

    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query = query.limit(filters.limit).offset(offset);
    } else if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const result = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("User not found");
    }
    return result[0];
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.getUserById(id);
    if (!user) throw new Error("User not found");
    
    // Check if it's the last admin
    if (user.role === 'admin') {
      const admins = await db.select().from(users).where(eq(users.role, 'admin'));
      if (admins.length <= 1) {
        throw new Error("Cannot delete the last admin user");
      }
    }
    
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserStatus(userId: number, newStatus: string, adminId: number, reason?: string): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");

    const previousStatus = user.status;
    const updatedUser = await this.updateUser(userId, { status: newStatus });

    // Create audit trail entry
    await this.createStatusAuditEntry({
      userId,
      previousStatus,
      newStatus,
      changedBy: adminId,
      reason,
    });

    return updatedUser;
  }

  async createVerificationToken(insertToken: InsertVerificationToken): Promise<VerificationToken> {
    const newToken: VerificationToken = {
      id: this.nextId++,
      ...insertToken,
      createdAt: new Date(),
    };
    this.verificationTokens.push(newToken);
    return newToken;
  }

  async getVerificationToken(token: string, type: string): Promise<VerificationToken | undefined> {
    return this.verificationTokens.find(
      t => t.token === token && t.type === type && t.expiresAt > new Date()
    );
  }

  async deleteVerificationToken(token: string): Promise<void> {
    const index = this.verificationTokens.findIndex(t => t.token === token);
    if (index !== -1) {
      this.verificationTokens.splice(index, 1);
    }
  }

  async createInviteCode(insertCode: InsertInviteCode): Promise<InviteCode> {
    const result = await db.insert(inviteCodes).values({
      ...insertCode,
      usedCount: 0,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    const result = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code)).limit(1);
    return result[0];
  }

  async getInviteCodeById(id: number): Promise<InviteCode | undefined> {
    const result = await db.select().from(inviteCodes).where(eq(inviteCodes.id, id)).limit(1);
    return result[0];
  }

  async updateInviteCodeUsage(code: string): Promise<InviteCode> {
    const existingCode = await this.getInviteCode(code);
    if (!existingCode) throw new Error("Invite code not found");
    
    const newUsedCount = existingCode.usedCount + 1;
    const shouldDeactivate = newUsedCount >= existingCode.maxUses;
    
    const result = await db
      .update(inviteCodes)
      .set({ 
        usedCount: newUsedCount,
        isActive: shouldDeactivate ? false : existingCode.isActive
      })
      .where(eq(inviteCodes.code, code))
      .returning();
    
    if (shouldDeactivate) {
      console.log(`🔒 Invite code ${code} auto-deactivated (reached max uses: ${existingCode.maxUses})`);
    }
    
    return result[0];
  }

  async updateInviteCode(id: number, updates: Partial<InviteCode>): Promise<InviteCode> {
    const result = await db
      .update(inviteCodes)
      .set(updates)
      .where(eq(inviteCodes.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Invite code not found");
    }
    return result[0];
  }

  async getAllInviteCodes(filters?: {
    isActive?: boolean;
    createdBy?: number;
  }): Promise<InviteCode[]> {
    let query = db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));

    const conditions = [];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(inviteCodes.isActive, filters.isActive));
    }

    if (filters?.createdBy) {
      conditions.push(eq(inviteCodes.createdBy, filters.createdBy));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  async deleteInviteCode(id: number): Promise<void> {
    const code = await this.getInviteCodeById(id);
    if (!code) throw new Error("Invite code not found");
    
    if (code.usedCount > 0) {
      throw new Error("Cannot delete invite code that has been used");
    }
    
    await db.delete(inviteCodes).where(eq(inviteCodes.id, id));
  }

  async createStatusAuditEntry(insertEntry: Omit<UserStatusAudit, 'id' | 'createdAt'>): Promise<UserStatusAudit> {
    const result = await db.insert(userStatusAudit).values({
      ...insertEntry,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async getStatusAuditTrail(userId?: number): Promise<UserStatusAudit[]> {
    let query = db.select().from(userStatusAudit).orderBy(desc(userStatusAudit.createdAt));

    if (userId) {
      query = query.where(eq(userStatusAudit.userId, userId));
    }

    return await query;
  }

  // Auto-initialize admin user and invite code on startup
  async initializeDefaultData(): Promise<void> {
    const userCount = await this.getUserCount();
    
    if (userCount === 0) {
      console.log('🌱 Initializing default admin user and invite code...');
      
      const { hashPassword } = await import('./services/auth');
      const passwordHash = await hashPassword('asmat334499');

      // Create admin user
      const adminUser = await this.createUser({
        fullName: 'Asmat Kakar',
        email: 'asmatmasoom5566@gmail.com',
        phone: '0784690946',
        passwordHash,
        profession: 'doctor',
        country: 'Afghanistan',
        clinicHospital: 'Doctor Asmat Masoom Clinic',
        status: 'approved',
        role: 'admin',
        emailVerified: true,
        phoneVerified: true,
        lastLoginIp: null,
      });

      // Create custom invite code
      await this.createInviteCode({
        code: 'ASMAT881166',
        createdBy: adminUser.id,
        email: null,
        phone: null,
        expiresAt: null,
        maxUses: 10,
        isActive: true,
      });

      console.log('✅ Admin user created:', adminUser.fullName);
      console.log('✅ Invite code created: ASMAT881166');

      // Create test member user for demonstration
      const memberPasswordHash = await hashPassword('member123');
      const memberUser = await this.createUser({
        fullName: 'Dr. Ahmad Test',
        email: null,
        phone: '0700000001',
        passwordHash: memberPasswordHash,
        profession: 'doctor',
        country: 'Afghanistan',
        clinicHospital: 'Kabul Medical Center',
        status: 'approved',
        role: 'standard_member',
        emailVerified: false,
        phoneVerified: true,
        lastLoginIp: null,
      });
      console.log('✅ Test member created:', memberUser.fullName, '(Phone: 0700000001, Password: member123)');
    }
  }
}

// Export storage instance
export const storage = new PostgresStorage();
