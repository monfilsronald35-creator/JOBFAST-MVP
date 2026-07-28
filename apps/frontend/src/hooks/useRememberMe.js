import { useCallback } from 'react';

const ID_KEY  = 'jf_remember_id';
const TOK_KEY = 'jf_remember_tok';

export function useRememberMe() {
  const saveSession = useCallback(({ remember, token, user }) => {
    try {
      if (remember) {
        const id = user?.email || user?.phone || '';
        if (id) localStorage.setItem(ID_KEY, id);
        if (token) localStorage.setItem(TOK_KEY, token);
      } else {
        localStorage.removeItem(ID_KEY);
        localStorage.removeItem(TOK_KEY);
      }
    } catch {}
  }, []);

  const loadRememberedIdentifier = useCallback(() => {
    try { return localStorage.getItem(ID_KEY) || ''; } catch { return ''; }
  }, []);

  const loadRememberedToken = useCallback(() => {
    try { return localStorage.getItem(TOK_KEY) || null; } catch { return null; }
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(ID_KEY);
      localStorage.removeItem(TOK_KEY);
    } catch {}
  }, []);

  return { saveSession, loadRememberedIdentifier, loadRememberedToken, clearSession };
}
