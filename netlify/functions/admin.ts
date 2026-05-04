/**
 * Admin Dashboard API Handler for Netlify Functions
 * Handles: user management, status updates, role changes, invite codes, audit trail
 * Uses JWT tokens for authentication
 */

import { Handler } from '@netlify/functions';
import { storage } from '../../server/storage';
import { verifyToken, getTokenFromHeader } from '../../server/utils/jwt';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Helper to parse path
function getPath(event: Handler): string {
  const path = event.path || '';
  return path.split('?')[0];
}

// Initialize admin user on first run
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
    }
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize admin:', error);
  }
}

// Helper to verify admin
function verifyAdmin(event: Handler) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return { error: 'Authentication required', status: 401 };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: 'Invalid or expired token', status: 401 };
  }

  if (payload.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return { userId: payload.userId, role: payload.role };
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
    // GET /api/admin/users - List all users
    if (event.httpMethod === 'GET' && path === '/api/admin/users') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const { search, status: statusFilter, role: roleFilter } = event.queryStringParameters || {};
      
      let users = await storage.getAllUsers();

      // Filter by status
      if (statusFilter) {
        users = users.filter(u => u.status === statusFilter);
      }

      // Filter by role
      if (roleFilter) {
        users = users.filter(u => u.role === roleFilter);
      }

      // Search by name or email
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(u => 
          u.fullName.toLowerCase().includes(searchLower) ||
          (u.email && u.email.toLowerCase().includes(searchLower))
        );
      }

      // Remove password hashes from response
      const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ users: sanitizedUsers }),
      };
    }

    // PUT /api/admin/users/:id/status - Update user status
    if (event.httpMethod === 'PUT' && path.match(/^\/api\/admin\/users\/\d+\/status$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const userId = parseInt(path.split('/')[4]);
      const { status, reason } = JSON.parse(event.body || '{}');

      if (!status) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Status is required' }),
        };
      }

      const user = await storage.updateUserStatus(userId, status, adminCheck.userId, reason);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'User status updated successfully',
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            status: user.status,
            role: user.role,
          },
        }),
      };
    }

    // PUT /api/admin/users/:id/role - Update user role
    if (event.httpMethod === 'PUT' && path.match(/^\/api\/admin\/users\/\d+\/role$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const userId = parseInt(path.split('/')[4]);
      const { role } = JSON.parse(event.body || '{}');

      if (!role) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Role is required' }),
        };
      }

      const user = await storage.updateUser(userId, { role });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'User role updated successfully',
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          },
        }),
      };
    }

    // GET /api/admin/users/:id - Get user details
    if (event.httpMethod === 'GET' && path.match(/^\/api\/admin\/users\/\d+$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const userId = parseInt(path.split('/')[4]);
      const user = await storage.getUserById(userId);

      if (!user) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }

      const { passwordHash, ...sanitizedUser } = user;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ user: sanitizedUser }),
      };
    }

    // POST /api/admin/invite-codes - Create new invite code
    if (event.httpMethod === 'POST' && path === '/api/admin/invite-codes') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const { email, maxUses, expiresAt } = JSON.parse(event.body || '{}');

      // Generate random code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const inviteCode = await storage.createInviteCode({
        code,
        createdBy: adminCheck.userId,
        email: email || null,
        phone: null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses || 1,
        isActive: true,
      });

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Invite code created successfully',
          inviteCode: {
            id: inviteCode.id,
            code: inviteCode.code,
            maxUses: inviteCode.maxUses,
            usedCount: inviteCode.usedCount,
            expiresAt: inviteCode.expiresAt,
            isActive: inviteCode.isActive,
          },
        }),
      };
    }

    // GET /api/admin/invite-codes - List all invite codes
    if (event.httpMethod === 'GET' && path === '/api/admin/invite-codes') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const inviteCodes = await storage.getAllInviteCodes();

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ inviteCodes }),
      };
    }

    // PUT /api/admin/invite-codes/:id - Update invite code
    if (event.httpMethod === 'PUT' && path.match(/^\/api\/admin\/invite-codes\/\d+$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const codeId = parseInt(path.split('/')[4]);
      const { isActive } = JSON.parse(event.body || '{}');

      const inviteCode = await storage.updateInviteCodeUsage(codeId, {
        isActive: isActive !== undefined ? isActive : true,
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Invite code updated successfully',
          inviteCode,
        }),
      };
    }

    // GET /api/admin/audit-trail - Get audit trail
    if (event.httpMethod === 'GET' && path === '/api/admin/audit-trail') {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const { userId } = event.queryStringParameters || {};
      const auditTrail = await storage.getStatusAuditTrail(
        userId ? parseInt(userId) : undefined
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ auditTrail }),
      };
    }

    // DELETE /api/admin/users/:id - Delete user
    if (event.httpMethod === 'DELETE' && path.match(/^\/api\/admin\/users\/\d+$/)) {
      const adminCheck = verifyAdmin(event);
      if ('status' in adminCheck) {
        return {
          statusCode: adminCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: adminCheck.error }),
        };
      }

      const userId = parseInt(path.split('/')[4]);
      
      // Prevent admin from deleting themselves
      if (userId === adminCheck.userId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Cannot delete your own account' }),
        };
      }

      // Note: InMemoryStorage doesn't have deleteUser, but PostgreSQL storage does
      // For now, just suspend the user
      await storage.updateUserStatus(userId, 'suspended', adminCheck.userId, 'Account deleted by admin');

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'User suspended successfully' }),
      };
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error: any) {
    console.error('Admin function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
