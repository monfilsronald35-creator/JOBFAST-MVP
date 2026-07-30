import type { Request, Response } from 'express';
import { MFAService } from '../services/MFAService.js';
import { SessionService } from '../services/SessionService.js';
import { AppError } from '../../../core/errors/AppError.js';

type AuthReq = Request & { user?: { userId: string; email: string; sessionId: string } };

export const MFAController = {
  // GET /identity/mfa — fetch MFA status
  async status(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthReq).user!;
    const mfa = await MFAService.getOrCreate(userId);
    res.json({
      totpEnabled:   mfa.totpEnabled,
      phoneVerified: mfa.phoneVerified,
      backupCodesCount: mfa.backupCodes.length,
    });
  },

  // POST /identity/mfa/totp/setup — begin TOTP enrollment
  async setupTOTP(req: Request, res: Response): Promise<void> {
    const { userId, email } = (req as AuthReq).user!;

    const secret = MFAService.generateTOTPSecret();
    const uri    = MFAService.buildTOTPUri(secret, email);

    // Store pending secret (not yet activated — user must verify it first)
    await MFAService.enableTOTP(userId, secret);

    res.json({
      secret,
      uri,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(uri)}&size=200x200`,
      instructions: 'Scan this QR code with your authenticator app, then call /mfa/totp/verify to activate.',
    });
  },

  // POST /identity/mfa/totp/verify — activate TOTP after setup
  async verifyTOTP(req: Request, res: Response): Promise<void> {
    const { userId, sessionId } = (req as AuthReq).user!;
    const { code } = req.body as { code?: string };
    if (!code) { res.status(400).json({ error: 'code is required' }); return; }

    const ok = await MFAService.verify(userId, code, 'totp');
    if (!ok) { res.status(400).json({ error: 'Invalid TOTP code', code: 'INVALID_MFA_CODE' }); return; }

    await SessionService.markMFAVerified(sessionId);

    // Generate backup codes on first successful verify
    const { plain, hashed } = MFAService.generateBackupCodes();
    await MFAService.saveBackupCodes(userId, hashed);

    res.json({
      message:     'TOTP activated',
      mfaVerified: true,
      backupCodes: plain,
    });
  },

  // POST /identity/mfa/verify — verify MFA during login
  async verifyMFA(req: Request, res: Response): Promise<void> {
    const { userId, sessionId } = (req as AuthReq).user!;
    const { code, method } = req.body as { code?: string; method?: 'totp' | 'backup' };
    if (!code) { res.status(400).json({ error: 'code is required' }); return; }

    const m = method === 'backup' ? 'backup' : 'totp';
    const ok = await MFAService.verify(userId, code, m);
    if (!ok) { res.status(400).json({ error: 'Invalid MFA code', code: 'INVALID_MFA_CODE' }); return; }

    await SessionService.markMFAVerified(sessionId);
    res.json({ mfaVerified: true });
  },

  // DELETE /identity/mfa/totp — disable TOTP
  async disableTOTP(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthReq).user!;
    const { code } = req.body as { code?: string };
    if (!code) { res.status(400).json({ error: 'Current TOTP code required to disable' }); return; }

    const ok = await MFAService.verify(userId, code, 'totp');
    if (!ok) { res.status(400).json({ error: 'Invalid TOTP code' }); return; }

    await MFAService.disableTOTP(userId);
    res.json({ message: 'TOTP disabled' });
  },

  // POST /identity/mfa/backup-codes — regenerate backup codes
  async regenerateBackupCodes(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthReq).user!;
    const { plain, hashed } = MFAService.generateBackupCodes();
    await MFAService.saveBackupCodes(userId, hashed);
    res.json({ backupCodes: plain });
  },
};
