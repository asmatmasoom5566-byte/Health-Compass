/**
 * Simple Authentication Handler for Netlify
 * Self-contained with no external dependencies except JWT
 */

import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { storage, initializeStorage, User } from './shared-storage';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Initialize storage on import
initializeStorage();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Simple password hashing (SHA-256 for Netlify compatibility)
function simpleHash(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + 'salt-asmat-2024')
    .digest('hex');
}

function simpleVerify(password: string, hash: string): boolean {
  const newHash = simpleHash(password);
  return newHash === hash;
}

// Initialize default admin
function ensureAdminExists() {
  if (storage.users.length === 0) {
    // Pre-hashed password for: asmat334499
    const adminPasswordHash = simpleHash('asmat334499');
    
    const adminUser = {
      id: storage.nextUserId++,
      fullName: 'Asmat Kakar',
      email: 'asmatmasoom5566@gmail.com',
      phone: '0784690946',
      passwordHash: adminPasswordHash,
      profession: 'doctor',
      country: 'Afghanistan',
      clinicHospital: 'Doctor Asmat Masoom Clinic',
      status: 'approved',
      role: 'admin',
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
    };
    
    storage.users.push(adminUser);
    
    // Create default invite code
    storage.inviteCodes.push({
      id: storage.nextInviteCodeId++,
      code: 'ASMAT881166',
      createdBy: adminUser.id,
      maxUses: 1,
      usedCount: 0,
      usedBy: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    
    console.log('✅ Admin user created with ID:', adminUser.id);
    console.log('✅ Default invite code created: ASMAT881166');
  }
}

// Validate invite code
function validateInviteCode(code: string): { valid: boolean; error?: string } {
  if (!code) {
    return { valid: false, error: 'Invite code is required' };
  }

  const inviteCode = storage.inviteCodes.find(ic => ic.code === code);
  
  if (!inviteCode) {
    return { valid: false, error: 'Invalid invite code' };
  }

  if (!inviteCode.isActive) {
    return { valid: false, error: 'This invite code has been deactivated' };
  }

  if (inviteCode.usedCount >= inviteCode.maxUses) {
    return { valid: false, error: 'This invite code has already been used' };
  }

  return { valid: true };
}

// Use invite code (increment usage count)
function useInviteCode(code: string, userId: number): boolean {
  const inviteCode = storage.inviteCodes.find(ic => ic.code === code);
  
  if (!inviteCode) return false;
  
  inviteCode.usedCount += 1;
  inviteCode.usedBy.push(userId);
  
  // Deactivate if max uses reached
  if (inviteCode.usedCount >= inviteCode.maxUses) {
    inviteCode.isActive = false;
  }
  
  console.log(`✅ Invite code ${code} used by user ${userId}. Used ${inviteCode.usedCount}/${inviteCode.maxUses} times`);
  return true;
}

export const handler: Handler = async (event, context) => {
  // Ensure admin exists on every invocation
  ensureAdminExists();

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  const path = event.path || '';
  const cleanPath = path.split('?')[0];

  try {
    // POST /api/auth/register
    if (event.httpMethod === 'POST' && cleanPath === '/api/auth/register') {
      const body = JSON.parse(event.body || '{}');
      const { fullName, email, phone, password, profession, country, clinicHospital, inviteCode } = body;

      if (!fullName || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Full name and password are required' }),
        };
      }

      // Invite code is REQUIRED for registration
      if (!inviteCode) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invite code is required for registration' }),
        };
      }

      // Validate invite code
      const validation = validateInviteCode(inviteCode);
      if (!validation.valid) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: validation.error }),
        };
      }

      // Check if user exists
      if (email && users.find(u => u.email === email)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Email already registered' }),
        };
      }

      // Hash password
      const passwordHash = simpleHash(password);

      // Check if first user (make them admin)
      const isFirstUser = storage.users.length === 0 || (storage.users.length === 1 && storage.users[0].email === 'asmatmasoom5566@gmail.com');

      const newUser: User = {
        id: storage.nextUserId++,
        fullName,
        email: email || null,
        phone: phone || null,
        passwordHash,
        profession: profession || 'doctor',
        country: country || null,
        clinicHospital: clinicHospital || null,
        status: 'approved', // Auto-approve for now
        role: storage.users.length === 0 ? 'admin' : 'standard_member',
        emailVerified: true,
        phoneVerified: true,
        createdAt: new Date().toISOString(),
      };

      storage.users.push(newUser);

      // Mark invite code as used
      useInviteCode(inviteCode, newUser.id);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Registration successful',
          token,
          user: {
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            status: newUser.status,
            emailVerified: newUser.emailVerified,
            phoneVerified: newUser.phoneVerified,
          },
        }),
      };
    }

    // POST /api/auth/login
    if (event.httpMethod === 'POST' && cleanPath === '/api/auth/login') {
      const body = JSON.parse(event.body || '{}');
      const { email, password } = body;

      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Email and password are required' }),
        };
      }

      console.log('Login attempt for:', email);
      console.log('Total users:', storage.users.length);

      // Find user
      const user = storage.users.find(u => u.email === email || u.phone === email);

      if (!user) {
        console.log('User not found:', email);
        console.log('Available users:', storage.users.map(u => u.email));
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        };
      }

      console.log('User found, verifying password...');

      // Verify password
      const isValid = simpleVerify(password, user.passwordHash);
      if (!isValid) {
        console.log('Invalid password for:', email);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        };
      }

      console.log('Login successful for:', email);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
          },
        }),
      };
    }

    // GET /api/auth/me
    if (event.httpMethod === 'GET' && cleanPath === '/api/auth/me') {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Authentication required' }),
        };
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const user = storage.users.find(u => u.id === decoded.userId);

        if (!user) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'User not found' }),
          };
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            profession: user.profession,
            country: user.country,
            clinicHospital: user.clinicHospital,
          }),
        };
      } catch (error) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid or expired token' }),
        };
      }
    }

    // POST /api/auth/logout
    if (event.httpMethod === 'POST' && cleanPath === '/api/auth/logout') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Logout successful' }),
      };
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };

  } catch (error: any) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
