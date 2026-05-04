/**
 * Authentication API Handler for Netlify Functions
 * Handles: login, register, verify, profile, logout
 * Uses JWT tokens instead of sessions
 */

import { Handler } from '@netlify/functions';
import { hashPassword, verifyPassword } from '../../server/services/auth';
import { storage } from '../../server/storage';
import { generateToken, verifyToken, getTokenFromHeader } from '../../server/utils/jwt';
import { userRegistrationSchema, userLoginSchema } from '../../shared/schema';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Helper to parse path
function getPath(event: Handler): string {
  const path = event.path || '';
  // Remove query parameters
  return path.split('?')[0];
}

// Initialize admin user on first run (for Netlify serverless)
let initialized = false;
async function initializeDefaultAdmin() {
  if (initialized) return;
  
  try {
    const userCount = await storage.getUserCount();
    if (userCount === 0) {
      console.log('🌱 Creating default admin user...');
      const { hashPassword } = await import('../../server/services/auth');
      const passwordHash = await hashPassword('asmat334499');

      const adminUser = await storage.createUser({
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

      // Create invite code
      await storage.createInviteCode({
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
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize admin:', error);
  }
}

export const handler: Handler = async (event, context) => {
  // Initialize admin user on first run
  await initializeDefaultAdmin();

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  const path = getPath(event);

  try {
    // POST /api/auth/register
    if (event.httpMethod === 'POST' && path === '/api/auth/register') {
      const body = JSON.parse(event.body || '{}');
      const result = userRegistrationSchema.safeParse(body);
      
      if (!result.success) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: result.error.errors[0].message }),
        };
      }

      const { fullName, email, phone, password, profession, country, clinicHospital, inviteCode } = result.data;

      // Check if user exists
      if (email) {
        const existing = await storage.getUserByEmail(email);
        if (existing) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Email already registered' }),
          };
        }
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Check if first user (make them admin)
      const userCount = await storage.getUserCount();
      const isFirstUser = userCount === 0;

      // Create user
      const user = await storage.createUser({
        fullName,
        email: email || null,
        phone: phone || null,
        passwordHash,
        profession,
        country: country || null,
        clinicHospital: clinicHospital || null,
        status: isFirstUser ? 'approved' : 'pending',
        role: isFirstUser ? 'admin' : 'standard_member',
        emailVerified: isFirstUser, // Auto-verify first user
        phoneVerified: isFirstUser,
        lastLoginIp: null,
      });

      // Generate JWT token
      const token = generateToken(user);

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          message: isFirstUser ? 'Admin account created successfully' : 'Account created successfully',
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

    // POST /api/auth/login
    if (event.httpMethod === 'POST' && path === '/api/auth/login') {
      const body = JSON.parse(event.body || '{}');
      const result = userLoginSchema.safeParse(body);

      if (!result.success) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: result.error.errors[0].message }),
        };
      }

      const { email: emailInput, password } = result.data;
      const identifier = emailInput || '';

      console.log('Login attempt for:', identifier);

      // Find user by email or phone
      let user = identifier.includes('@')
        ? await storage.getUserByEmail(identifier)
        : await storage.getUserByPhone(identifier);

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
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        console.log('Invalid password for:', identifier);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        };
      }

      console.log('Password verified, checking status...');

      // Check status
      if (user.status === 'pending') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Account pending approval' }),
        };
      }

      if (user.status === 'suspended' || user.status === 'rejected') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Account ${user.status}` }),
        };
      }

      // Update last login
      await storage.updateUser(user.id, {
        lastLoginAt: new Date(),
        lastLoginIp: event.headers['x-forwarded-for'] || 'unknown',
      });

      // Generate JWT token
      const token = generateToken(user);

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
    if (event.httpMethod === 'GET' && path === '/api/auth/me') {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      const token = getTokenFromHeader(authHeader);

      if (!token) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Authentication required' }),
        };
      }

      const jwtPayload = verifyToken(token);
      if (!jwtPayload) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid or expired token' }),
        };
      }

      const user = await storage.getUserById(jwtPayload.userId);
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
          createdAt: user.createdAt,
        }),
      };
    }

    // POST /api/auth/logout
    if (event.httpMethod === 'POST' && path === '/api/auth/logout') {
      // JWT is stateless, logout is handled client-side
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Logout successful' }),
      };
    }

    // POST /api/auth/verify-email
    if (event.httpMethod === 'POST' && path === '/api/auth/verify-email') {
      const { token } = JSON.parse(event.body || '{}');
      
      if (!token) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Verification token required' }),
        };
      }

      // For now, auto-verify (in production, implement proper token verification)
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Email verified successfully' }),
      };
    }

    // POST /api/auth/verify-phone
    if (event.httpMethod === 'POST' && path === '/api/auth/verify-phone') {
      const { phone, otp } = JSON.parse(event.body || '{}');
      
      if (!phone || !otp) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Phone and OTP required' }),
        };
      }

      // For now, auto-verify (in production, implement proper OTP verification)
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Phone verified successfully' }),
      };
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error: any) {
    console.error('Auth function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
