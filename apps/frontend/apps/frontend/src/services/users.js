import API from "./api";

/* ================= UTIL ================= */
const now = () => Date.now();

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

/* ================= RESPONSE WRAPPER ================= */
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
    const data = res?.data;

    if (
      data == null ||
      (typeof data === "object" &&
        !Array.isArray(data) &&
        Object.keys(data).length === 0)
    ) {
      return fail(null, "Invalid server response");
    }

    return success(data, meta);
  } catch (error) {
    return fail(error || {}, fallback);
  }
};

/* ================= USER PROFILE SERVICE ================= */

/* GET MY PROFILE */
export const getMyProfile = () =>
  request(
    () => API.get("/users/profile"),
    "Unable to load profile"
  );

/* STATUS VALIDATION */
const VALID_STATUS = ["available", "busy", "working", "offline"];

/* UPDATE USER STATUS */
export const updateUserStatus = (status) => {
  const normalized =
    typeof status === "string" ? status.toLowerCase() : status;

  if (!VALID_STATUS.includes(normalized)) {
    return Promise.resolve(
      fail(null, "Invalid status value")
    );
  }

  return request(
    () => API.patch("/users/status", { status: normalized }),
    "Unable to update status"
  );
};

/* UPDATE PROFILE */
export const updateProfile = (userData) =>
  request(
    () => API.put("/users/profile", userData),
    "Unable to update profile"
  );