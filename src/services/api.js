import axios from "axios";

/* ================= CONFIG ================= */
export const STORAGE_KEY = "jobfast_user";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://jobfast-backend.onrender.com/v1";

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
const getRefreshToken = () => getStoredUser()?.refreshToken || null;

/* ================= LOGOUT ================= */
const triggerLogout = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("auth:logout"));
};

/* ================= REFRESH CONTROL ================= */
let isRefreshing = false;
let refreshQueue = [];

/* safer queue handling */
const subscribe = (cb) => refreshQueue.push(cb);

const resolveQueue = (token) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
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
      config._retry = config._retry || 0;

      /* prevent infinite retry loop */
      if (config._retry >= 1) {
        triggerLogout();
        return Promise.reject(error);
      }

      config._retry += 1;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        triggerLogout();
        return Promise.reject(error);
      }

      /* ================= QUEUE IF ALREADY REFRESHING ================= */
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribe((token) => {
            if (!token) return reject(error);

            config.headers.Authorization = `Bearer ${token}`;
            resolve(API(config));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const newToken = refreshRes?.data?.token;

        if (!newToken) throw new Error("Invalid refresh response");

        /* ================= UPDATE STORAGE SAFELY ================= */
        const user = getStoredUser();

        if (user) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              ...user,
              token: newToken,
            })
          );
        }

        /* ================= RESOLVE QUEUE ================= */
        resolveQueue(newToken);

        config.headers.Authorization = `Bearer ${newToken}`;
        return API(config);
      } catch (err) {
        resolveQueue(null);
        triggerLogout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;