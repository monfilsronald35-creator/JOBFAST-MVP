// ======================================================
// 🌍 src/api/axios.js
// 🚀 GLOBAL API SYSTEM (PREMIUM ENTERPRISE PLUS v3.6)
// ======================================================

import axios from "axios";

// ======================================================
// 🌍 BASE URL CONFIG
// ======================================================
// Nan pwodiksyon, nou kite l vid oswa nou itilize /v1 pou l pase nan proxy Vercel la otomatikman
const BASE_URL = import.meta.env.VITE_API_URL || "/v1";

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
// 🔐 AUTO TOKEN ENJECTION SYSTEM
// ======================================================
API.interceptors.request.use(
  (config) => {
    try {
      // Piske nou estoke tout done yo anba kle 'jobfast_user' nan fòma JSON:
      const jobfastUser = localStorage.getItem("jobfast_user");
      
      if (jobfastUser) {
        const parsedUser = JSON.parse(jobfastUser);
        if (parsedUser?.token) {
          config.headers.Authorization = `Bearer ${parsedUser.token}`;
        }
      }
      return config;
    } catch (error) {
      console.error("❌ Request interceptor error:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// ======================================================
// 🚨 RESPONSE INTERCEPTOR (ERROR HANDLER)
// ======================================================
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // ---------------------------------------------
    // 🌐 REZO DOWN / SÈVÈ REKÒD (OFFLINE)
    // ---------------------------------------------
    if (!error.response) {
      console.error("❌ Network error — Backend offline.");
      return Promise.reject({
        message: "Pa gen rezo. Sèvè JobFast la pa ka jwenn nan moman sa a.",
      });
    }

    // ---------------------------------------------
    // 🔐 SESYON EKSPÌRE (401 UNAUTHORIZED)
    // ---------------------------------------------
    if (error.response.status === 401) {
      // Netwaye depo a nèt pou evite bouk infini (infinite loop)
      localStorage.removeItem("jobfast_user");

      // Redidije sèlman si moun nan pa nan paj login lan deja
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?expired=true";
      }
    }

    // ---------------------------------------------
    // 🚨 SÈVÈ ERÈ CRITICAL (500+)
    // ---------------------------------------------
    if (error.response.status >= 500) {
      console.error(`❌ Critical Server Error [${error.response.status}]`);
    }

    return Promise.reject(error);
  }
);

// ======================================================
// 🚀 HEALTH CHECK ENGINE
// ======================================================
export async function checkAPIHealth() {
  try {
    const res = await API.get("/health");
    return res.data;
  } catch (error) {
    console.error("❌ API health check failed");
    return null;
  }
}

export default API;
