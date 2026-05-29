// ======================================================
// 🌍 src/api/axios.js
// 🚀 GLOBAL API SYSTEM (FAST + SAFE)
// ======================================================

import axios from "axios";

// ======================================================
// 🌍 BASE URL
// ======================================================

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// ======================================================
// 🚀 AXIOS INSTANCE
// ======================================================

const API = axios.create({
  baseURL: BASE_URL,

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================================
// 🔐 AUTO TOKEN SYSTEM
// ======================================================

API.interceptors.request.use(
  (config) => {

    try {

      const token =
        localStorage.getItem("token");

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }

      return config;

    } catch (error) {

      console.error(
        "❌ Request interceptor error:",
        error
      );

      return config;
    }
  },

  (error) => {
    return Promise.reject(error);
  }
);

// ======================================================
// 🚨 RESPONSE INTERCEPTOR
// ======================================================

API.interceptors.response.use(

  (response) => {
    return response;
  },

  (error) => {

    // ---------------------------------------------
    // NO INTERNET / SERVER DOWN
    // ---------------------------------------------
    if (!error.response) {

      console.error(
        "❌ Network error"
      );

      return Promise.reject({
        message:
          "Network error. Backend offline.",
      });
    }

    // ---------------------------------------------
    // TOKEN EXPIRED
    // ---------------------------------------------
    if (
      error.response.status === 401
    ) {

      localStorage.removeItem("token");

      // Redirect login
      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.href =
          "/login";
      }
    }

    // ---------------------------------------------
    // SERVER ERROR
    // ---------------------------------------------
    if (
      error.response.status >= 500
    ) {

      console.error(
        "❌ Server error"
      );
    }

    return Promise.reject(error);
  }
);

// ======================================================
// 🚀 HEALTH CHECK
// ======================================================

export async function checkAPIHealth() {

  try {

    const res =
      await API.get("/health");

    return res.data;

  } catch (error) {

    console.error(
      "❌ API health failed"
    );

    return null;
  }
}

// ======================================================
// 🚀 EXPORT
// ======================================================

export default API;