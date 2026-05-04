/**
 * Simple Admin Handler for Netlify
 * Self-contained with JWT authentication
 * Manages users and invite codes
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { storage, initializeStorage } from './shared-storage';

// Initialize storage
initializeStorage();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Generate random invite code
function generateInviteCode(): string {
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
      const maxUses = body.maxUses || 1; // Default to single-use

      const newCode: InviteCode = {
        id: nextInviteCodeId++,
        code: generateInviteCode(),
        createdBy: adminCheck.userId,
        maxUses: maxUses,
        usedCount: 0,
        usedBy: [],
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      inviteCodes.push(newCode);

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

    // PUT /api/admin/invite-codes/:id - Update invite code (activate/deactivate)
    if (event.httpMethod === 'PUT' && cleanPath.match(/^\/api\/admin\/invite-codes\/\d+$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const codeId = parseInt(cleanPath.split('/').pop() || '0');
      const body = JSON.parse(event.body || '{}');
      
      const codeIndex = inviteCodes.findIndex(c => c.id === codeId);
      if (codeIndex === -1) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invite code not found' }),
        };
      }

      // Update fields
      if (typeof body.isActive === 'boolean') {
        inviteCodes[codeIndex].isActive = body.isActive;
      }
      if (body.maxUses && body.maxUses > 0) {
        inviteCodes[codeIndex].maxUses = body.maxUses;
        // Reactivate if maxUses increased
        if (inviteCodes[codeIndex].usedCount < inviteCodes[codeIndex].maxUses) {
          inviteCodes[codeIndex].isActive = true;
        }
      }

      console.log(`✅ Invite code ${codeId} updated`);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Invite code updated successfully',
          storage.inviteCodes
            ...inviteCodes[codeIndex],
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

      const codeId = parseInt(cleanPath.split('/').pop() || '0');
      const codeIndex = inviteCodes.findIndex(c => c.id === codeId);
      
      if (codeIndex === -1) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invite code not found' }),
        };
      }

      const deletedCode = inviteCodes[codeIndex];
      inviteCodes.splice(codeIndex, 1);

      console.log(`✅ Invite code ${deletedCode.code} deleted`);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Invite code deleted successfully',
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

      const userId = parseInt(cleanPath.split('/').pop() || '0');
      
      // Prevent admin from deleting their own account
      if (userId === adminCheck.userId) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Cannot delete your own account' }),
        };
      }

      // Find and remove user
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }

      const deletedUser = users[userIndex];
      users.splice(userIndex, 1);

      console.log(`✅ User ${deletedUser.email || deletedUser.phone} (ID: ${userId}) deleted by admin ${adminCheck.userId}`);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'User deleted successfully',
          user: {
            id: deletedUser.id,
            fullName: deletedUser.fullName,
            email: deletedUser.email,
          },
        }),
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
