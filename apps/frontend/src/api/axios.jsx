import axios from "axios";

// ===============================
// 🌍 API BASE URL
// ===============================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://jobfast-mvp.onrender.com";

// ===============================
// 🚀 CREATE API INSTANCE
// ===============================

const API = axios.create({
  baseURL: API_URL,

  timeout: 15000,

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

// ===============================
// 🔐 REQUEST INTERCEPTOR
// ===============================

API.interceptors.request.use(

  async (config) => {

    try {

      // ===============================
      // 🛡 SAFE HEADERS
      // ===============================

      config.headers =
        config.headers || {};

      // ===============================
      // 🔑 TOKEN
      // ===============================

      const token =
        localStorage.getItem("token");

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }

      // ===============================
      // 🌍 CLIENT IDENTIFIER
      // ===============================

      config.headers["X-App-Client"] =
        "JOBFAST_MVP";

      // ===============================
      // ⏱ REQUEST START TIME
      // ===============================

      config.metadata = {
        startTime: new Date()
      };

      return config;

    } catch (error) {

      console.error(
        "❌ Request interceptor error:",
        error
      );

      return Promise.reject(error);
    }
  },

  (error) => {
    return Promise.reject(error);
  }
);

// ===============================
// ⚠ RESPONSE INTERCEPTOR
// ===============================

API.interceptors.response.use(

  // ===============================
  // ✅ SUCCESS RESPONSE
  // ===============================

  (response) => {

    try {

      if (
        response?.config?.metadata?.startTime
      ) {

        const endTime = new Date();

        const duration =
          endTime -
          response.config.metadata.startTime;

        console.log(
          `✅ API: ${response.config.url} (${duration}ms)`
        );
      }

    } catch (error) {

      console.error(
        "⚠ Response log error:",
        error
      );
    }

    return response;
  },

  // ===============================
  // ❌ ERROR RESPONSE
  // ===============================

  (error) => {

    // ===============================
    // 🌍 ERROR MESSAGE
    // ===============================

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Server Error";

    console.error(
      "❌ API ERROR:",
      message
    );

    // ===============================
    // 🔒 AUTO LOGOUT
    // ===============================

    if (
      error?.response?.status === 401
    ) {

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      console.warn(
        "⚠ Session expired"
      );
    }

    // ===============================
    // ⏱ TIMEOUT
    // ===============================

    if (
      error?.code === "ECONNABORTED"
    ) {

      console.error(
        "⏱ Request timeout"
      );
    }

    // ===============================
    // 🌐 SERVER OFFLINE
    // ===============================

    if (!error?.response) {

      console.error(
        "🌐 Server unavailable"
      );
    }

    return Promise.reject(error);
  }
);

// ===============================
// 🚀 SAFE API METHODS
// ===============================

export const apiGet = async (
  url,
  config = {}
) => {

  const response =
    await API.get(url, config);

  return response.data;
};

export const apiPost = async (
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

export const apiPut = async (
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

export const apiDelete = async (
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
// 📦 EXPORTS
// ===============================

export {
  API_URL
};

export default API;