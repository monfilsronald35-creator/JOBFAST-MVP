import axios from "axios";

// ===============================
// 🌍 API BASE URL
// ===============================

export const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://jobfast-mvp.onrender.com";

// ===============================
// 🚀 CREATE API INSTANCE
// ===============================

const API = axios.create({
  baseURL: API_URL,

  timeout: 15000,

  headers: {
    "Content-Type":
      "application/json",

    Accept:
      "application/json",
  },
});

// ===============================
// 🔐 REQUEST INTERCEPTOR
// ===============================

API.interceptors.request.use(

  (config) => {

    // ===============================
    // 🔑 TOKEN
    // ===============================

    const token =
      localStorage.getItem(
        "token"
      );

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    // ===============================
    // 🌍 APP IDENTIFIER
    // ===============================

    config.headers[
      "X-App-Client"
    ] = "JOBFAST_MVP";

    // ===============================
    // ⏱ REQUEST TIMER
    // ===============================

    config.metadata = {
      startTime: Date.now(),
    };

    return config;
  },

  (error) => {

    console.error(
      "❌ Request Error:",
      error
    );

    return Promise.reject(
      error
    );
  }
);

// ===============================
// ⚠ RESPONSE INTERCEPTOR
// ===============================

API.interceptors.response.use(

  // ===============================
  // ✅ SUCCESS
  // ===============================

  (response) => {

    try {

      const start =
        response?.config
          ?.metadata
          ?.startTime;

      if (start) {

        const duration =
          Date.now() - start;

        console.log(
          `✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`
        );
      }

    } catch (err) {

      console.error(
        "⚠ Log Error:",
        err
      );
    }

    return response;
  },

  // ===============================
  // ❌ ERROR
  // ===============================

  (error) => {

    const status =
      error?.response?.status;

    const message =
      error?.response?.data
        ?.message ||
      error?.message ||
      "Server Error";

    console.error(
      "❌ API ERROR:",
      message
    );

    // ===============================
    // 🔒 AUTO LOGOUT
    // ===============================

    if (status === 401) {

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      console.warn(
        "⚠ Session expired"
      );
    }

    // ===============================
    // 🌐 OFFLINE SERVER
    // ===============================

    if (!error?.response) {

      console.error(
        "🌐 Backend unavailable"
      );
    }

    // ===============================
    // ⏱ TIMEOUT
    // ===============================

    if (
      error?.code ===
      "ECONNABORTED"
    ) {

      console.error(
        "⏱ Request timeout"
      );
    }

    return Promise.reject(
      error
    );
  }
);

// ===============================
// 🚀 SAFE METHODS
// ===============================

export const apiGet =
  async (
    url,
    config = {}
  ) => {

    const response =
      await API.get(
        url,
        config
      );

    return response.data;
  };

export const apiPost =
  async (
    url,
    data = {},
    config = {}
  ) => {

    const response =
      await API.post(
        url,
        data,
        config
      );

    return response.data;
  };

export const apiPut =
  async (
    url,
    data = {},
    config = {}
  ) => {

    const response =
      await API.put(
        url,
        data,
        config
      );

    return response.data;
  };

export const apiPatch =
  async (
    url,
    data = {},
    config = {}
  ) => {

    const response =
      await API.patch(
        url,
        data,
        config
      );

    return response.data;
  };

export const apiDelete =
  async (
    url,
    config = {}
  ) => {

    const response =
      await API.delete(
        url,
        config
      );

    return response.data;
  };

// ===============================
// 📦 EXPORT
// ===============================

export default API;