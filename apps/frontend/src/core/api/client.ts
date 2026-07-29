import axios, { type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:5001/api/v1';
const TIMEOUT  = 15_000;

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void };

const client = axios.create({
  baseURL:         BASE_URL,
  timeout:         TIMEOUT,
  headers:         { 'Content-Type': 'application/json', 'X-API-Version': 'v1' },
  withCredentials: true,
});

// ── Request Interceptor ───────────────────────────────────────

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('jf_token') || sessionStorage.getItem('jf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Request-Id'] = crypto.randomUUID?.() || Date.now().toString(36);
  return config;
});

// ── Response Interceptor ──────────────────────────────────────

let isRefreshing = false;
let refreshQueue: QueueItem[] = [];

client.interceptors.response.use(
  (res) => res,
  async (err: unknown) => {
    const axiosErr = err as { response?: { status: number }; config?: RetryableConfig };
    const original = axiosErr.config;

    if (axiosErr.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('jf_token')}` },
        });
        const newToken = (data as { data?: { token?: string } })?.data?.token;
        if (newToken) {
          localStorage.setItem('jf_token', newToken);
          (client.defaults.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
          refreshQueue.forEach((q) => q.resolve(newToken));
          refreshQueue = [];
          original.headers.Authorization = `Bearer ${newToken}`;
          return client(original);
        }
      } catch {
        refreshQueue.forEach((q) => q.reject(err));
        refreshQueue = [];
        localStorage.removeItem('jf_token');
        window.dispatchEvent(new Event('jf:logout'));
      } finally {
        isRefreshing = false;
      }
    }

    if (!(err as { response?: unknown }).response) {
      window.dispatchEvent(new CustomEvent('jf:offline', { detail: err }));
    }

    return Promise.reject(err);
  }
);

// ── Typed helpers ─────────────────────────────────────────────

export const api = {
  get:    <T = unknown>(url: string, config?: object)              => client.get<T>(url, config).then((r) => r.data),
  post:   <T = unknown>(url: string, data?: unknown, config?: object) => client.post<T>(url, data, config).then((r) => r.data),
  put:    <T = unknown>(url: string, data?: unknown, config?: object) => client.put<T>(url, data, config).then((r) => r.data),
  patch:  <T = unknown>(url: string, data?: unknown, config?: object) => client.patch<T>(url, data, config).then((r) => r.data),
  delete: <T = unknown>(url: string, config?: object)              => client.delete<T>(url, config).then((r) => r.data),
};

export default client;