/**
 * Simple Admin Handler for Netlify
 * Self-contained with JWT authentication
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// In-memory storage (same as auth-simple)
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

// This would normally connect to a database
// For now, we'll import from auth-simple's storage
let users: any[] = [];

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Verify admin
function verifyAdmin(event: HandlerEvent) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authentication required', status: 401 };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return { error: 'Admin access required', status: 403 };
    }

    return { userId: decoded.userId, role: decoded.role };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}

export const handler: Handler = async (event, context) => {
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
    // GET /api/admin/users
    if (event.httpMethod === 'GET' && cleanPath === '/api/admin/users') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      // Return empty array or connect to actual storage
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ users: [] }),
      };
    }

    // GET /api/admin/invite-codes
    if (event.httpMethod === 'GET' && cleanPath === '/api/admin/invite-codes') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          inviteCodes: [
            {
              id: 1,
              code: 'ASMAT881166',
              maxUses: 10,
              usedCount: 0,
              isActive: true,
            },
          ],
        }),
      };
    }

    // GET /api/admin/audit-trail
    if (event.httpMethod === 'GET' && cleanPath === '/api/admin/audit-trail') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ auditTrail: [] }),
      };
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };

  } catch (error: any) {
    console.error('Admin error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
