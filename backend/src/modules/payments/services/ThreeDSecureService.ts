import { PaymentRepository } from '../repositories/PaymentRepository.js';
import { AppError }          from '../../../core/errors/AppError.js';

type ChallengeType = 'OTP' | 'FaceID' | 'Fingerprint' | 'PIN';

interface ThreeDSSession {
  sessionId:   string;
  intentId:    string;
  userId:      string;
  challenge:   ChallengeType;
  codeHash:    string;
  expiresAt:   number;
  status:      'pending' | 'completed' | 'failed' | 'expired';
}

// In-memory store (production: use Redis with TTL)
const sessions = new Map<string, ThreeDSSession>();

function hashCode(code: string): string {
  let h = 0;
  for (let i = 0; i < code.length; i++) { h = ((h << 5) - h + code.charCodeAt(i)) | 0; }
  return h.toString(16);
}

export const ThreeDSecureService = {
  async initiate(intentId: string, userId: string, challenge: ChallengeType = 'OTP'): Promise<{ sessionId: string; challenge: ChallengeType; expiresIn: number }> {
    const sessionId = `3ds_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const otp       = Math.floor(100_000 + Math.random() * 900_000).toString();
    const ttl       = 5 * 60 * 1_000;

    sessions.set(sessionId, {
      sessionId, intentId, userId, challenge,
      codeHash: hashCode(otp),
      expiresAt: Date.now() + ttl,
      status: 'pending',
    });

    // Log 3DS initiation
    await PaymentRepository.saveWebhook(
      'internal', '3ds.initiated', { sessionId, intentId, userId, challenge }
    );

    // In production: send OTP via SMS/email
    // For now: log for dev inspection
    console.log(`[3DS] OTP for session ${sessionId}: ${otp}`);

    return { sessionId, challenge, expiresIn: ttl / 1000 };
  },

  async verify(sessionId: string, code: string, userId: string): Promise<boolean> {
    const session = sessions.get(sessionId);
    if (!session)                      throw new AppError('3DS session not found', 404, '3DS_NOT_FOUND');
    if (session.userId !== userId)     throw new AppError('Session user mismatch', 403, 'FORBIDDEN');
    if (session.status !== 'pending')  throw new AppError('Session already used or expired', 400, '3DS_INVALID_STATE');
    if (Date.now() > session.expiresAt) {
      session.status = 'expired';
      throw new AppError('3DS session expired', 400, '3DS_EXPIRED');
    }

    const valid = hashCode(code) === session.codeHash;
    session.status = valid ? 'completed' : 'failed';

    if (!valid) throw new AppError('Invalid 3DS code', 400, '3DS_INVALID_CODE');

    await PaymentRepository.markWebhookProcessed(sessionId);
    return true;
  },

  async getStatus(sessionId: string): Promise<'pending' | 'completed' | 'failed' | 'expired'> {
    const session = sessions.get(sessionId);
    if (!session) throw new AppError('3DS session not found', 404, '3DS_NOT_FOUND');
    if (session.status === 'pending' && Date.now() > session.expiresAt) {
      session.status = 'expired';
    }
    return session.status;
  },
};
