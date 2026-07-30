import type { Request, Response } from 'express';
import { IdentityService } from '../services/IdentityService.js';
import { SessionService } from '../services/SessionService.js';
import { RecoveryService } from '../services/RecoveryService.js';
import { TokenService } from '../services/TokenService.js';
import { AuthMethod, IdentityType } from '../types/identity.types.js';
import { AppError } from '../../../core/errors/AppError.js';

function clientIp(req: Request): string {
  return ((req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()) ?? (req.socket.remoteAddress ?? '');
}

export const IdentityController = {
  // POST /identity/register
  async register(req: Request, res: Response): Promise<void> {
    const { email, password, fullName, identityType, phone } = req.body as Record<string, string>;
    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'email, password, fullName are required', code: 'MISSING_FIELDS' });
      return;
    }

    const validType = Object.values(IdentityType).includes(identityType as IdentityType)
      ? (identityType as IdentityType)
      : IdentityType.Customer;

    const result = await IdentityService.register({ email, password, fullName, identityType: validType, phone });

    res.status(201).json({
      message:             'Registration successful — verify your email to continue',
      userId:              result.userId,
      verificationPending: true,
    });
  },

  // POST /identity/login
  async login(req: Request, res: Response): Promise<void> {
    const { email, password, deviceId, appVersion } = req.body as Record<string, string>;
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required', code: 'MISSING_FIELDS' });
      return;
    }

    const result = await IdentityService.login({
      email, password, deviceId,
      ip:         clientIp(req),
      userAgent:  req.headers['user-agent'],
      appVersion,
    });

    res.json({
      tokens:      result.tokens,
      session:     { id: result.session.id, expiresAt: result.session.expiresAt, riskScore: result.session.riskScore },
      user:        result.user,
      mfaRequired: result.mfaRequired,
      riskAction:  result.riskAction,
    });
  },

  // POST /identity/refresh
  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required', code: 'MISSING_FIELDS' });
      return;
    }

    const result = await SessionService.refresh(refreshToken);
    res.json({ tokens: { accessToken: result.accessToken, refreshToken: result.refreshToken, expiresIn: result.expiresIn, tokenType: 'Bearer' } });
  },

  // POST /identity/logout
  async logout(req: Request, res: Response): Promise<void> {
    const user = (req as unknown as { user?: { userId: string; sessionId: string; jti: string } }).user;
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    await IdentityService.logout(user.sessionId, user.userId, user.jti);
    res.json({ message: 'Logged out successfully' });
  },

  // POST /identity/logout-all
  async logoutAll(req: Request, res: Response): Promise<void> {
    const user = (req as unknown as { user?: { userId: string } }).user;
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    await IdentityService.logoutAll(user.userId);
    res.json({ message: 'All sessions revoked' });
  },

  // POST /identity/oauth/:provider
  async oauthCallback(req: Request, res: Response): Promise<void> {
    const provider = req.params['provider'] as AuthMethod;
    const { code, redirectUri } = req.body as { code?: string; redirectUri?: string };
    if (!code || !redirectUri) {
      res.status(400).json({ error: 'code and redirectUri are required', code: 'MISSING_FIELDS' });
      return;
    }

    const result = await IdentityService.loginOAuth(provider, code, redirectUri, clientIp(req), req.headers['user-agent']);
    res.json({ tokens: result.tokens, user: result.user, mfaRequired: result.mfaRequired });
  },

  // GET /identity/me
  async me(req: Request, res: Response): Promise<void> {
    const user = (req as unknown as { user?: { userId: string; email: string; role: string; plan: string } }).user;
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    res.json({ userId: user.userId, email: user.email, role: user.role, plan: user.plan });
  },
};
