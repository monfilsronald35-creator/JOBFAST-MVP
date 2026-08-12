export const ACCOUNT_STATUSES = [
  'pending',
  'active',
  'suspended',
  'locked',
  'deleted',
] as const;

export type AccountStatus =
  typeof ACCOUNT_STATUSES[number];

export const PROFILE_VISIBILITIES = [
  'public',
  'private',
  'connections_only',
] as const;

export type ProfileVisibility =
  typeof PROFILE_VISIBILITIES[number];

export const SESSION_STATUSES = [
  'active',
  'logged_out',
  'expired',
  'revoked',
] as const;

export type SessionStatus =
  typeof SESSION_STATUSES[number];

export type UserGender =
  | 'male'
  | 'female'
  | 'other'
  | 'prefer_not_to_say';

export interface User {
  id: string;
  authUserId: string;

  email: string;
  phone: string | null;
  username: string;

  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;

  gender: UserGender | null;
  birthDate: string | null;

  countryId: string | null;
  languageId: string | null;
  timezone: string;

  accountStatus: AccountStatus;
  profileVisibility: ProfileVisibility;

  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompleted: boolean;
  onboardingCompleted: boolean;

  isBanned: boolean;
  banReason: string | null;

  failedLoginAttempts: number;
  lastFailedLogin: string | null;
  passwordChangedAt: string | null;
  lastLoginAt: string | null;

  deletedAt: string | null;

  createdIp: string | null;
  updatedIp: string | null;
  createdDevice: string | null;
  updatedDevice: string | null;

  deletedBy: string | null;
  createdBy: string | null;
  updatedBy: string | null;

  createdAt: string;
  updatedAt: string;
}

// Supabase Auth deja jere vrè session ak refresh token yo.
// UserSession itilize sèlman pou device/login tracking.
export interface UserSession {
  id: string;
  userId: string;

  sessionTokenHash: string;
  sessionStatus: SessionStatus;

  ip: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  deviceFingerprint: string | null;
  userAgent: string | null;

  country: string | null;
  city: string | null;

  isActive: boolean;
  lastActivityAt: string;
  expiresAt: string;

  loggedOutAt: string | null;
  revokedAt: string | null;

  createdAt: string;
}

// Frontend pa dwe aksede refresh_tokens dirèkteman.
// Backend/Edge Function sèlman ki jere token_hash yo.
export interface RefreshToken {
  id: string;
  userId: string;
  sessionId: string;

  tokenHash: string;

  isRevoked: boolean;

  expiresAt: string;
  createdAt: string;
}
