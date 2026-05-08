/**
 * Simple Admin Handler for Netlify
 * Self-contained with JWT authentication and localStorage-based data persistence
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Helper functions for localStorage-based storage
const getUsers = (): any[] => {
  try {
    const stored = process.env.NETLIFY ? '[]' : (globalThis as any).localStorage?.getItem('users') || '[]';
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

const saveUsers = (users: any[]) => {
  if (process.env.NETLIFY) return;
  (globalThis as any).localStorage?.setItem('users', JSON.stringify(users));
};

const getInviteCodes = (): any[] => {
  try {
    const stored = process.env.NETLIFY ? '[]' : (globalThis as any).localStorage?.getItem('inviteCodes') || '[]';
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

const saveInviteCodes = (codes: any[]) => {
  if (process.env.NETLIFY) return;
  (globalThis as any).localStorage?.setItem('inviteCodes', JSON.stringify(codes));
};

// Generate invite code
function generateInviteCode(): string {
  const prefix = 'HC';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}${random}${timestamp}`;
}

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

      const users = getUsers();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ users }),
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

      const inviteCodes = getInviteCodes();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ inviteCodes }),
      };
    }

    // POST /api/admin/invite-codes
    if (event.httpMethod === 'POST' && cleanPath === '/api/admin/invite-codes') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const body = JSON.parse(event.body || '{}');
      const newCode = {
        id: Date.now(),
        code: generateInviteCode(),
        maxUses: body.maxUses || 1,
        usedCount: 0,
        isActive: true,
        createdBy: adminCheck.userId,
        createdAt: new Date().toISOString(),
      };

      const inviteCodes = getInviteCodes();
      inviteCodes.push(newCode);
      saveInviteCodes(inviteCodes);

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ inviteCode: newCode }),
      };
    }

    // PUT /api/admin/users/:id/status
    if (event.httpMethod === 'PUT' && cleanPath.match(/^\/api\/admin\/users\/\d+\/status$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const userId = parseInt(cleanPath.split('/')[4]);
      const body = JSON.parse(event.body || '{}');
      const users = getUsers();
      const userIndex = users.findIndex((u: any) => u.id === userId);

      if (userIndex === -1) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }

      users[userIndex].status = body.status;
      saveUsers(users);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ user: users[userIndex] }),
      };
    }

    // PUT /api/admin/users/:id/role
    if (event.httpMethod === 'PUT' && cleanPath.match(/^\/api\/admin\/users\/\d+\/role$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const userId = parseInt(cleanPath.split('/')[4]);
      const body = JSON.parse(event.body || '{}');
      const users = getUsers();
      const userIndex = users.findIndex((u: any) => u.id === userId);

      if (userIndex === -1) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }

      users[userIndex].role = body.role;
      saveUsers(users);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ user: users[userIndex] }),
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
