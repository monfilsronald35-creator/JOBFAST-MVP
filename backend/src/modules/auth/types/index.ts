import type { UUID, Email, UnixMs, UserRole } from '@shared-types';

export interface AuthTokenPair {
  token:        string;
  refreshToken: string;
  expiresAt:    UnixMs;
}

export interface AuthenticatedUser {
  id:          UUID;
  email:       Email;
  role:        UserRole;
  fullName:    string;
  avatarUrl?:  string;
  verifiedAt?: UnixMs;
}

export interface AuthSession {
  userId:       UUID;
  email:        Email;
  role:         UserRole;
  issuedAt:     UnixMs;
  expiresAt:    UnixMs;
}

export interface LoginResult {
  user:   AuthenticatedUser;
  tokens: AuthTokenPair;
}

export interface RefreshResult {
  tokens: AuthTokenPair;
}

// Internal profile row from `profiles` table
export interface ProfileRow {
  id:            UUID;
  email:         Email;
  password_hash: string;
  full_name:     string;
  role:          string;
  avatar_url?:   string;
  verified_at?:  string | null;
  created_at:    string;
  updated_at:    string;
}
