import "dotenv/config";
import { type User, type InsertUser, type InviteCode, type UserStatusAudit } from "@shared/schema";
import { hashPassword } from "./services/auth";

class InMemoryStorage {
  private users: (User & { passwordPlain?: string })[] = [];
  private inviteCodes: InviteCode[] = [];
  private userStatusAudit: UserStatusAudit[] = [];
  private nextId = 1;

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return this.users.find(u => u.phone === phone);
  }

  async getUserCount(): Promise<number> {
    return this.users.length;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser = {
      id: this.nextId++,
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: insertUser.emailVerified ?? false,
      phoneVerified: insertUser.phoneVerified ?? false,
    } as User & { passwordPlain?: string };
    
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    this.users[index] = updatedUser;
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    return this.inviteCodes.find(c => c.code === code);
  }

  async createInviteCode(insertCode: Omit<InviteCode, 'id' | 'createdAt'>): Promise<InviteCode> {
    const newCode: InviteCode = {
      id: this.nextId++,
      ...insertCode,
      createdAt: new Date(),
    };
    this.inviteCodes.push(newCode);
    return newCode;
  }

  async updateInviteCodeUsage(code: string): Promise<void> {
    const inviteCode = this.inviteCodes.find(c => c.code === code);
    if (inviteCode) {
      inviteCode.usedCount += 1;
      inviteCode.isActive = inviteCode.usedCount < inviteCode.maxUses;
    }
  }

  // Causes methods
  private causes: any[] = [];
  
  async getCauses(): Promise<any[]> {
    return this.causes;
  }

  async createCause(cause: any): Promise<any> {
    this.causes.push(cause);
    return cause;
  }

  async clearCauses(): Promise<void> {
    this.causes = [];
  }

  // Pharmacology methods
  private pharmacology: any[] = [];
  
  async getPharmacology(): Promise<any[]> {
    return this.pharmacology;
  }

  async createMedicine(medicine: any): Promise<any> {
    this.pharmacology.push(medicine);
    return medicine;
  }

  async clearPharmacology(): Promise<void> {
    this.pharmacology = [];
  }

  // Patient records methods
  private patientRecords: any[] = [];
  
  async getPatientRecords(): Promise<any[]> {
    return this.patientRecords;
  }

  async createPatientRecord(record: any): Promise<any> {
    this.patientRecords.push(record);
    return record;
  }

  async clearPatientRecords(): Promise<void> {
    this.patientRecords = [];
  }

  // Search history
  private searchHistory: any[] = [];
  
  async addSearchHistory(entry: any): Promise<any> {
    this.searchHistory.push(entry);
    return entry;
  }

  async getSearchHistory(userId: number): Promise<any[]> {
    return this.searchHistory.filter(h => h.userId === userId);
  }

  async initializeDefaultData() {
    const userCount = await this.getUserCount();
    
    if (userCount === 0) {
      console.log('🌱 Initializing default admin user and invite code...');
      
      const passwordHash = await hashPassword('asmat334499');
      console.log('🔑 Generated password hash for admin:', passwordHash.substring(0, 60) + '...');

      // Create admin user
      const adminUser = await this.createUser({
        fullName: 'Asmat Kakar',
        email: null,
        phone: '0784690946',
        passwordHash,
        passwordPlain: 'asmat334499',
        profession: 'doctor',
        country: 'Afghanistan',
        clinicHospital: 'Doctor Asmat Masoom Clinic',
        status: 'approved',
        role: 'admin',
        emailVerified: true,
        phoneVerified: true,
        lastLoginIp: null,
      });
      
      console.log('✅ Admin user created with ID:', adminUser.id);
      console.log('✅ Stored password hash:', adminUser.passwordHash?.substring(0, 60) + '...');

      // Create custom invite code
      await this.createInviteCode({
        code: 'ASMAT881166',
        createdBy: adminUser.id,
        email: null,
        phone: null,
        expiresAt: null,
        maxUses: 10,
        usedCount: 0,
        isActive: true,
      });

      console.log('✅ Admin user created:', adminUser.fullName);
      console.log('✅ Invite code created: ASMAT881166');
    }
  }
}

// Use database storage if DATABASE_URL is available, otherwise use in-memory
const storage = new InMemoryStorage();

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL detected - PostgreSQL storage will be used');
} else {
  console.log('📦 Using in-memory storage (no DATABASE_URL)');
}

export { storage };