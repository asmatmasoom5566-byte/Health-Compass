/**
 * Database-Backed Authentication Handler for Netlify
 * Uses PostgreSQL for persistent, shared data storage
 */

import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { 
  initializeDefaultAdmin, 
  getUserByEmail, 
  getUserByPhone,
  getUserById,
  getUserCount,
  createUser,
  getInviteCode,
  updateInviteCode,
  updateUser
} from './db-storage';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Initialize admin on first run
let initialized = false;
async function ensureAdminExists() {
  if (initialized) return;
  
  try {
    await initializeDefaultAdmin();
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize admin:', error);
  }
}

// Validate invite code
async function validateInviteCode(code: string): Promise<{ valid: boolean; error?: string }> {
  if (!code) {
    return { valid: false, error: 'Invite code is required' };
  }

  const inviteCode = await getInviteCode(code);
  
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
async function useInviteCode(code: string, userId: number): Promise<boolean> {
  const inviteCode = await getInviteCode(code);
  
  if (!inviteCode) return false;
  
  await updateInviteCode(inviteCode.id, {
    usedCount: inviteCode.usedCount + 1,
    isActive: inviteCode.usedCount + 1 < inviteCode.maxUses,
  });
  
  console.log(`✅ Invite code ${code} used by user ${userId}. Used ${inviteCode.usedCount + 1}/${inviteCode.maxUses} times`);
  return true;
}

export const handler: Handler = async (event, context) => {
  // Ensure admin exists on every invocation
  await ensureAdminExists();

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
      const validation = await validateInviteCode(inviteCode);
      if (!validation.valid) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: validation.error }),
        };
      }

      // Check if user exists
      if (email) {
        const existingEmail = await getUserByEmail(email);
        if (existingEmail) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Email already registered' }),
          };
        }
      }
      
      if (phone) {
        const existingPhone = await getUserByPhone(phone);
        if (existingPhone) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Phone number already registered' }),
          };
        }
      }

      // Hash password
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });

      // Check if first user (make them admin)
      const userCount = await getUserCount();
      const isFirstUser = userCount === 0;

      const newUser = await createUser({
        fullName,
        email: email || null,
        phone: phone || null,
        passwordHash,
        profession: profession || 'doctor',
        country: country || null,
        clinicHospital: clinicHospital || null,
        status: 'approved', // Auto-approve for now
        role: isFirstUser ? 'admin' : 'standard_member',
        emailVerified: true,
        phoneVerified: true,
      });

      // Mark invite code as used
      await useInviteCode(inviteCode, newUser.id);

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
      const { phone, email, password } = body;

      // Accept either phone or email as identifier
      const identifier = phone || email;
      
      if (!identifier || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Phone number (or email) and password are required' }),
        };
      }

      console.log('Login attempt for:', identifier);

      // Find user by phone or email
      let user = phone ? await getUserByPhone(phone) : await getUserByEmail(email);
      
      if (!user) {
        console.log('User not found:', identifier);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        };
      }

      console.log('User found, verifying password...');

      // Verify password
      const isValid = await argon2.verify(user.passwordHash, password);
      if (!isValid) {
        console.log('Invalid password for:', identifier);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        };
      }

      console.log('Login successful for:', identifier);

      // Update last login
      await updateUser(user.id, {
        lastLoginAt: new Date(),
        lastLoginIp: event.headers['x-forwarded-for'] || 'unknown',
      });

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
        const user = await getUserById(decoded.userId);

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
