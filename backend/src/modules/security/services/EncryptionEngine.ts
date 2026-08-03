import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

const ALG = 'aes-256-gcm';

function getKey(): Buffer {
  const raw = process.env['ENCRYPTION_KEY'] ?? '';
  if (raw.length < 32) {
    // MVP: derive a deterministic key from JWT_SECRET so the app doesn't crash
    const fallback = process.env['JWT_SECRET'] ?? 'jobfast-insecure-dev-key-change-in-prod';
    return Buffer.from(fallback.padEnd(32, '0').slice(0, 32));
  }
  return Buffer.from(raw.slice(0, 32));
}

export const EncryptionEngine = {
  encrypt(plaintext: string): { ciphertext: string; iv: string; tag: string } {
    const iv     = randomBytes(12);
    const cipher = createCipheriv(ALG, getKey(), iv);
    const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag    = cipher.getAuthTag();
    return {
      ciphertext: enc.toString('base64'),
      iv:         iv.toString('base64'),
      tag:        tag.toString('base64'),
    };
  },

  decrypt(ciphertext: string, iv: string, tag: string): string {
    const decipher = createDecipheriv(ALG, getKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    const dec = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]);
    return dec.toString('utf8');
  },

  // HMAC-SHA256 for indexable fields (email, phone) — deterministic, not reversible
  hashField(value: string): string {
    const secret = process.env['FIELD_HASH_SECRET'] ?? process.env['JWT_SECRET'] ?? 'jobfast-field-hash';
    return createHmac('sha256', secret).update(value.toLowerCase().trim()).digest('hex');
  },

  // Mask sensitive value for display (last 4 chars visible)
  mask(value: string): string {
    if (value.length <= 4) return '****';
    return '****' + value.slice(-4);
  },
};