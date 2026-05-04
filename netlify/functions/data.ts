/**
 * Data API Handler for Netlify Functions
 * Handles: causes CRUD, symptoms, analysis
 * Both admin (write) and regular users (read)
 */

import { Handler, HandlerEvent } from '@netlify/functions';
import { storage } from '../../server/storage';
import { verifyToken, getTokenFromHeader } from '../../server/utils/jwt';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Helper to parse path
function getPath(event: HandlerEvent): string {
  const path = event.path || '';
  return path.split('?')[0];
}

// Helper to verify authentication
function verifyAuth(event: HandlerEvent) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return { error: 'Authentication required', status: 401 };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: 'Invalid or expired token', status: 401 };
  }

  return { userId: payload.userId, role: payload.role };
}

// Helper to verify admin
function verifyAdmin(event: HandlerEvent) {
  const auth = verifyAuth(event);
  if ('status' in auth) return auth;
  if (auth.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }
  return auth;
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

  const path = getPath(event);

  try {
    // GET /api/causes - Get all causes (authenticated users)
    if (event.httpMethod === 'GET' && path === '/api/causes') {
      const authCheck = verifyAuth(event);
      if ('status' in authCheck) {
        return {
          statusCode: authCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: authCheck.error }),
        };
      }

      const causes = await storage.getCauses();

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ causes }),
      };
    }

    // POST /api/analysis - Analyze symptoms (authenticated users)
    if (event.httpMethod === 'POST' && path === '/api/analysis') {
      const authCheck = verifyAuth(event);
      if ('status' in authCheck) {
        return {
          statusCode: authCheck.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: authCheck.error }),
        };
      }

      const { symptoms, demographics } = JSON.parse(event.body || '{}');
      
      const analysis = {
        symptoms: symptoms || [],
        demographics: demographics || {},
        timestamp: new Date().toISOString(),
      };

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ analysis }),
      };
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error: any) {
    console.error('Data function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
