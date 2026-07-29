import axios from 'axios';

export const STORAGE_KEY = 'jobfast_user';

const BASE_URL =
  import.meta.env['VITE_API_URL'] ||
  import.meta.env['VITE_API_BASE_URL'] ||
  '/api/v1';

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

const safeParse = (value: string | null): unknown => {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
};

const getStoredUser = (): Record<string, unknown> | null => {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? (safeParse(saved) as Record<string, unknown>) : null;
};

const getToken = (): string | null => (getStoredUser()?.['token'] as string) || null;

const triggerLogout = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('auth:logout'));
};

API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error: { response?: { status: number }; code?: string }) => {
    const { response: res, code } = error;
    if (!res || code === 'ECONNABORTED') {
      console.warn('[JOBFAST API]: Network / timeout / cold start');
      return Promise.reject(error);
    }
    if (res.status === 401) {
      triggerLogout();
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default API;