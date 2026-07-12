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
      return fail({}, "Invalid server response");
    }

    if (data?.success === false) {
      return fail({}, data?.message || fallback);
    }

    return success(data, meta);
  } catch (error) {
    return fail(error || {}, fallback);
  }
};

/* ================= REQUEST DEDUP ================= */
const pending = new Map();

const makeKey = (name, payload = {}) => {
  try {
    return `${name}:${JSON.stringify(payload)}`;
  } catch {
    return `${name}:static`;
  }
};

const dedupe = (key, fn) => {
  if (pending.has(key)) return pending.get(key);

  const p = fn().finally(() => pending.delete(key));
  pending.set(key, p);

  return p;
};

/* ================= JOBS API ================= */

/* GET ALL JOBS */
export const getAllJobs = (params = {}) =>
  dedupe(
    makeKey("jobs:list", params),
    () => request(() => API.get("/jobs", { params }), "Failed to load jobs")
  );

/* CREATE JOB */
export const createJob = (jobData) =>
  dedupe(
    makeKey("jobs:create", jobData),
    () =>
      request(() => API.post("/jobs/create", jobData), "Failed to create job")
  );

/* GET JOB BY ID */
export const getJobById = (id) =>
  request(() => API.get(`/jobs/${id}`), "Job not found");

/* UPDATE JOB STATUS */
export const updateJob = (id, jobData) =>
  request(
    () => API.patch(`/jobs/status/${id}`, jobData),
    "You are not allowed to update this job"
  );

/* APPLY FOR JOB */
export const applyForJob = (jobId, data) =>
  request(
    () => API.post(`/jobs/apply/${jobId}`, data),
    "Failed to apply for job"
  );

/* GET JOB APPLICATIONS */
export const getJobApplications = (jobId) =>
  request(() => API.get(`/jobs/applications/${jobId}`), "Failed to load applications");