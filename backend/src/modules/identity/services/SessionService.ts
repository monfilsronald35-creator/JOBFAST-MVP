import { SessionRepository } from '../repositories/SessionRepository.js';
import { DeviceRepository } from '../repositories/DeviceRepository.js';
import { TokenService, type AccessPayload } from './TokenService.js';
import { RiskEngine } from './RiskEngine.js';
import { AppError, UnauthorizedError } from '../../../core/errors/AppError.js';
import { AuthMethod, type SessionRecord, type TokenPair } from '../types/identity.types.js';

const ACCESS_TTL_MS  = 15 * 60_000;
const REFRESH_TTL_MS = 30 * 24 * 3600_000;

interface CreateSessionOpts {
  userId:       string;
  email:        string;
  role:         string;
  plan:         string;
  deviceId?:    string;
  ip?:          string;
  countryCode?: string;
  city?:        string;
  browser?:     string;
  os?:          string;
  appVersion?:  string;
  loginMethod:  AuthMethod;
  isNewDevice:  boolean;
  userAgent?:   string;
}

export const SessionService = {
  async create(opts: CreateSessionOpts): Promise<{ session: SessionRecord; tokens: TokenPair }> {
    // Risk assessment
    const risk = await RiskEngine.assess({
      userId:      opts.userId,
      ip:          opts.ip,
      countryCode: opts.countryCode,
      deviceId:    opts.deviceId,
      isNewDevice: opts.isNewDevice,
      userAgent:   opts.userAgent,
    });

    if (risk.action === 'block') {
      await RiskEngine.recordAudit(opts.userId, 'login_blocked', { risk }, opts.ip, risk.score);
      throw new AppError('Login blocked due to security risk — contact support', 403, 'LOGIN_BLOCKED');
    }

    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    const session = await SessionRepository.create({
      userId:       opts.userId,
      deviceId:     opts.deviceId,
      sessionToken: TokenService.generateOpaqueToken(),
      ipAddress:    opts.ip,
      countryCode:  opts.countryCode,
      city:         opts.city,
      browser:      opts.browser,
      os:           opts.os,
      appVersion:   opts.appVersion,
      loginMethod:  opts.loginMethod,
      riskScore:    risk.score,
      riskFlags:    risk.flags,
      mfaVerified:  false,
      expiresAt,
    });

    const tokens = TokenService.issueTokenPair({
      userId:    opts.userId,
      email:     opts.email,
      role:      opts.role,
      plan:      opts.plan,
      sessionId: session.id,
      deviceId:  opts.deviceId,
    });

    return { session, tokens: { ...tokens, tokenType: 'Bearer' } };
  },

  async refresh(refreshToken: string): Promise<TokenPair & { session: SessionRecord }> {
    const payload = TokenService.verifyRefresh(refreshToken);

    const isRevoked = await TokenService.isRevoked(payload.jti);
    if (isRevoked) throw new UnauthorizedError('Token has been revoked');

    const session = await SessionRepository.findByToken(payload.sessionId).catch(() => null)
      ?? await SessionRepository.findByUserId(payload.sub).then(s => s.find(x => x.id === payload.sessionId) ?? null);

    if (!session || !session.isActive) {
      throw new UnauthorizedError('Session expired or revoked');
    }

    // Revoke old refresh token (rotation)
    await TokenService.revokeToken(payload.jti, payload.sub, 'rotation');
    await SessionRepository.updateLastActive(session.id);

    const newTokens = TokenService.issueTokenPair({
      userId:    payload.sub,
      email:     '',         // will be filled from session context in controller
      role:      '',
      plan:      'user',
      sessionId: session.id,
      deviceId:  session.deviceId,
    });

    return { ...newTokens, tokenType: 'Bearer', session };
  },

  async revoke(sessionId: string, userId: string, jti?: string): Promise<void> {
    await SessionRepository.revoke(sessionId);
    if (jti) await TokenService.revokeToken(jti, userId, 'logout');
  },

  async revokeAll(userId: string): Promise<void> {
    await SessionRepository.revokeAll(userId);
    await TokenService.revokeAllForUser(userId, 'forced_logout');
  },

  async revokeAllExcept(userId: string, currentSessionId: string): Promise<void> {
    await SessionRepository.revokeAllExcept(userId, currentSessionId);
  },

  async list(userId: string): Promise<SessionRecord[]> {
    return SessionRepository.findByUserId(userId);
  },

  async markMFAVerified(sessionId: string): Promise<void> {
    await SessionRepository.setMFAVerified(sessionId);
  },
};
