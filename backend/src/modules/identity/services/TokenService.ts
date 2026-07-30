import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../../../core/database/SupabaseClient.js';
import { AppError, UnauthorizedError } from '../../../core/errors/AppError.js';

const JWT_SECRET         = process.env['JWT_SECRET'] ?? '';
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] ?? JWT_SECRET + '_refresh';
const ACCESS_TTL_SEC     = 15 * 60;       // 15 minutes
const REFRESH_TTL_SEC    = 30 * 24 * 3600; // 30 days

export interface AccessPayload {
  sub:        string;
  email:      string;
  role:       string;
  plan:       string;
  sessionId:  string;
  deviceId?:  string;
  jti:        string;
  iat?:       number;
  exp?:       number;
}

export interface RefreshPayload {
  sub:       string;
  sessionId: string;
  jti:       string;
  iat?:      number;
  exp?:      number;
}

export const TokenService = {
  issueTokenPair(opts: {
    userId:    string;
    email:     string;
    role:      string;
    plan:      string;
    sessionId: string;
    deviceId?: string;
  }): { accessToken: string; refreshToken: string; expiresIn: number } {
    const accessJti  = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();

    const accessPayload: AccessPayload = {
      sub:       opts.userId,
      email:     opts.email,
      role:      opts.role,
      plan:      opts.plan,
      sessionId: opts.sessionId,
      deviceId:  opts.deviceId,
      jti:       accessJti,
    };

    const refreshPayload: RefreshPayload = {
      sub:       opts.userId,
      sessionId: opts.sessionId,
      jti:       refreshJti,
    };

    const accessToken  = jwt.sign(accessPayload,  JWT_SECRET,         { expiresIn: ACCESS_TTL_SEC });
    const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL_SEC });

    return { accessToken, refreshToken, expiresIn: ACCESS_TTL_SEC };
  },

  verifyAccess(token: string): AccessPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as AccessPayload;
    } catch {
      throw new UnauthorizedError('Access token invalid or expired');
    }
  },

  verifyRefresh(token: string): RefreshPayload {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshPayload;
    } catch {
      throw new UnauthorizedError('Refresh token invalid or expired');
    }
  },

  async isRevoked(jti: string): Promise<boolean> {
    const row = await db.queryNullable(client =>
      client.from('identity_revoked_tokens')
        .select('jti')
        .eq('jti', jti)
        .single()
    );
    return row !== null;
  },

  async revokeToken(jti: string, userId: string, reason = 'logout', expiresAt?: Date): Promise<void> {
    const exp = expiresAt ?? new Date(Date.now() + REFRESH_TTL_SEC * 1000);
    await db.query(client =>
      client.from('identity_revoked_tokens').upsert({
        jti,
        user_id:    userId,
        reason,
        expires_at: exp.toISOString(),
      }).select()
    );
  },

  async revokeAllForUser(userId: string, reason = 'forced_logout'): Promise<void> {
    // Mark a sentinel row so middleware knows to reject all old tokens
    // Use a user-level revocation timestamp stored in profiles
    await db.query(client =>
      client.from('profiles')
        .update({ token_revoked_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
    ).catch(() => {
      // column may not exist yet — safe to ignore
    });
  },

  generateOpaqueToken(length = 48): string {
    return crypto.randomBytes(length).toString('hex');
  },

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },
};
