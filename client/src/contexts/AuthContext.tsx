import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  profession?: string;
  country?: string;
  clinicHospital?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email?: string; phone?: string; password: string }) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  verifyPhone: (phone: string, otp: string) => Promise<void>;
  resendVerification: (data: { email?: string; phone?: string }) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string[]) => boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  isVerified: boolean;
}

interface RegisterData {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  profession: string;
  country?: string;
  clinicHospital?: string;
  inviteCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount
  useEffect(() => {
    fetchCurrentUser();
    
    // Poll for user updates every 30 seconds to catch role changes
    const pollInterval = setInterval(fetchCurrentUser, 30000);
    
    return () => clearInterval(pollInterval);
  }, []);

  const getToken = () => {
    return localStorage.getItem('auth_token');
  };

  const setToken = (token: string) => {
    localStorage.setItem('auth_token', token);
  };

  const removeToken = () => {
    localStorage.removeItem('auth_token');
  };

  const fetchCurrentUser = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/auth/me', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
        removeToken(); // Clear invalid token
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email?: string; phone?: string; password: string }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: credentials.phone,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    // Store JWT token
    setToken(data.token);
    
    // Set user data
    setUser(data.user);
  };

  const register = async (data: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const result = await response.json();
    
    // Store JWT token if provided (for first admin user)
    if (result.token) {
      setToken(result.token);
      setUser(result.user);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Ignore errors during logout
    } finally {
      // Clear token and user data
      removeToken();
      setUser(null);
    }
  };

  const verifyEmail = async (token: string) => {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Email verification failed');
    }

    // Refresh user data
    await fetchCurrentUser();
  };

  const verifyPhone = async (phone: string, otp: string) => {
    const response = await fetch('/api/auth/verify-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Phone verification failed');
    }

    // Refresh user data
    await fetchCurrentUser();
  };

  const resendVerification = async (data: { email?: string; phone?: string }) => {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to resend verification');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Profile update failed');
    }

    // Refresh user data
    await fetchCurrentUser();
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const response = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password change failed');
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissionMatrix: Record<string, string[]> = {
      admin: ['*'],
      editor: ['content.create', 'content.edit', 'content.view', 'users.view'],
      reviewer: ['content.review', 'content.view', 'users.view'],
      standard_member: ['content.create', 'content.view'],
      read_only_member: ['content.view'],
    };

    const userPermissions = permissionMatrix[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAuthenticated = !!user;
  const isApproved = user?.status === 'approved';
  const isVerified = (user?.emailVerified || user?.phoneVerified) === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        verifyEmail,
        verifyPhone,
        resendVerification,
        updateProfile,
        changePassword,
        refreshUser,
        hasPermission,
        hasRole,
        isAuthenticated,
        isApproved,
        isVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
