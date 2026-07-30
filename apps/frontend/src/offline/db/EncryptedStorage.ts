/**
 * Encrypted key-value storage — AES-GCM-256 via Web Crypto API.
 * Backs both localStorage (small values) and IndexedDB (large blobs).
 * Key derivation: PBKDF2 from device ID + app salt (no password required).
 */

const SALT_KEY    = 'jf_enc_salt';
const APP_SALT    = 'JOBFAST_GLOBAL_OFFLINE_v1';
const ITERATIONS  = 100_000;
const ALGORITHM   = 'AES-GCM';
const KEY_BITS    = 256;
const IV_BYTES    = 12;
const LS_PREFIX   = 'jfe:'; // Encrypted localStorage prefix

let _key: CryptoKey | null = null;

// ─── Key derivation ───────────────────────────────────────────────────────────

async function getOrCreateSalt(): Promise<Uint8Array> {
  const stored = localStorage.getItem(SALT_KEY);
  if (stored) {
    return Uint8Array.from(atob(stored), c => c.charCodeAt(0));
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...salt)));
  return salt;
}

export async function deriveKey(userSecret?: string): Promise<CryptoKey> {
  if (_key) return _key;
  if (!('subtle' in crypto)) throw new Error('Web Crypto not available');

  const deviceId = localStorage.getItem('jf_device_id') ?? 'unknown';
  const material = `${APP_SALT}:${deviceId}:${userSecret ?? ''}`;
  const salt     = await getOrCreateSalt();

  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(material),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  _key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: ALGORITHM, length: KEY_BITS },
    false,
    ['encrypt', 'decrypt'],
  );

  return _key;
}

export function clearDerivedKey(): void { _key = null; }

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────

export async function encrypt(plaintext: string): Promise<string> {
  const key  = await deriveKey();
  const iv   = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const data = new TextEncoder().encode(plaintext);

  const cipher = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, data);

  const iv64     = btoa(String.fromCharCode(...iv));
  const cipher64 = btoa(String.fromCharCode(...new Uint8Array(cipher)));
  return `${iv64}.${cipher64}`;
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key   = await deriveKey();
  const parts = ciphertext.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error('Invalid ciphertext');

  const iv   = Uint8Array.from(atob(parts[0]),  c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));

  const plain = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data);
  return new TextDecoder().decode(plain);
}

// ─── Encrypted localStorage ────────────────────────────────────────────────────

export async function setSecure(key: string, value: unknown): Promise<void> {
  const json      = JSON.stringify(value);
  const encrypted = await encrypt(json);
  localStorage.setItem(LS_PREFIX + key, encrypted);
}

export async function getSecure<T = unknown>(key: string): Promise<T | null> {
  const encrypted = localStorage.getItem(LS_PREFIX + key);
  if (!encrypted) return null;
  try {
    const json = await decrypt(encrypted);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function removeSecure(key: string): void {
  localStorage.removeItem(LS_PREFIX + key);
}

// ─── Secure token store ────────────────────────────────────────────────────────

export const SecureTokenStore = {
  async saveToken(token: string): Promise<void> {
    await setSecure('auth_token', token);
  },

  async getToken(): Promise<string | null> {
    return getSecure<string>('auth_token');
  },

  removeToken(): void {
    removeSecure('auth_token');
  },

  async saveRefreshToken(token: string): Promise<void> {
    await setSecure('refresh_token', token);
  },

  async getRefreshToken(): Promise<string | null> {
    return getSecure<string>('refresh_token');
  },

  removeRefreshToken(): void {
    removeSecure('refresh_token');
  },

  async saveUserCredentials(data: {
    userId:   string;
    email?:   string;
    token:    string;
    expiresAt: number;
  }): Promise<void> {
    await setSecure('user_credentials', data);
  },

  async getUserCredentials(): Promise<{
    userId: string; email?: string; token: string; expiresAt: number;
  } | null> {
    return getSecure('user_credentials');
  },

  clearAll(): void {
    ['auth_token', 'refresh_token', 'user_credentials'].forEach(removeSecure);
  },
};

// ─── Encrypted IndexedDB blob store ───────────────────────────────────────────

const BLOB_DB_NAME = 'jf_encrypted_blobs';
const BLOB_VERSION = 1;
let _blobDb: Promise<IDBDatabase> | null = null;

function openBlobDB(): Promise<IDBDatabase> {
  if (_blobDb) return _blobDb;
  _blobDb = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(BLOB_DB_NAME, BLOB_VERSION);
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('blobs')) {
        db.createObjectStore('blobs', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => { _blobDb = null; reject(req.error); };
  });
  return _blobDb;
}

export async function setEncryptedBlob(key: string, data: unknown): Promise<void> {
  const encrypted = await encrypt(JSON.stringify(data));
  const db = await openBlobDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('blobs', 'readwrite');
    const req = tx.objectStore('blobs').put({ key, data: encrypted, at: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function getEncryptedBlob<T = unknown>(key: string): Promise<T | null> {
  const db = await openBlobDB();
  return new Promise<T | null>((resolve, reject) => {
    const tx  = db.transaction('blobs', 'readonly');
    const req = tx.objectStore('blobs').get(key) as IDBRequest<{ key: string; data: string; at: number } | undefined>;
    req.onsuccess = () => {
      if (!req.result) { resolve(null); return; }
      decrypt(req.result.data)
        .then(json => resolve(JSON.parse(json) as T))
        .catch(() => resolve(null));
    };
    req.onerror = () => reject(req.error);
  });
}