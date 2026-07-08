import axios from "axios";

// Relative URL → goes through Vercel proxy → no CORS, no cold-start preflight issues.
// VITE_API_URL should NOT be set on Vercel. Only set it for local dev override.
const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 65000, // 65s — Render free tier can take up to 60s to wake
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request: attach JWT ────────────────────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem("jobfast_user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${u.token}`;
        }
      }
    } catch {
      // ignore — never crash the request
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: retry on wake-up codes, handle auth expiry ──────────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    // True network failure — no response at all
    if (!error.response) {
      return Promise.reject({
        message: "Pa gen rezo. Sèvè JobFast la pa ka jwenn nan moman sa a.",
        code: "NETWORK_ERROR",
      });
    }

    const status = error.response.status;

    // 503 Service Unavailable OR 504 Gateway Timeout = Render waking up
    // Retry once after 14s — enough time for Render's cold start (~10-30s).
    if ((status === 503 || status === 504) && !error.config._retried) {
      error.config._retried = true;
      await new Promise((r) => setTimeout(r, 14000));
      return API(error.config);
    }

    // 401 — token expired or invalid → force logout
    if (status === 401) {
      localStorage.removeItem("jobfast_user");
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }

    if (status >= 500) {
      console.error(`Server error [${status}]`);
    }

    return Promise.reject(error);
  }
);

// ── Health check utility ───────────────────────────────────────────────────
export async function checkAPIHealth() {
  try {
    const res = await API.get("/health", { timeout: 10000 });
    return res.data;
  } catch {
    return null;
  }
}

export default API;
