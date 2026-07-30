import crypto from 'crypto';
import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import type { MFARecord } from '../types/identity.types.js';

const BACKUP_CODE_COUNT = 10;
const TOTP_WINDOW       = 1; // ±1 time step (30s each)

// ——— Base32 decode (RFC 4648) — no external deps ————————————————————————————
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/[=\s]/g, '');
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}

function base32Encode(buf: Buffer): string {
  let result = '';
  let bits = 0, value = 0;
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { result += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f]; bits -= 5; }
  }
  if (bits > 0) result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  return result;
}

// ——— RFC 6238 TOTP ——————————————————————————————————————————————————————————
function computeTOTP(secret: Buffer, timeStep: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(timeStep));
  const hmac   = crypto.createHmac('sha1', secret).update(buf).digest();
  const offset = (hmac[hmac.length - 1]! & 0xf);
  const code   = ((hmac[offset]!     & 0x7f) << 24)
               | ((hmac[offset + 1]! & 0xff) << 16)
               | ((hmac[offset + 2]! & 0xff) <<  8)
               |  (hmac[offset + 3]! & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

function generateTOTP(secret: string, windowOffset = 0): string {
  const step = Math.floor(Date.now() / 1000 / 30) + windowOffset;
  return computeTOTP(base32Decode(secret), step);
}

function verifyTOTP(secret: string, code: string): boolean {
  for (let w = -TOTP_WINDOW; w <= TOTP_WINDOW; w++) {
    if (generateTOTP(secret, w) === code) return true;
  }
  return false;
}

function toMFARecord(row: Record<string, unknown>): MFARecord {
  return {
    id:            row['id'] as string,
    userId:        row['user_id'] as string,
    totpSecret:    row['totp_secret'] as string | undefined,
    totpEnabled:   row['totp_enabled'] as boolean,
    backupCodes:   (row['backup_codes'] as string[]) ?? [],
    phoneNumber:   row['phone_number'] as string | undefined,
    phoneVerified: row['phone_verified'] as boolean,
  };
}

export const MFAService = {
  // ——— TOTP setup —————————————————————————————————————————————————————————
  generateTOTPSecret(): string {
    const secret = crypto.randomBytes(20);
    return base32Encode(secret);
  },

  buildTOTPUri(secret: string, email: string): string {
    const label  = encodeURIComponent(`JOBFAST:${email}`);
    const issuer = encodeURIComponent('JOBFAST');
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  },

  verifyTOTPCode(secret: string, code: string): boolean {
    return verifyTOTP(secret, code.replace(/\s/g, ''));
  },

  // ——— Backup codes ———————————————————————————————————————————————————————
  generateBackupCodes(): { plain: string[]; hashed: string[] } {
    const plain   = Array.from({ length: BACKUP_CODE_COUNT }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    const hashed = plain.map(c => crypto.createHash('sha256').update(c).digest('hex'));
    return { plain, hashed };
  },

  // ——— DB operations ——————————————————————————————————————————————————————
  async getOrCreate(userId: string): Promise<MFARecord> {
    const existing = await db.queryNullable(client =>
      client.from('identity_mfa').select().eq('user_id', userId).single<Record<string, unknown>>()
    );
    if (existing) return toMFARecord(existing);

    const created = await db.query(client =>
      client.from('identity_mfa').insert({ user_id: userId }).select().single<Record<string, unknown>>()
    );
    return toMFARecord(created);
  },

  async enableTOTP(userId: string, secret: string): Promise<MFARecord> {
    const row = await db.query(client =>
      client.from('identity_mfa')
        .upsert({ user_id: userId, totp_secret: secret, totp_enabled: true, totp_verified: true }, { onConflict: 'user_id' })
        .select().single<Record<string, unknown>>()
    );
    return toMFARecord(row);
  },

  async disableTOTP(userId: string): Promise<void> {
    await db.query(client =>
      client.from('identity_mfa')
        .update({ totp_enabled: false, totp_secret: null, totp_verified: false })
        .eq('user_id', userId).select()
    );
  },

  async saveBackupCodes(userId: string, hashedCodes: string[]): Promise<void> {
    await db.query(client =>
      client.from('identity_mfa')
        .upsert({ user_id: userId, backup_codes: hashedCodes }, { onConflict: 'user_id' })
        .select()
    );
  },

  async consumeBackupCode(userId: string, code: string): Promise<boolean> {
    const mfa = await db.queryNullable(client =>
      client.from('identity_mfa').select().eq('user_id', userId).single<Record<string, unknown>>()
    );
    if (!mfa) return false;

    const codes  = (mfa['backup_codes'] as string[]) ?? [];
    const hashed = crypto.createHash('sha256').update(code.toUpperCase().replace(/\s/g, '')).digest('hex');
    const idx    = codes.indexOf(hashed);
    if (idx < 0) return false;

    const remaining = [...codes.slice(0, idx), ...codes.slice(idx + 1)];
    await db.query(client =>
      client.from('identity_mfa').update({ backup_codes: remaining }).eq('user_id', userId).select()
    );
    return true;
  },

  async verify(userId: string, code: string, method: 'totp' | 'backup'): Promise<boolean> {
    const mfa = await db.queryNullable(client =>
      client.from('identity_mfa').select().eq('user_id', userId).single<Record<string, unknown>>()
    );
    if (!mfa) return false;

    if (method === 'totp') {
      const secret = mfa['totp_secret'] as string | null;
      if (!secret || !mfa['totp_enabled']) return false;
      return verifyTOTP(secret, code.replace(/\s/g, ''));
    }

    return this.consumeBackupCode(userId, code);
  },
};
