/**
 * Simple Admin Handler for Netlify
 * Uses PostgreSQL for persistent, shared data storage
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getAllInviteCodes,
  getInviteCode,
  getInviteCodeById,
  createInviteCode,
  updateInviteCode,
  deleteInviteCode,
  getStatusAuditTrail,
  initializeDefaultAdmin
} from './db-storage';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

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
    return { error: 'Authentication required', status: 401 as number };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return { error: 'Admin access required', status: 403 as number };
    }

    return { userId: decoded.userId, role: decoded.role };
  } catch (error) {
    return { error: 'Invalid token', status: 401 as number };
  }
}

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
    // GET /api/admin/users
    if (event.httpMethod === 'GET' && cleanPath === '/api/admin/users') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck && adminCheck.status) {
        return {
          statusCode: adminCheck.status as number,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const users = await getAllUsers();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ users }),
      };
    }

    // GET /api/admin/invite-codes
    if (event.httpMethod === 'GET' && cleanPath === '/api/admin/invite-codes') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck && adminCheck.status) {
        return {
          statusCode: adminCheck.status as number,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const inviteCodes = await getAllInviteCodes();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ inviteCodes }),
      };
    }

    // POST /api/admin/invite-codes
    if (event.httpMethod === 'POST' && cleanPath === '/api/admin/invite-codes') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck && adminCheck.status) {
        return {
          statusCode: adminCheck.status as number,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const body = JSON.parse(event.body || '{}');
      
      // Generate invite code
      const prefix = 'HC';
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
      const code = `${prefix}${random}${timestamp}`;
      
      const newCode = await createInviteCode({
        code,
        maxUses: body.maxUses || 1,
        usedCount: 0,
        isActive: true,
        createdBy: adminCheck.userId,
        email: body.email || null,
        phone: body.phone || null,
        expiresAt: body.expiresAt || null,
      });

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ inviteCode: newCode }),
      };
    }

    // PUT /api/admin/users/:id/status
    if (event.httpMethod === 'PUT' && cleanPath.match(/^\/api\/admin\/users\/\d+\/status$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck && adminCheck.status) {
        return {
          statusCode: adminCheck.status as number,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const userId = parseInt(cleanPath.split('/')[4]);
      const body = JSON.parse(event.body || '{}');
      
      const updatedUser = await updateUser(userId, { status: body.status });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ user: updatedUser }),
      };
    }

    // PUT /api/admin/users/:id/role
    if (event.httpMethod === 'PUT' && cleanPath.match(/^\/api\/admin\/users\/\d+\/role$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck && adminCheck.status) {
        return {
          statusCode: adminCheck.status as number,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const userId = parseInt(cleanPath.split('/')[4]);
      const body = JSON.parse(event.body || '{}');
      
      const updatedUser = await updateUser(userId, { role: body.role });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ user: updatedUser }),
      };
    }

    // DELETE /api/admin/users/:id
    if (event.httpMethod === 'DELETE' && cleanPath.match(/^\/api\/admin\/users\/\d+$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck && adminCheck.status) {
        return {
          statusCode: adminCheck.status as number,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const userId = parseInt(cleanPath.split('/')[4]);
      await deleteUser(userId);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'User deleted successfully' }),
      };
    }

    // DELETE /api/admin/invite-codes/:id
    if (event.httpMethod === 'DELETE' && cleanPath.match(/^\/api\/admin\/invite-codes\/\d+$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck && adminCheck.status) {
        return {
          statusCode: adminCheck.status as number,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const codeId = parseInt(cleanPath.split('/')[4]);
      const deleted = await deleteInviteCode(codeId);

      if (!deleted) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invite code not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Invite code deleted successfully' }),
      };
    }

    // GET /api/admin/audit-trail
    if (event.httpMethod === 'GET' && cleanPath === '/api/admin/audit-trail') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck && adminCheck.status) {
        return {
          statusCode: adminCheck.status as number,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const auditTrail = await getStatusAuditTrail();

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ auditTrail }),
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
