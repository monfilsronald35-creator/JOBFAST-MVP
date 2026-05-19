import axios from "axios";

// ===============================
// 🚀 BASE API INSTANCE (MVP SAFE)
// ===============================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://jobfast-mvp.onrender.com";

const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000,
});

// ===============================
// 🔐 REQUEST INTERCEPTOR (TOKEN)
// ===============================

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===============================
// ⚠ RESPONSE INTERCEPTOR (ERROR HANDLING)
// ===============================

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message || "Server Error";

    console.error("API ERROR:", message);

    // 🔒 Auto logout if unauthorized
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
    }

    return Promise.reject(error);
  }
);

export default API;