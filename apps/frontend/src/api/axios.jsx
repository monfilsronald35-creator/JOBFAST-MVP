import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/v1";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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
  (error) => {
    if (!error.response) {
      return Promise.reject({
        message: "Pa gen rezo. Sèvè JobFast la pa ka jwenn nan moman sa a.",
        code: "NETWORK_ERROR",
      });
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
