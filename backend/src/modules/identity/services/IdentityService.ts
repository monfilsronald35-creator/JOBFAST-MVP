import bcrypt from 'bcryptjs';
import { db } from '../../../core/database/SupabaseClient.js';
import { AppError, UnauthorizedError, ConflictError } from '../../../core/errors/AppError.js';
import { TypedEventBus } from '../../../core/events/TypedEventBus.js';
import { EVENT_NAMES } from '@shared-events';
import { SessionService } from './SessionService.js';
import { DeviceService } from './DeviceService.js';
import { MFAService } from './MFAService.js';
import { RecoveryService } from './RecoveryService.js';
import { OAuthService } from './OAuthService.js';
import { RiskEngine } from './RiskEngine.js';
import { AuthMethod, IdentityType, IDENTITY_TYPE_ROLES, type TokenPair, type SessionRecord } from '../types/identity.types.js';

interface RegisterInput {
  email:        string;
  password:     string;
  fullName:     string;
  identityType: IdentityType;
  phone?:       string;
}

interface LoginInput {
  email:       string;
  password:    string;
  deviceId?:   string;
  ip?:         string;
  userAgent?:  string;
  appVersion?: string;
}

interface UserRow {
  id:            string;
  email:         string;
  full_name:     string;
  role:          string;
  status:        string;
  identity_type: string;
  password_hash: string;
  locale:        string;
}

interface LoginResult {
  tokens:      TokenPair;
  session:     SessionRecord;
  user:        Omit<UserRow, 'password_hash'>;
  mfaRequired: boolean;
  riskAction?: string;
}

function parseUA(ua: string): { browser: string; os: string } {
  const browser =
    /Chrome\//.test(ua)      ? 'Chrome'  :
    /Firefox\//.test(ua)     ? 'Firefox' :
    /Safari\//.test(ua)      ? 'Safari'  :
    /Edge\//.test(ua)        ? 'Edge'    : 'Unknown';
  const os =
    /Android/.test(ua)        ? 'Android' :
    /iPhone|iPad/.test(ua)   ? 'iOS'     :
    /Windows/.test(ua)        ? 'Windows' :
    /Mac OS X/.test(ua)       ? 'macOS'   :
    /Linux/.test(ua)          ? 'Linux'   : 'Unknown';
  return { browser, os };
}

function resolveRolePlan(role: string): string {
  if (['admin', 'superadmin'].includes(role))           return 'enterprise';
  if (['enterprise', 'bank', 'government'].includes(role)) return 'enterprise';
  if (role === 'api_partner')                           return 'premium';
  return 'user';
}

