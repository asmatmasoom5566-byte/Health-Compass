import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { users, inviteCodes, userStatusAudit } from '@shared/schema';
import { eq, like, or, desc, asc, and, count } from 'drizzle-orm';
import { type User, type InsertUser, type InviteCode, type InsertInviteCode, type UserStatusAudit as UserStatusAuditType } from '@shared/schema';
import { hashPassword } from './services/auth';

// Database connection
const DATABASE_URL = process.env.DATABASE_URL;

let db: any = null;

if (!DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not found, falling back to in-memory storage');
} else {
  const client = neon(DATABASE_URL);
  db = drizzle(client);
  console.log('✅ Connected to Neon PostgreSQL database');
}

// PostgreSQL Storage Class
export class PostgresStorage {
  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error('Database not connected');
    
    const result = await db.insert(users).values(insertUser as any).returning();
    return result[0] as User;
  }

  async getUserById(id: number): Promise<User | undefined> {
    if (!db) throw new Error('Database not connected');
    
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] as User | undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    if (!db) throw new Error('Database not connected');
    
    const result = await db.select().from(users).where(eq(users.phone, phone));
    return result[0] as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) throw new Error('Database not connected');
    
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] as User | undefined;
  }

  async getUserCount(): Promise<number> {
    if (!db) throw new Error('Database not connected');
    
    const result = await db.select({ count: count() }).from(users);
    return result[0].count;
  }

  async getAllUsers(filters: {
    search?: string;
    status?: string;
    role?: string;
    profession?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Promise<User[]> {
    if (!db) throw new Error('Database not connected');
    
    let query = db.select().from(users);
    
    // Apply filters
    const conditions = [];
    
    if (filters.search) {
      conditions.push(
        or(
          like(users.fullName, `%${filters.search}%`),
          like(users.email || '', `%${filters.search}%`),
          like(users.phone, `%${filters.search}%`)
        )!
      );
    }
    
    if (filters.status && filters.status !== 'all') {
      conditions.push(eq(users.status, filters.status));
    }
    
    if (filters.role && filters.role !== 'all') {
      conditions.push(eq(users.role, filters.role));
    }
    
    if (filters.profession && filters.profession !== 'all') {
      conditions.push(eq(users.profession, filters.profession));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply sorting
    const sortColumn = filters.sortBy === 'fullName' ? users.fullName : users.createdAt;
    query = query.orderBy(filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn));
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
      if (filters.page) {
        query = query.offset((filters.page - 1) * filters.limit);
      }
    }
    
    const result = await query;
    return result as User[];
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    if (!db) throw new Error('Database not connected');
    
    const result = await db.update(users).set(data as any).where(eq(users.id, id)).returning();
    
    if (result.length === 0) {
      throw new Error('User not found');
    }
    
    return result[0] as User;
  }

  async updateUserStatus(userId: number, status: string, adminId: number, reason?: string): Promise<User> {
    if (!db) throw new Error('Database not connected');
    
    const result = await db.update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (result.length === 0) {
      throw new Error('User not found');
    }
    
    // Create audit entry
    await db.insert(userStatusAudit).values({
      userId,
      adminId,
      oldStatus: '', // You might want to fetch this first
      newStatus: status,
      reason: reason || null,
    });
    
    return result[0] as User;
  }

  async deleteUser(id: number): Promise<void> {
    if (!db) throw new Error('Database not connected');
    
    // Check if this is the last admin
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.role === 'admin') {
      const adminCount = await db.select({ count: count() })
        .from(users)
        .where(eq(users.role, 'admin'));
      
      if (adminCount[0].count <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }
    
    await db.delete(users).where(eq(users.id, id));
  }

  // Invite Code methods
  async createInviteCode(insertCode: InsertInviteCode): Promise<InviteCode> {
    if (!db) throw new Error('Database not connected');
    
    const result = await db.insert(inviteCodes).values(insertCode as any).returning();
    return result[0] as InviteCode;
  }

  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    if (!db) throw new Error('Database not connected');
    
    const result = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code));
    return result[0] as InviteCode | undefined;
  }

  async getAllInviteCodes(createdBy?: number): Promise<InviteCode[]> {
    if (!db) throw new Error('Database not connected');
    
    let query = db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
    
    if (createdBy) {
      query = query.where(eq(inviteCodes.createdBy, createdBy));
    }
    
    const result = await query;
    return result as InviteCode[];
  }

  async updateInviteCodeUsage(code: string): Promise<InviteCode> {
    if (!db) throw new Error('Database not connected');
    
    const result = await db.update(inviteCodes)
      .set({ usedCount: sql`${inviteCodes.usedCount} + 1` })
      .where(eq(inviteCodes.code, code))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Invite code not found');
    }
    
    return result[0] as InviteCode;
  }

  async deleteInviteCode(id: number): Promise<void> {
    if (!db) throw new Error('Database not connected');
    
    await db.delete(inviteCodes).where(eq(inviteCodes.id, id));
  }
}

// Export singleton instance
export const postgresStorage = new PostgresStorage();
