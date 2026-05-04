/**
 * JWT Authentication Utilities for Netlify Serverless Deployment
 */

import jwt from 'jsonwebtoken';
import { User } from '../../shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRATION = '7d'; // Token expires in 7 days

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  status: string;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email || '',
    role: user.role,
    status: user.status,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
    issuer: 'asmat-medical-app',
    subject: String(user.id),
  });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function getTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware to protect API endpoints (for Netlify Functions)
 */
export function requireAuth(event: any): JWTPayload | null {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = getTokenFromHeader(authHeader);
  
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(event: any): JWTPayload | null {
  const user = requireAuth(event);
  
  if (!user || user.role !== 'admin') {
    return null;
  }

  return user;
}
