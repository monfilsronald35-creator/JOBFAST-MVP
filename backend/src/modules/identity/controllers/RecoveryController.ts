import type { Request, Response } from 'express';
import { RecoveryService } from '../services/RecoveryService.js';

export const RecoveryController = {
  // POST /identity/forgot-password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ error: 'email is required' }); return; }

    // Always respond with 200 regardless — prevents email enumeration
    await RecoveryService.initiatePasswordReset(email);
    // In production: send email with token here (via notification service)

    res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
  },

  // POST /identity/reset-password
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!token || !newPassword) {
      res.status(400).json({ error: 'token and newPassword are required' });
      return;
    }

    await RecoveryService.completePasswordReset(token, newPassword);
    res.json({ message: 'Password reset successfully — please log in again.' });
  },

  // POST /identity/magic-link
  async requestMagicLink(req: Request, res: Response): Promise<void> {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ error: 'email is required' }); return; }

    await RecoveryService.createMagicLink(email);
    // In production: send email with magic link
    res.json({ message: 'Magic link sent (if account exists).' });
  },

  // POST /identity/magic-link/verify
  async verifyMagicLink(req: Request, res: Response): Promise<void> {
    const { token } = req.body as { token?: string };
    if (!token) { res.status(400).json({ error: 'token is required' }); return; }

    const userId = await RecoveryService.consumeMagicLink(token);
    res.json({ message: 'Magic link verified', userId });
  },

  // POST /identity/verify-email
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.body as { token?: string };
    if (!token) { res.status(400).json({ error: 'token is required' }); return; }

    const userId = await RecoveryService.consumeEmailVerification(token);
    res.json({ message: 'Email verified successfully', userId });
  },

  // POST /identity/phone/send-otp
  async sendPhoneOTP(req: Request, res: Response): Promise<void> {
    const user = (req as unknown as { user?: { userId: string } }).user;
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { phone } = req.body as { phone?: string };
    if (!phone) { res.status(400).json({ error: 'phone is required' }); return; }

    const otp = await RecoveryService.createPhoneOTP(user.userId, phone);
    // In production: send via SMS gateway (Digicel Haiti, Natcom, Twilio)
    const isProd = process.env['NODE_ENV'] === 'production';
    res.json({ message: 'OTP sent', ...(isProd ? {} : { otp }) });
  },

  // POST /identity/phone/verify-otp
  async verifyPhoneOTP(req: Request, res: Response): Promise<void> {
    const user = (req as unknown as { user?: { userId: string } }).user;
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { otp } = req.body as { otp?: string };
    if (!otp) { res.status(400).json({ error: 'otp is required' }); return; }

    const verified = await RecoveryService.verifyPhoneOTP(user.userId, otp);
    if (!verified) { res.status(400).json({ error: 'Invalid or expired OTP', code: 'INVALID_OTP' }); return; }

    res.json({ message: 'Phone verified successfully', phoneVerified: true });
  },
};
