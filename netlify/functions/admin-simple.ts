/**
 * Database-Backed Admin Handler for Netlify
 * Uses PostgreSQL for persistent, shared data storage
 * Manages users and invite codes
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { 
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllInviteCodes,
  createInviteCode,
  deleteInviteCode,
  getStatusAuditTrail
} from './db-storage';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Generate random invite code
function generateInviteCodeString(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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
    // GET /api/admin/users - List all users
    if (event.httpMethod === 'GET' && cleanPath === '/api/admin/users') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const { search, status, role, profession, sortBy, sortOrder, page, limit } = event.queryStringParameters || {};
      
      const users = await getAllUsers({
        search,
        status,
        role,
        profession,
        sortBy,
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ users }),
      };
    }

    // PUT /api/admin/users/:id/status - Update user status
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
      
      const user = await updateUser(userId, {
        status: body.status,
        updatedAt: new Date(),
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'User status updated successfully',
          user,
        }),
      };
    }

    // PUT /api/admin/users/:id/role - Update user role
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
      
      const user = await updateUser(userId, {
        role: body.role,
        updatedAt: new Date(),
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'User role updated successfully',
          user,
        }),
      };
    }

    // DELETE /api/admin/users/:id - Delete user
    if (event.httpMethod === 'DELETE' && cleanPath.match(/^\/api\/admin\/users\/\d+$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const userId = parseInt(cleanPath.split('/')[4]);
      
      // Prevent admin from deleting their own account
      if (userId === adminCheck.userId) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Cannot delete your own account' }),
        };
      }

      const user = await getUserById(userId);
      if (!user) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }

      await deleteUser(userId);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'User deleted successfully',
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
          },
        }),
      };
    }

    // GET /api/admin/invite-codes - List all invite codes
    if (event.httpMethod === 'GET' && cleanPath === '/api/admin/invite-codes') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const { isActive } = event.queryStringParameters || {};
      const inviteCodes = await getAllInviteCodes({
        isActive: isActive ? isActive === 'true' : undefined,
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          inviteCodes: inviteCodes.map(code => ({
            ...code,
            usedBy: undefined, // Don't expose user IDs
          })),
        }),
      };
    }

    // POST /api/admin/invite-codes - Create new invite code
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
      const maxUses = body.maxUses || 1;

      const newCode = await createInviteCode({
        code: generateInviteCodeString(),
        createdBy: adminCheck.userId,
        email: null,
        phone: null,
        expiresAt: null,
        maxUses: maxUses,
        usedCount: 0,
        isActive: true,
      });

      console.log(`✅ Invite code created: ${newCode.code} (Max uses: ${maxUses})`);

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Invite code created successfully',
          inviteCode: {
            ...newCode,
            usedBy: undefined,
          },
        }),
      };
    }

    // DELETE /api/admin/invite-codes/:id - Delete invite code
    if (event.httpMethod === 'DELETE' && cleanPath.match(/^\/api\/admin\/invite-codes\/\d+$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const codeId = parseInt(cleanPath.split('/')[4]);
      
      const success = await deleteInviteCode(codeId);
      
      if (!success) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invite code not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Invite code deleted successfully',
        }),
      };
    }

    // GET /api/admin/audit-trail - Get audit trail
    if (event.httpMethod === 'GET' && cleanPath === '/api/admin/audit-trail') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const { userId } = event.queryStringParameters || {};
      const auditTrail = await getStatusAuditTrail(
        userId ? parseInt(userId) : undefined
      );

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
