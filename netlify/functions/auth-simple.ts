/**
 * Simple Authentication Handler for Netlify
 * Uses PostgreSQL for persistent, shared data storage
 */

import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { getUserById, getUserByPhone, getUserByEmail, createUser, getUserCount, updateUser, initializeDefaultAdmin } from './db-storage';
import { hashPassword, verifyPassword } from '../../server/services/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export const handler: Handler = async (event, context) => {
  // Initialize default admin if needed
  await initializeDefaultAdmin();

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
      const { fullName, email, phone, password, profession, country, clinicHospital } = body;

      if (!fullName || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Full name and password are required' }),
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
            body: JSON.stringify({ error: 'Phone already registered' }),
          };
        }
      }

      // Hash password using proper bcrypt
      const passwordHash = await hashPassword(password);

      // Check if first user (make them admin)
      const userCount = await getUserCount();
      const isFirstUser = userCount === 0;

      // Create user in PostgreSQL
      const newUser = await createUser({
        fullName,
        email: email || null,
        phone: phone || null,
        passwordHash,
        profession: profession || 'doctor',
        country: country || null,
        clinicHospital: clinicHospital || null,
        status: 'approved',
        role: isFirstUser ? 'admin' : 'standard_member',
        emailVerified: true,
        phoneVerified: true,
        lastLoginIp: null,
      });

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
      const { email, phone, password } = body;
      const identifier = phone || email;

      if (!identifier || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Phone/email and password are required' }),
        };
      }

      console.log('Login attempt for:', identifier);

      // Find user by phone or email
      let user: any = null;
      if (phone) {
        user = await getUserByPhone(phone);
      }
      if (!user && email) {
        user = await getUserByEmail(email);
      }

      if (!user) {
        console.log('User not found:', identifier);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        };
      }

      console.log('User found, verifying password...');

      // Verify password using bcrypt
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        console.log('Invalid password for:', identifier);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        };
      }

      console.log('Login successful for:', user.email || user.phone);

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
