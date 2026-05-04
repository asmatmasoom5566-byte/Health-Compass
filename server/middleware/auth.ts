import type { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      fullName: string;
      email: string | null;
      phone: string | null;
      status: string;
      role: string;
      emailVerified: boolean;
      phoneVerified: boolean;
    }
  }
}

/**
 * Middleware to check if user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}

/**
 * Middleware to check if user is verified
 */
export function isVerified(req: Request, res: Response, next: NextFunction) {
  const user = req.user as User;
  
  if (!user.emailVerified && !user.phoneVerified) {
    return res.status(403).json({ 
      error: 'Please verify your email or phone number',
      requiresVerification: true 
    });
  }
  
  next();
}

/**
 * Middleware to check if user is approved
 */
export function isApproved(req: Request, res: Response, next: NextFunction) {
  const user = req.user as User;
  
  if (user.status !== 'approved') {
    return res.status(403).json({ 
      error: `Account status: ${user.status}. Please contact support.`,
      userStatus: user.status 
    });
  }
  
  next();
}

/**
 * Middleware to check if user has required role(s)
 */
export function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    
    if (!roles.includes(user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRoles: roles 
      });
    }
    
    next();
  };
}

/**
 * Middleware to check if user has specific permission
 */
export function hasPermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    
    const permissionMatrix: Record<string, string[]> = {
      admin: ['*'],
      editor: ['content.create', 'content.edit', 'content.view', 'users.view'],
      reviewer: ['content.review', 'content.view', 'users.view'],
      standard_member: ['content.create', 'content.view'],
      read_only_member: ['content.view'],
    };
    
    const userPermissions = permissionMatrix[user.role] || [];
    
    if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredPermission: permission 
      });
    }
    
    next();
  };
}

/**
 * Middleware to check if user is admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as User;
  
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

/**
 * Optional authentication - doesn't fail if not authenticated
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user) {
    // User is authenticated, continue
  } else {
    // No user, set to null
    req.user = null as any;
  }
  next();
}
