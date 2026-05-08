/**
 * Simple Authentication Handler for Netlify
 * Self-contained with no external dependencies except JWT
 */

import { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Simple in-memory user storage (will reset on each deploy)
interface User {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  profession: string;
  country: string | null;
  clinicHospital: string | null;
  status: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

// Global users array (persists during function warm state)
let users: User[] = [];
let nextId = 1;

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
  if (users.length === 0) {
    // Pre-hashed password for: asmat334499
    const adminPasswordHash = simpleHash('asmat334499');
    
    users.push({
      id: nextId++,
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
    });
    
    console.log('✅ Admin user created with ID:', nextId - 1);
  }
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
      const { fullName, email, phone, password, profession, country, clinicHospital } = body;

      if (!fullName || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Full name and password are required' }),
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
      const isFirstUser = users.length === 0 || (users.length === 1 && users[0].email === 'asmatmasoom5566@gmail.com');

      const newUser: User = {
        id: nextId++,
        fullName,
        email: email || null,
        phone: phone || null,
        passwordHash,
        profession: profession || 'doctor',
        country: country || null,
        clinicHospital: clinicHospital || null,
        status: 'approved', // Auto-approve for now
        role: users.length === 0 ? 'admin' : 'standard_member',
        emailVerified: true,
        phoneVerified: true,
      };

      users.push(newUser);

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
          body: JSON.stringify({ error: 'Phone number and password are required' }),
        };
      }

      console.log('Login attempt for:', identifier);
      console.log('Total users:', users.length);

      // Find user by phone or email
      const user = users.find(u => u.phone === identifier || u.email === identifier);

      if (!user) {
        console.log('User not found:', identifier);
        console.log('Available users:', users.map(u => u.email));
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
        console.log('Invalid password for:', identifier);
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
        const user = users.find(u => u.id === decoded.userId);

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
