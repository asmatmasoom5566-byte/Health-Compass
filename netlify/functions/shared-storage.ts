/**
 * Shared In-Memory Storage for Netlify Functions
 * This provides a centralized storage that all functions can access
 * Note: In serverless, this persists only during function warm state
 */

export interface User {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  profession: string;
  country: string | null;
  clinicHospital: string | null;
  status: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export interface InviteCode {
  id: number;
  code: string;
  createdBy: number;
  maxUses: number;
  usedCount: number;
  usedBy: number[];
  isActive: boolean;
  createdAt: string;
}

// Global storage (persists during function warm state)
export const storage = {
  users: [] as User[],
  inviteCodes: [] as InviteCode[],
  nextUserId: 1,
  nextInviteCodeId: 1,
};

// Helper to ensure storage is initialized
export function initializeStorage() {
  // Storage is already initialized as empty arrays
  return storage;
}
