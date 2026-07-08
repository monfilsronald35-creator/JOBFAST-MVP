import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s — Render free tier needs up to 30-60s to wake from sleep
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    try {
      const jobfastUser = localStorage.getItem("jobfast_user");

      if (jobfastUser) {
        const parsedUser = JSON.parse(jobfastUser);
        if (parsedUser?.token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${parsedUser.token}`;
        }
      }

      return config;
    } catch (error) {
      console.error("Request interceptor error:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      return Promise.reject({
        message: "Pa gen rezo. Sèvè JobFast la pa ka jwenn nan moman sa a.",
        code: "NETWORK_ERROR",
      });
    }

    // Auto-retry once when Render free tier is waking up (503)
    if (error.response.status === 503 && !error.config._retried) {
      error.config._retried = true;
      await new Promise((r) => setTimeout(r, 12000)); // wait 12s for Render to wake
      return API(error.config);
    }

    if (error.response.status === 401) {
      localStorage.removeItem("jobfast_user");
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }

    if (error.response.status >= 500) {
      console.error(`Critical Server Error [${error.response.status}]`);
    }

    return Promise.reject(error);
  }
);

export async function checkAPIHealth() {
  try {
    const res = await API.get("/health");
    return res.data;
  } catch {
    return null;
  }
}

export default API;
