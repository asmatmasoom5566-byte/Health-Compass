import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, Lock, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireVerified?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireVerified = true 
}: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated, isApproved, isVerified, hasRole } = useAuth();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  React.useEffect(() => {
    if (!loading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      // Not verified - redirect to verification
      if (requireVerified && !isVerified) {
        navigate('/verify');
        return;
      }

      // Not approved - show pending message
      if (!isApproved) {
        // Will show pending approval screen below
        return;
      }

      // Requires admin but user is not admin - show access denied
      if (requireAdmin && !hasRole(['admin'])) {
        setShowAccessDenied(true);
        return;
      }
    }
  }, [loading, isAuthenticated, isVerified, isApproved, navigate, requireAdmin, requireVerified, hasRole]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Not verified
  if (requireVerified && !isVerified) {
    return null; // Will redirect via useEffect
  }

  // Not approved
  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold">Account Pending Approval</h2>
            <p className="text-muted-foreground">
              Your account is waiting for administrator approval. You will receive an email notification once your account is approved.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>If you have any questions, please contact support.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not admin (when admin required) - show access denied
  if (showAccessDenied || (requireAdmin && !hasRole(['admin']))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">
              You do not have permission to access this area. Administrative privileges are required.
            </p>
            <div className="pt-4">
              <Button onClick={() => navigate('/')}>
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed - show content
  return <>{children}</>;
}
