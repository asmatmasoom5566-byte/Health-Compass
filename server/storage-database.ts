/**
 * Database-Backed Storage Implementation
 * Uses PostgreSQL for persistent, shared data storage
 * Both localhost and Netlify can connect to the same database
 */

import { db, pool } from './db';
import { users, inviteCodes, userStatusAudit, verificationTokens } from '@shared/schema';
import { eq, like, desc, asc, and, or, sql } from 'drizzle-orm';
import type { User, InsertUser, InviteCode as InviteCodeType, InsertInviteCode, VerificationToken, InsertVerificationToken, UserStatusAudit as UserStatusAuditType } from '@shared/schema';
import bcrypt from 'bcryptjs';

export class DatabaseStorage {
  // User methods
  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0] || undefined;
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return Number(result[0].count);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser as any).returning();
    return result[0] as User;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const result = await db
      .update(users)
      .set(updates as any)
      .where(eq(users.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error('User not found');
    }
    return result[0] as User;
  }

  async updateUserStatus(userId: number, status: string, changedBy: number, reason?: string): Promise<User> {
    // Get current status
    const currentUser = await this.getUserById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Update user status
    const updatedUser = await this.updateUser(userId, { 
      status,
      updatedAt: new Date() 
    });

    // Log in audit trail
    await db.insert(userStatusAudit).values({
      userId,
      previousStatus: currentUser.status,
      newStatus: status,
      changedBy,
      reason: reason || null,
    });

    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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

    // Apply filters
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

    if (filters?.profession && filters.profession !== 'all') {
      conditions.push(eq(users.profession, filters.profession));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortField = filters?.sortBy === 'fullName' ? users.fullName : users.createdAt;
    const sortOrder = filters?.sortOrder === 'asc' ? asc : desc;
    query = query.orderBy(sortOrder(sortField));

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query = query.limit(filters.limit).offset(offset);
    } else if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const result = await query;
    return result as User[];
  }

  // Invite Code methods
  async getInviteCode(code: string): Promise<InviteCodeType | undefined> {
    const result = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code)).limit(1);
    return result[0] || undefined;
  }

  async getInviteCodeById(id: number): Promise<InviteCodeType | undefined> {
    const result = await db.select().from(inviteCodes).where(eq(inviteCodes.id, id)).limit(1);
    return result[0] || undefined;
  }

  async createInviteCode(insertCode: InsertInviteCode): Promise<InviteCodeType> {
    const result = await db.insert(inviteCodes).values(insertCode as any).returning();
    return result[0] as InviteCodeType;
  }

  async updateInviteCodeUsage(id: number, updates?: { isActive?: boolean }): Promise<InviteCodeType> {
    const code = await this.getInviteCodeById(id);
    if (!code) {
      throw new Error('Invite code not found');
    }

    const newUsedCount = code.usedCount + 1;
    const shouldDeactivate = updates?.isActive === false || newUsedCount >= code.maxUses;

    const result = await db
      .update(inviteCodes)
      .set({
        usedCount: newUsedCount,
        isActive: updates?.isActive !== undefined ? updates.isActive : !shouldDeactivate,
      })
      .where(eq(inviteCodes.id, id))
      .returning();

    return result[0] as InviteCodeType;
  }

  async deleteInviteCode(id: number): Promise<boolean> {
    const code = await this.getInviteCodeById(id);
    if (!code) {
      return false;
    }

    // Prevent deletion if code has been used
    if (code.usedCount > 0) {
      throw new Error('Cannot delete invite code that has been used');
    }

    await db.delete(inviteCodes).where(eq(inviteCodes.id, id));
    return true;
  }

  async getAllInviteCodes(filters?: { isActive?: boolean }): Promise<InviteCodeType[]> {
    let query = db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));

    if (filters?.isActive !== undefined) {
      query = query.where(eq(inviteCodes.isActive, filters.isActive));
    }

    const result = await query;
    return result as InviteCodeType[];
  }

  // Verification Token methods
  async getVerificationToken(token: string, type: string): Promise<VerificationToken | undefined> {
    const result = await db
      .select()
      .from(verificationTokens)
      .where(and(eq(verificationTokens.token, token), eq(verificationTokens.type, type)))
      .limit(1);
    return result[0] || undefined;
  }

  async createVerificationToken(insertToken: InsertVerificationToken): Promise<VerificationToken> {
    const result = await db.insert(verificationTokens).values(insertToken as any).returning();
    return result[0] as VerificationToken;
  }

  async deleteVerificationToken(token: string): Promise<void> {
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token));
  }

  // Audit Trail methods
  async getStatusAuditTrail(userId?: number): Promise<UserStatusAuditType[]> {
    let query = db
      .select()
      .from(userStatusAudit)
      .orderBy(desc(userStatusAudit.createdAt));

    if (userId) {
      query = query.where(eq(userStatusAudit.userId, userId));
    }

    const result = await query;
    return result as UserStatusAuditType[];
  }

  // Initialize default admin user
  async initializeDefaultData(): Promise<void> {
    const userCount = await this.getUserCount();
    
    if (userCount === 0) {
      console.log('🌱 Initializing default admin user and invite code...');
      
      const passwordHash = await bcrypt.hash('asmat334499', 10);

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
    }
  }

  // Close database connection
  async close(): Promise<void> {
    await pool.end();
  }
}

// Export singleton instance
export const dbStorage = new DatabaseStorage();