export const IdentityService = {
  async register(input: RegisterInput): Promise<{ userId: string; verificationToken: string }> {
    const email = input.email.toLowerCase().trim();

    const { data: existing } = await db.client()
      .from('profiles').select('id').eq('email', email).single<{ id: string }>();
    if (existing) {
      await bcrypt.compare(input.password, '$2b$12$invalidhashtopreventtiming00000000000000000');
      throw new ConflictError('An account with this email already exists');
    }

    if (input.password.length < 8) throw new AppError('Password must be at least 8 characters', 400, 'WEAK_PASSWORD');

    const hash  = await bcrypt.hash(input.password, 12);
    const roles = IDENTITY_TYPE_ROLES[input.identityType] ?? ['customer'];
    const role  = roles[0] ?? 'customer';

    const { data: created, error } = await db.client()
      .from('profiles').insert({
        email,
        password_hash:  hash,
        full_name:       input.fullName,
        role,
        identity_type:  input.identityType,
        status:         'active',
        locale:         'ht',
      }).select('id').single<{ id: string }>();

    if (error ?? !created) throw new AppError('Registration failed', 500, 'REGISTRATION_FAILED');

    TypedEventBus.publish({
      eventName:  EVENT_NAMES.USER_REGISTERED,
      eventId:    crypto.randomUUID(),
      occurredAt: Date.now(),
      version:    1,
      userId:     created.id,
      email,
    });

    const verificationToken = await RecoveryService.createEmailVerification(created.id, email);
    return { userId: created.id, verificationToken };
  },

  async login(input: LoginInput): Promise<LoginResult> {
    const email = input.email.toLowerCase().trim();

    const { data: user } = await db.client()
      .from('profiles')
      .select('id, email, full_name, role, status, identity_type, password_hash, locale')
      .eq('email', email)
      .single<UserRow>();

    const passwordHash = user?.password_hash ?? '$2b$12$invalidhashtopreventtiming00000000000000000';
    const valid = await bcrypt.compare(input.password, passwordHash);

    if (!user || !valid) {
      if (user) await RiskEngine.recordAudit(user.id, 'login_failed', { email }, input.ip);
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'suspended') throw new AppError('Account suspended — contact support', 403, 'ACCOUNT_SUSPENDED');
    if (user.status === 'banned')    throw new AppError('Account banned', 403, 'ACCOUNT_BANNED');

    const ua = input.userAgent ?? '';
    const { browser, os } = parseUA(ua);

    const { device, isNew } = await DeviceService.register(user.id, {
      browser,
      os,
      userAgent: ua,
      ...(input.deviceId !== undefined ? { deviceId: input.deviceId } : {}),
      ...(input.ip !== undefined ? { ip: input.ip } : {}),
    });

    const { session, tokens } = await SessionService.create({
      userId:      user.id,
      email:       user.email,
      role:        user.role,
      plan:        resolveRolePlan(user.role),
      deviceId:    device.id,
      loginMethod: AuthMethod.EmailPassword,
      isNewDevice: isNew,
      userAgent:   ua,
      browser,
      os,
      ...(input.ip !== undefined ? { ip: input.ip } : {}),
      ...(input.appVersion !== undefined ? { appVersion: input.appVersion } : {}),
    });

    await RiskEngine.recordAudit(user.id, 'login_success', { method: 'email_password', isNewDevice: isNew }, input.ip, session.riskScore);

    const mfaRecord  = await MFAService.getOrCreate(user.id);
    const mfaRequired = mfaRecord.totpEnabled || session.riskScore >= 55;

    const { password_hash: _h, ...safeUser } = user;
    return {
      tokens,
      session,
      user: safeUser,
      mfaRequired,
      ...(session.riskFlags.length > 0 ? { riskAction: session.riskScore >= 55 ? 'mfa_required' : 'allow' } : {}),
    };
  },

  async loginOAuth(provider: AuthMethod, code: string, redirectUri: string, ip?: string, userAgent?: string): Promise<LoginResult> {
    const { userId, email, isNewUser: _n } = await OAuthService.authenticate(provider, code, redirectUri);

    const { data: user, error } = await db.client()
      .from('profiles')
      .select('id, email, full_name, role, status, identity_type, password_hash, locale')
      .eq('id', userId)
      .single<UserRow>();

    if (error ?? !user) throw new AppError('User not found after OAuth', 500, 'USER_NOT_FOUND');

    const ua = userAgent ?? '';
    const { browser, os } = parseUA(ua);
    const { device, isNew } = await DeviceService.register(userId, {
      browser,
      os,
      userAgent: ua,
      ...(ip !== undefined ? { ip } : {}),
    });

    const { session, tokens } = await SessionService.create({
      userId,
      email,
      role:        user.role,
      plan:        resolveRolePlan(user.role),
      deviceId:    device.id,
      loginMethod: provider,
      isNewDevice: isNew,
      userAgent:   ua,
      browser,
      os,
      ...(ip !== undefined ? { ip } : {}),
    });

    const { password_hash: _h, ...safeUser } = user;
    return { tokens, session, user: safeUser, mfaRequired: false };
  },

  async logout(sessionId: string, userId: string, jti?: string): Promise<void> {
    await SessionService.revoke(sessionId, userId, jti);
    await RiskEngine.recordAudit(userId, 'logout', { sessionId });
  },

  async logoutAll(userId: string): Promise<void> {
    await SessionService.revokeAll(userId);
    await RiskEngine.recordAudit(userId, 'logout_all', {});
  },
};
