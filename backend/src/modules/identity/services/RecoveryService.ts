import { db } from '../../../core/database/SupabaseClient.js';
import { TokenService } from './TokenService.js';
import { AppError, NotFoundError } from '../../../core/errors/AppError.js';
import { RecoveryType } from '../types/identity.types.js';
import bcrypt from 'bcryptjs';

const RECOVERY_TTL_MS   = 60 * 60_000;     // 1 hour
const MAGIC_LINK_TTL_MS = 15 * 60_000;     // 15 minutes

async function createRecoveryRecord(userId: string, type: RecoveryType, metadata: Record<string, unknown> = {}): Promise<string> {
  const plain     = TokenService.generateOpaqueToken();
  const tokenHash = TokenService.hashToken(plain);
  const expiresAt = new Date(Date.now() + (type === RecoveryType.MagicLink ? MAGIC_LINK_TTL_MS : RECOVERY_TTL_MS));

  await db.query(client =>
    client.from('identity_recovery').insert({
      user_id:       userId,
      token_hash:    tokenHash,
      recovery_type: type,
      metadata,
      expires_at:    expiresAt.toISOString(),
    }).select()
  );

  return plain; // caller sends this to the user via email/SMS
}

async function consumeRecoveryToken(plain: string, expectedType: RecoveryType): Promise<{ userId: string; metadata: Record<string, unknown> }> {
  const tokenHash = TokenService.hashToken(plain);
  const row = await db.queryNullable(client =>
    client.from('identity_recovery')
      .select()
      .eq('token_hash', tokenHash)
      .eq('recovery_type', expectedType)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single<Record<string, unknown>>()
  );

  if (!row) throw new AppError('Recovery token invalid or expired', 400, 'INVALID_RECOVERY_TOKEN');

  await db.query(client =>
    client.from('identity_recovery')
      .update({ used_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
      .select()
  );

  return { userId: row['user_id'] as string, metadata: (row['metadata'] as Record<string, unknown>) ?? {} };
}

export const RecoveryService = {
  // ——— Password Reset ——————————————————————————————————————————————————————
  async initiatePasswordReset(email: string): Promise<string | null> {
    const user = await db.queryNullable(client =>
      client.from('profiles').select('id').eq('email', email.toLowerCase()).single<{ id: string }>()
    );
    if (!user) return null; // always return null — email enumeration prevention

    const token = await createRecoveryRecord(user.id, RecoveryType.PasswordReset);
    // Caller is responsible for sending email
    return token;
  },

  async completePasswordReset(token: string, newPassword: string): Promise<void> {
    const { userId } = await consumeRecoveryToken(token, RecoveryType.PasswordReset);

    if (newPassword.length < 8) throw new AppError('Password must be at least 8 characters', 400, 'WEAK_PASSWORD');

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query(client =>
      client.from('profiles')
        .update({ password_hash: hash })
        .eq('id', userId)
        .select()
    );
  },

  // ——— Magic Link ——————————————————————————————————————————————————————————
  async createMagicLink(email: string): Promise<string | null> {
    const user = await db.queryNullable(client =>
      client.from('profiles').select('id').eq('email', email.toLowerCase()).single<{ id: string }>()
    );
    if (!user) return null;

    return createRecoveryRecord(user.id, RecoveryType.MagicLink, { email });
  },

  async consumeMagicLink(token: string): Promise<string> {
    const { userId } = await consumeRecoveryToken(token, RecoveryType.MagicLink);
    return userId;
  },

  // ——— Email Verification ——————————————————————————————————————————————————
  async createEmailVerification(userId: string, email: string): Promise<string> {
    return createRecoveryRecord(userId, RecoveryType.EmailVerify, { email });
  },

  async consumeEmailVerification(token: string): Promise<string> {
    const { userId } = await consumeRecoveryToken(token, RecoveryType.EmailVerify);
    await db.query(client =>
      client.from('profiles')
        .update({ email_verified: true })
        .eq('id', userId)
        .select()
    );
    return userId;
  },

  // ——— OTP (phone verification) ————————————————————————————————————————————
  generateOTP(): string {
    return String(Math.floor(100_000 + Math.random() * 900_000));
  },

  async createPhoneOTP(userId: string, phone: string): Promise<string> {
    const otp = this.generateOTP();
    await createRecoveryRecord(userId, RecoveryType.PhoneVerify, { phone, otp_hash: TokenService.hashToken(otp) });
    return otp; // caller sends via SMS
  },

  async verifyPhoneOTP(userId: string, otp: string): Promise<boolean> {
    const otpHash = TokenService.hashToken(otp);
    const rows = await db.query(client =>
      client.from('identity_recovery')
        .select()
        .eq('user_id', userId)
        .eq('recovery_type', RecoveryType.PhoneVerify)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
    ) as Array<Record<string, unknown>>;

    for (const row of rows) {
      const meta = (row['metadata'] as Record<string, unknown>) ?? {};
      if (meta['otp_hash'] === otpHash) {
        await db.query(client =>
          client.from('identity_recovery')
            .update({ used_at: new Date().toISOString() })
            .eq('id', row['id'] as string)
            .select()
        );
        return true;
      }
    }
    return false;
  },
};
