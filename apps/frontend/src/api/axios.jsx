import axios from "axios";

// Relative URL → goes through Vercel proxy → no CORS, no cold-start preflight issues.
// VITE_API_URL should NOT be set on Vercel. Only set it for local dev override.
const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 70000, // 70s — Render free tier can take up to 60s to wake from cold start
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

    // 503 / 504 = Render cold start (can take 30-60s on free tier).
    // Retry up to 2× with increasing delay so users aren't locked out.
    if (status === 503 || status === 504) {
      const retryCount = error.config._retryCount || 0;
      if (retryCount < 2) {
        error.config._retryCount = retryCount + 1;
        const waitMs = retryCount === 0 ? 20000 : 30000; // 20s, then 30s
        await new Promise((r) => setTimeout(r, waitMs));
        return API(error.config);
      }
    }

    // 401 — only auto-logout on auth-specific routes (token expired/invalid).
    // Non-auth 401s (e.g. jobs, search) should not clear the session.
    if (status === 401) {
      const url = error.config?.url || "";
      const isAuthRoute = url.includes("/auth/");
      if (isAuthRoute) {
        localStorage.removeItem("jobfast_user");
        window.dispatchEvent(new CustomEvent("auth:expired"));
      }
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
