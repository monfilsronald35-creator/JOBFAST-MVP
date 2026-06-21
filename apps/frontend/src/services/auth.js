import API from "../api/axios";

/* ================= UTIL ================= */
const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  return (
    data?.error?.message ||
    data?.message ||
    (typeof data?.error === "string" ? data.error : null) ||
    error?.message ||
    fallback
  );
};

/* ================= AUTH RESPONSE NORMALIZER ================= */
// Backend voye: { success, meta, data: { token, user, message } }
// Nou retounen yon fòm plat: { success, token, user, message, code }
const normalizeAuth = (result) => {
  if (!result?.success) {
    return {
      success: false,
      message: result?.message || "Operasyon echwe.",
      code: result?.code ?? null,
      status: result?.status ?? null,
    };
  }

  const body = result.data || {};
  const payload = body?.data ?? body;

  return {
    success: true,
    token: payload?.token || null,
    user: payload?.user || null,
    message: payload?.message || body?.message || null,
  };
};

const now = () => Date.now();

/* ================= RESPONSE FACTORY ================= */
const success = (data, meta = {}) => ({
  success: true,
  data,
  meta,
  timestamp: now(),
});

const fail = (error, fallback) => ({
  success: false,
  message: getErrorMessage(error, fallback),
  status: error?.response?.status ?? null,
  code: error?.response?.data?.code ?? null,
  timestamp: now(),
});

/* ================= SAFE REQUEST ================= */
const request = async (fn, fallback, meta = {}) => {
  try {
    const res = await fn();

    // 🔥 FIX: handle missing response safely
    if (!res || typeof res !== "object") {
      return fail(null, "No response from server");
    }

    const data = res?.data;

    // 🔥 FIX: stricter validation but safe
    if (
      data == null ||
      (typeof data === "object" &&
        !Array.isArray(data) &&
        Object.keys(data).length === 0)
    ) {
      return {
        success: false,
        message: "Invalid server response",
        meta,
        timestamp: now(),
      };
    }

    // 🔥 FIX: backend-level failure support
    if (data?.success === false) {
      return {
        success: false,
        message: data?.message || "Request failed",
        meta,
        timestamp: now(),
      };
    }

    return success(data, meta);
  } catch (error) {
    return fail(error || {}, fallback);
  }
};

/* ================= REQUEST DEDUP ================= */
const pendingRequests = new Map();

const makeKey = (name, payload = {}) => {
  try {
    const safePayload = { ...payload };

    ["password", "token", "refreshToken", "confirmPassword"].forEach(
      (k) => delete safePayload[k]
    );

    return `${name}:${JSON.stringify(safePayload)}`;
  } catch {
    return `${name}:static`;
  }
};

const dedupeRequest = (key, fn) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = fn();

  pendingRequests.set(key, promise);

  promise.finally(() => {
    pendingRequests.delete(key);
  });

  return promise;
};

/* ================= STORAGE ================= */
const safeParse = (v) => {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

const updateStoredUser = (updater) => {
  try {
    const raw = localStorage.getItem("jobfast_user");
    if (!raw) return;

    const user = safeParse(raw);
    if (!user) return;

    const updated = updater(user);
    if (!updated) return;

    localStorage.setItem("jobfast_user", JSON.stringify(updated));
  } catch {
    // silent fail (prod safe)
  }
};

/* ================= AUTH API ================= */

/* LOGIN */
export const login = (credentials) =>
  dedupeRequest(makeKey("login", { email: credentials?.email }), async () => {
    const res = await request(
      () => API.post("/auth/login", credentials),
      "Login failed."
    );
    return normalizeAuth(res);
  });

/* REGISTER */
export const register = (userData) =>
  dedupeRequest(makeKey("register", { email: userData?.email }), async () => {
    const res = await request(
      () => API.post("/auth/register", userData),
      "Registration failed."
    );
    return normalizeAuth(res);
  });

/* GET CURRENT USER */
export const getCurrentUser = () =>
  request(() => API.get("/auth/me"), "Unable to fetch user profile.");

/* VALIDATE TOKEN */
export const validateToken = () =>
  request(() => API.get("/auth/validate"), "Token validation failed.");

/* REFRESH SESSION */
export const refreshSession = async () => {
  const result = await request(
    () => API.post("/auth/refresh"),
    "Unable to refresh session."
  );

  if (result.success && result.data?.token) {
    updateStoredUser((u) => ({
      ...u,
      token: result.data.token,
      refreshToken: result.data.refreshToken || u?.refreshToken,
    }));
  }

  return result;
};

/* HEALTH CHECK */
export const authHealthCheck = () =>
  request(() => API.get("/auth/health"), "Auth service unavailable.");

/* LOGOUT */
export const logoutRequest = () =>
  request(() => API.post("/auth/logout"), "Logout failed.");