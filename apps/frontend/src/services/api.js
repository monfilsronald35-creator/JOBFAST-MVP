import axios from "axios";

/* ================= CONFIG ================= */
export const STORAGE_KEY = "jobfast_user";

// Uses the same env var as api/axios.jsx so all requests target the same server.
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api/v1";

/* ================= AXIOS INSTANCE ================= */
const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ================= SAFE PARSE ================= */
const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/* ================= STORAGE HELPERS ================= */
const getStoredUser = () => {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? safeParse(saved) : null;
};

const getToken = () => getStoredUser()?.token || null;

/* ================= LOGOUT ================= */
const triggerLogout = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("auth:logout"));
};


/* ================= REQUEST INTERCEPTOR ================= */
API.interceptors.request.use(
  (config) => {
    const token = getToken();

    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response: res, config, code } = error;

    /* ================= NETWORK / TIMEOUT ================= */
    if (!res || code === "ECONNABORTED") {
      console.warn("[JOBFAST API]: Network / timeout / cold start");
      return Promise.reject(error);
    }

    /* ================= 401 HANDLING ================= */
    if (res.status === 401) {
      triggerLogout();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default API;