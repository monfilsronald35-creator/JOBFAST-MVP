import axios from "axios";

// ===============================
// 🚀 BASE API INSTANCE (MVP SAFE)
// ===============================

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
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

    // Optional: global error log
    console.error("API ERROR:", message);

    // Auto logout if token invalid (401)
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
    }

    return Promise.reject(error);
  }
);

export default API;