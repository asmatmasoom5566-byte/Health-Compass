/**
 * Database Storage for Netlify Functions
 * Connects to PostgreSQL for persistent, shared data storage
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, like, desc, asc, and, or, sql } from 'drizzle-orm';
import * as schema from '../../shared/schema';

// Initialize database connection
let dbInstance: ReturnType<typeof drizzle> | null = null;
let poolInstance: Pool | null = null;

function getDatabase() {
  if (!dbInstance) {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    poolInstance = new Pool({ 
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Required for Neon/Supabase
    });

    dbInstance = drizzle(poolInstance, { schema });
    console.log('✅ Database connection established');
  }

  return { db: dbInstance, pool: poolInstance! };
}

// User operations
export async function getUserById(id: number) {
  const { db } = getDatabase();
  const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const { db } = getDatabase();
  const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return result[0] || null;
}

export async function getUserByPhone(phone: string) {
  const { db } = getDatabase();
  const result = await db.select().from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  return result[0] || null;
}

export async function getUserCount() {
  const { db } = getDatabase();
  const result = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
  return Number(result[0].count);
}

export async function createUser(userData: any) {
  const { db } = getDatabase();
  const result = await db.insert(schema.users).values(userData).returning();
  return result[0];
}

export async function updateUser(id: number, updates: any) {
  const { db } = getDatabase();
  const result = await db
    .update(schema.users)
    .set(updates)
    .where(eq(schema.users.id, id))
    .returning();
  
  if (result.length === 0) {
    throw new Error('User not found');
  }
  return result[0];
}

export async function deleteUser(id: number) {
  const { db } = getDatabase();
  const user = await getUserById(id);
  
  if (!user) {
    throw new Error('User not found');
  }

  await db.delete(schema.users).where(eq(schema.users.id, id));
  return true;
}

export async function getAllUsers(filters?: any) {
  const { db } = getDatabase();
  let query = db.select().from(schema.users);

  const conditions = [];
  
  if (filters?.search) {
    conditions.push(
      or(
        like(schema.users.fullName, `%${filters.search}%`),
        like(schema.users.email, `%${filters.search}%`),
        like(schema.users.phone, `%${filters.search}%`)
      )
    );
  }

  if (filters?.status && filters.status !== 'all') {
    conditions.push(eq(schema.users.status, filters.status));
  }

  if (filters?.role && filters.role !== 'all') {
    conditions.push(eq(schema.users.role, filters.role));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const sortField = filters?.sortBy === 'fullName' ? schema.users.fullName : schema.users.createdAt;
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

// Invite code operations
export async function getInviteCode(code: string) {
  const { db } = getDatabase();
  const result = await db.select().from(schema.inviteCodes).where(eq(schema.inviteCodes.code, code)).limit(1);
  return result[0] || null;
}

export async function getInviteCodeById(id: number) {
  const { db } = getDatabase();
  const result = await db.select().from(schema.inviteCodes).where(eq(schema.inviteCodes.id, id)).limit(1);
  return result[0] || null;
}

export async function createInviteCode(codeData: any) {
  const { db } = getDatabase();
  const result = await db.insert(schema.inviteCodes).values(codeData).returning();
  return result[0];
}

export async function updateInviteCode(id: number, updates: any) {
  const { db } = getDatabase();
  const result = await db
    .update(schema.inviteCodes)
    .set(updates)
    .where(eq(schema.inviteCodes.id, id))
    .returning();
  
  if (result.length === 0) {
    throw new Error('Invite code not found');
  }
  return result[0];
}

export async function deleteInviteCode(id: number) {
  const { db } = getDatabase();
  const code = await getInviteCodeById(id);
  
  if (!code) {
    return false;
  }

  if (code.usedCount > 0) {
    throw new Error('Cannot delete invite code that has been used');
  }

  await db.delete(schema.inviteCodes).where(eq(schema.inviteCodes.id, id));
  return true;
}

export async function getAllInviteCodes(filters?: any) {
  const { db } = getDatabase();
  let query = db.select().from(schema.inviteCodes).orderBy(desc(schema.inviteCodes.createdAt));

  if (filters?.isActive !== undefined) {
    query = query.where(eq(schema.inviteCodes.isActive, filters.isActive));
  }

  return await query;
}

// Audit trail operations
export async function getStatusAuditTrail(userId?: number) {
  const { db } = getDatabase();
  let query = db
    .select()
    .from(schema.userStatusAudit)
    .orderBy(desc(schema.userStatusAudit.createdAt));

  if (userId) {
    query = query.where(eq(schema.userStatusAudit.userId, userId));
  }

  return await query;
}

// Initialize default admin
export async function initializeDefaultAdmin() {
  const userCount = await getUserCount();
  
  if (userCount === 0) {
    console.log('🌱 Creating default admin user...');
    
    const { hashPassword } = await import('../../server/services/auth');
    const passwordHash = await hashPassword('asmat334499');

    const adminUser = await createUser({
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

    await createInviteCode({
      code: 'ASMAT881166',
      createdBy: adminUser.id,
      email: null,
      phone: null,
      expiresAt: null,
      maxUses: 10,
      isActive: true,
    });

    console.log('✅ Admin user created:', adminUser.email);
    console.log('✅ Invite code created: ASMAT881166');
  }
}

// Cleanup
export async function closeDatabase() {
  if (poolInstance) {
    await poolInstance.end();
  }
}
