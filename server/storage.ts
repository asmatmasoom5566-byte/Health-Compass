import { Cause, type SearchHistory, type InsertSearchHistory, type AnalysisSession, type InsertAnalysisSession } from "@shared/schema";
import { type User, type InsertUser, type VerificationToken, type InsertVerificationToken, type InviteCode, type InsertInviteCode, type UserStatusAudit } from "@shared/schema";
import { hashPassword } from "./services/auth";
import { db } from './db';
import { users, inviteCodes, userStatusAudit, causes, searchHistory, analysisSessions, verificationTokens } from '@shared/schema';
import { eq, like, or, desc, asc, and, count, sql as drizzleSql } from 'drizzle-orm';

// Use PostgreSQL storage if database is connected, otherwise use in-memory
const usePostgres = db !== null;

if (usePostgres) {
  console.log('📦 Using PostgreSQL storage');
} else {
  console.log('📦 Using in-memory storage (fallback)');
}

// PostgreSQL Storage Class
class PostgresStorage {
  private causes: Cause[] = [];
  private searchHistory: SearchHistory[] = [];
  private analysisSessions: AnalysisSession[] = [];
  private users: User[] = [];
  private verificationTokens: VerificationToken[] = [];
  private inviteCodes: InviteCode[] = [];
  private userStatusAudit: UserStatusAudit[] = [];
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
    return this.users.length;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextId++,
      ...insertUser,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    this.users.push(newUser);
    return newUser;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return this.users.find(user => user.phone === phone);
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
    let filtered = [...this.users];

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(u => 
        u.fullName.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.phone?.includes(search)
      );
    }

    if (filters?.status) {
      filtered = filtered.filter(u => u.status === filters.status);
    }

    if (filters?.role) {
      filtered = filtered.filter(u => u.role === filters.role);
    }

    if (filters?.profession) {
      filtered = filtered.filter(u => u.profession === filters.profession);
    }

    if (filters?.sortBy) {
      const field = filters.sortBy as keyof User;
      filtered.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    if (filters?.page && filters?.limit) {
      const start = (filters.page - 1) * filters.limit;
      filtered = filtered.slice(start, start + filters.limit);
    }

    return filtered;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) throw new Error("User not found");
    
    this.users[index] = { 
      ...this.users[index], 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.users[index];
  }

  async deleteUser(id: number): Promise<void> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) throw new Error("User not found");
    this.users.splice(index, 1);
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
    const newCode: InviteCode = {
      id: this.nextId++,
      ...insertCode,
      usedCount: 0,
      createdAt: new Date(),
    };
    this.inviteCodes.push(newCode);
    return newCode;
  }

  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    return this.inviteCodes.find(c => c.code === code);
  }

  async updateInviteCodeUsage(code: string): Promise<InviteCode> {
    const index = this.inviteCodes.findIndex(c => c.code === code);
    if (index === -1) throw new Error("Invite code not found");
    
    this.inviteCodes[index].usedCount += 1;
    
    // Auto-deactivate if maxUses is reached (for single-use codes)
    if (this.inviteCodes[index].usedCount >= this.inviteCodes[index].maxUses) {
      this.inviteCodes[index].isActive = false;
      console.log(`🔒 Invite code ${code} auto-deactivated (reached max uses: ${this.inviteCodes[index].maxUses})`);
    }
    
    return this.inviteCodes[index];
  }

  async getAllInviteCodes(filters?: {
    isActive?: boolean;
    createdBy?: number;
  }): Promise<InviteCode[]> {
    let filtered = [...this.inviteCodes];

    if (filters?.isActive !== undefined) {
      filtered = filtered.filter(c => c.isActive === filters.isActive);
    }

    if (filters?.createdBy) {
      filtered = filtered.filter(c => c.createdBy === filters.createdBy);
    }

    return filtered;
  }

  async deleteInviteCode(id: number): Promise<void> {
    const index = this.inviteCodes.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Invite code not found");
    this.inviteCodes.splice(index, 1);
  }

  async deleteUser(id: number): Promise<void> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("User not found");
    
    // Prevent deleting the last admin
    const user = this.users[index];
    if (user.role === 'admin') {
      const adminCount = this.users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error("Cannot delete the last admin user");
      }
    }
    
    this.users.splice(index, 1);
  }

  async createStatusAuditEntry(insertEntry: Omit<UserStatusAudit, 'id' | 'createdAt'>): Promise<UserStatusAudit> {
    const newEntry: UserStatusAudit = {
      id: this.nextId++,
      ...insertEntry,
      createdAt: new Date(),
    };
    this.userStatusAudit.push(newEntry);
    return newEntry;
  }

  async getStatusAuditTrail(userId?: number): Promise<UserStatusAudit[]> {
    let filtered = [...this.userStatusAudit];
    if (userId) {
      filtered = filtered.filter(entry => entry.userId === userId);
    }
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
