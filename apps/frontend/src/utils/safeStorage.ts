// Safari Private Mode and ITP can throw QuotaExceededError on localStorage.setItem
// even when storage is not full. All localStorage writes must go through these functions.

export function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Safari Private Mode: silently ignore — session will be lost on tab close
  }
}

export function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}