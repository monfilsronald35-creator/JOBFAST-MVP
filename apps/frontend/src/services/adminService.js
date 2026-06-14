/* ======================================================
   🚀 ADMIN SERVICE (ULTRA PRO V3 - ENTERPRISE READY)
====================================================== */

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:5000";

/* ======================================================
   🔐 AUTH SYSTEM (JWT + REFRESH READY)
====================================================== */

const getAccessToken = () => {
  try {
    return localStorage.getItem("access_token") || "";
  } catch {
    return "";
  }
};

const getRefreshToken = () => {
  try {
    return localStorage.getItem("refresh_token") || "";
  } catch {
    return "";
  }
};

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const assertAdmin = (user = getUser()) => {
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "admin") throw new Error("Admin access required");
  return true;
};

/* ======================================================
   🔁 TOKEN REFRESH SYSTEM (NEW)
====================================================== */

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh failed");

  const data = await res.json();

  localStorage.setItem("access_token", data.accessToken);

  return data.accessToken;
};

/* ======================================================
   ⚡ REQUEST ENGINE (SMART RETRY + AUTO REFRESH)
====================================================== */

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const request = async (endpoint, options = {}, retry = 2) => {
  try {
    const token = getAccessToken();

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      credentials: "include",
      body: options.body,
    });

    if (res.status === 401) {
      await refreshAccessToken();

      if (retry > 0) {
        return request(endpoint, options, retry - 1);
      }

      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Request failed");
    }

    return await res.json();
  } catch (err) {
    if (retry > 0) {
      await delay(300 * (3 - retry)); // exponential backoff
      return request(endpoint, options, retry - 1);
    }

    console.error("[ADMIN SERVICE ERROR]", err.message);
    throw err;
  }
};

/* ======================================================
   🧾 AUDIT LOG SYSTEM
====================================================== */

export const logAdminAction = (action, data = {}) => {
  return request("/admin/logs", {
    method: "POST",
    body: JSON.stringify({
      action,
      data,
      adminId: getUser()?.id,
      timestamp: new Date().toISOString(),
    }),
  });
};

/* ======================================================
   🚫 USER MODERATION
====================================================== */

export const banUser = async (userId, reason = "No reason") => {
  const res = await request(`/admin/users/${userId}/ban`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });

  await logAdminAction("BAN_USER", { userId, reason });
  return res;
};

export const unbanUser = async (userId) => {
  const res = await request(`/admin/users/${userId}/unban`, {
    method: "PATCH",
  });

  await logAdminAction("UNBAN_USER", { userId });
  return res;
};

export const changeUserRole = async (userId, role) => {
  const roles = ["user", "moderator", "admin"];
  if (!roles.includes(role)) throw new Error("Invalid role");

  const res = await request(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

  await logAdminAction("CHANGE_ROLE", { userId, role });
  return res;
};

export const deleteUser = async (userId) => {
  const res = await request(`/admin/users/${userId}`, {
    method: "DELETE",
  });

  await logAdminAction("DELETE_USER", { userId });
  return res;
};

/* ======================================================
   🧠 AI MODERATION ENGINE (SMART FILTER SYSTEM)
====================================================== */

export const moderateContent = (payload) =>
  request("/admin/ai/moderate", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      model: "ultra-ai-v3",
    }),
  });

export const aiSummarizeUser = (userId) =>
  request(`/admin/ai/users/${userId}/summary`, {
    method: "POST",
  });

export const aiReviewLogs = (logId) =>
  request(`/admin/ai/logs/${logId}/review`, {
    method: "POST",
  });

/* ======================================================
   📈 ANALYTICS ENGINE
====================================================== */

export const getAnalyticsOverview = (range = "30d") =>
  request(`/admin/analytics/overview?range=${range}`);

export const getUserGrowth = (range = "30d") =>
  request(`/admin/analytics/growth?range=${range}`);

export const getBanStats = (range = "30d") =>
  request(`/admin/analytics/bans?range=${range}`);

export const getAuditLogs = (filters = {}) =>
  request(`/admin/logs?${new URLSearchParams(filters)}`);

/* ======================================================
   📡 REAL-TIME DASHBOARD (SECURE SOCKET)
====================================================== */

export const connectAdminSocket = (onEvent, onStatus) => {
  const socket = new WebSocket(
    `${WS_URL}?token=${getAccessToken()}`
  );

  socket.onopen = () => onStatus?.("connected");
  socket.onclose = () => onStatus?.("disconnected");
  socket.onerror = () => onStatus?.("error");

  socket.onmessage = (event) => {
    try {
      onEvent?.(JSON.parse(event.data));
    } catch {
      onEvent?.(event.data);
    }
  };

  return {
    socket,
    send: (data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      }
    },
    close: () => socket.close(),
  };
};

/* ======================================================
   🔥 FINAL EXPORT TOOLKIT
====================================================== */

const adminService = {
  banUser,
  unbanUser,
  changeUserRole,
  deleteUser,

  getUser: (id) => request(`/admin/users/${id}`),
  getAllUsers: (filters = {}) =>
    request(`/admin/users?${new URLSearchParams(filters)}`),

  logAdminAction,

  moderateContent,
  aiSummarizeUser,
  aiReviewLogs,

  getAnalyticsOverview,
  getUserGrowth,
  getBanStats,
  getAuditLogs,

  connectAdminSocket,
  assertAdmin,
};

export default adminService;