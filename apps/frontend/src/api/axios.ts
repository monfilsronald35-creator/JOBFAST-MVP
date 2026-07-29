import axios, { type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env['VITE_API_URL'] || '/api/v1';

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 70000,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem('jobfast_user');
      if (raw) {
        const u = JSON.parse(raw) as { token?: string };
        if (u?.token) config.headers.Authorization = `Bearer ${u.token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error: { response?: { status: number }; config?: RetryableConfig; message?: string }) => {
    if (!error.response) {
      return Promise.reject({
        message: 'Pa gen rezo. Sèvè JobFast la pa ka jwenn nan moman sa a.',
        code:    'NETWORK_ERROR',
      });
    }

    const status = error.response.status;

    if ((status === 503 || status === 504) && error.config) {
      const retryCount = error.config._retryCount || 0;
      if (retryCount < 2) {
        error.config._retryCount = retryCount + 1;
        const waitMs = retryCount === 0 ? 20000 : 30000;
        await new Promise<void>((r) => setTimeout(r, waitMs));
        return API(error.config);
      }
    }

    if (status === 401) {
      const url = (error.config as { url?: string })?.url || '';
      if (url.includes('/auth/')) {
        try { localStorage.removeItem('jobfast_user'); } catch {}
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    if (status >= 500) console.error(`Server error [${status}]`);

    return Promise.reject(error);
  }
);

export async function checkAPIHealth(): Promise<unknown> {
  try {
    const res = await API.get('/health', { timeout: 10000 });
    return res.data;
  } catch { return null; }
}

export default API;