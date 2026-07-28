/**
 * Core API Client — enhanced axios instance with auth, retry, offline detection
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
const TIMEOUT  = 15_000;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json', 'X-API-Version': 'v1' },
  withCredentials: true,
});

// ── Request Interceptor ────────────────────────────────────────────────────
client.interceptors.request.use(config => {
  const token = localStorage.getItem('jf_token') || sessionStorage.getItem('jf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Request-Id'] = crypto.randomUUID?.() || Date.now().toString(36);
  return config;
});

// ── Response Interceptor ───────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

client.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    // 401 — try to refresh token once
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('jf_token')}` },
        });
        const newToken = data?.data?.token;
        if (newToken) {
          localStorage.setItem('jf_token', newToken);
          client.defaults.headers.Authorization = `Bearer ${newToken}`;
          refreshQueue.forEach(q => q.resolve(newToken));
          refreshQueue = [];
          original.headers.Authorization = `Bearer ${newToken}`;
          return client(original);
        }
      } catch {
        refreshQueue.forEach(q => q.reject(err));
        refreshQueue = [];
        localStorage.removeItem('jf_token');
        window.dispatchEvent(new Event('jf:logout'));
      } finally {
        isRefreshing = false;
      }
    }

    // Network error — dispatch offline event
    if (!err.response) {
      window.dispatchEvent(new CustomEvent('jf:offline', { detail: err }));
    }

    return Promise.reject(err);
  }
);

// ── Typed helpers ──────────────────────────────────────────────────────────
export const api = {
  get:    (url, config)       => client.get(url, config).then(r => r.data),
  post:   (url, data, config) => client.post(url, data, config).then(r => r.data),
  put:    (url, data, config) => client.put(url, data, config).then(r => r.data),
  patch:  (url, data, config) => client.patch(url, data, config).then(r => r.data),
  delete: (url, config)       => client.delete(url, config).then(r => r.data),
};

export default client;
