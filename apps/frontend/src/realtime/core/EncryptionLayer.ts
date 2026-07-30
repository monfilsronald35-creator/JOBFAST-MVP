/**
 * AES-GCM 256-bit end-to-end encryption layer.
 * Uses the Web Crypto API (browser native, no dependencies).
 * Wire format: base64url(iv[12]) + "." + base64url(ciphertext)
 */

const ALGORITHM = 'AES-GCM';
const KEY_BITS  = 256;
const IV_BYTES  = 12;
const HEADER    = 'enc:';

export class EncryptionLayer {
  #key: CryptoKey | null = null;
  #enabled = false;

  get isEnabled(): boolean { return this.#enabled && this.#key !== null; }

  async init(rawKey?: string): Promise<void> {
    if (!('crypto' in window) || !window.crypto.subtle) return;

    if (rawKey) {
      const keyBytes = this.#b64ToBytes(rawKey);
      this.#key = await crypto.subtle.importKey(
        'raw', keyBytes,
        { name: ALGORITHM, length: KEY_BITS },
        false,
        ['encrypt', 'decrypt'],
      );
    } else {
      this.#key = await crypto.subtle.generateKey(
        { name: ALGORITHM, length: KEY_BITS },
        true,
        ['encrypt', 'decrypt'],
      );
    }

    this.#enabled = true;
  }

  async exportKey(): Promise<string | null> {
    if (!this.#key) return null;
    const raw = await crypto.subtle.exportKey('raw', this.#key);
    return this.#bytesToB64(new Uint8Array(raw));
  }

  async encrypt(plaintext: string): Promise<string> {
    if (!this.isEnabled || !this.#key) return plaintext;

    const iv    = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const data  = new TextEncoder().encode(plaintext);
    const cipher = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      this.#key,
      data,
    );

    return HEADER + this.#bytesToB64(iv) + '.' + this.#bytesToB64(new Uint8Array(cipher));
  }

  async decrypt(ciphertext: string): Promise<string> {
    if (!this.isEnabled || !this.#key) return ciphertext;
    if (!ciphertext.startsWith(HEADER))  return ciphertext;

    const parts = ciphertext.slice(HEADER.length).split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return ciphertext;

    const iv      = this.#b64ToBytes(parts[0]);
    const data    = this.#b64ToBytes(parts[1]);

    try {
      const plain = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        this.#key,
        data,
      );
      return new TextDecoder().decode(plain);
    } catch {
      return ciphertext;
    }
  }

  isEncrypted(value: string): boolean {
    return typeof value === 'string' && value.startsWith(HEADER);
  }

  #bytesToB64(bytes: Uint8Array): string {
    let s = '';
    bytes.forEach(b => { s += String.fromCharCode(b); });
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  #b64ToBytes(b64: string): Uint8Array {
    const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded.padEnd(padded.length + (4 - padded.length % 4) % 4, '='));
    return Uint8Array.from(binary, c => c.charCodeAt(0));
  }
}