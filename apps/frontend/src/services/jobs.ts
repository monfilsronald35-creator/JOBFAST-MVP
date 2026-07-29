import API from './api';

const now = () => Date.now();

interface ApiError {
  response?: { data?: { message?: string; error?: string; code?: string }; status?: number };
  message?: string;
}

interface ServiceSuccess<T> { success: true;  data: T;   meta: Record<string, unknown>; timestamp: number; }
interface ServiceError      { success: false; message: string; status: number | null; code: string | null; timestamp: number; }
type ServiceResult<T> = ServiceSuccess<T> | ServiceError;

const getErrorMessage = (error: ApiError | null | undefined, fallback: string): string =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

const success = <T>(data: T, meta: Record<string, unknown> = {}): ServiceSuccess<T> =>
  ({ success: true, data, meta, timestamp: now() });

const fail = (error: ApiError | null | undefined, fallback: string): ServiceError => ({
  success: false, message: getErrorMessage(error, fallback),
  status: error?.response?.status ?? null, code: error?.response?.data?.code ?? null, timestamp: now(),
});

const request = async <T = unknown>(
  fn: () => Promise<{ data: T }>,
  fallback: string,
  meta: Record<string, unknown> = {}
): Promise<ServiceResult<T>> => {
  try {
    const res = await fn();
    const data = res?.data;
    if (data == null || (typeof data === 'object' && !Array.isArray(data) && Object.keys(data as object).length === 0)) {
      return fail({}, 'Invalid server response');
    }
    if ((data as Record<string, unknown>)?.['success'] === false) {
      return fail({}, (data as Record<string, unknown>)?.['message'] as string || fallback);
    }
    return success(data, meta);
  } catch (error) { return fail(error as ApiError || {}, fallback); }
};

const pending = new Map<string, Promise<ServiceResult<unknown>>>();

const makeKey = (name: string, payload: unknown = {}): string => {
  try { return `${name}:${JSON.stringify(payload)}`; } catch { return `${name}:static`; }
};

function dedupe<T>(key: string, fn: () => Promise<ServiceResult<T>>): Promise<ServiceResult<T>> {
  if (pending.has(key)) return pending.get(key) as Promise<ServiceResult<T>>;
  const p = fn().finally(() => pending.delete(key));
  pending.set(key, p as Promise<ServiceResult<unknown>>);
  return p;
}

export const getAllJobs = (params: Record<string, unknown> = {}) =>
  dedupe(makeKey('jobs:list', params), () => request(() => API.get('/jobs', { params }), 'Failed to load jobs'));

export const createJob = (jobData: unknown) =>
  dedupe(makeKey('jobs:create', jobData), () => request(() => API.post('/jobs/create', jobData), 'Failed to create job'));

export const getJobById = (id: string | number) =>
  request(() => API.get(`/jobs/${id}`), 'Job not found');

export const updateJob = (id: string | number, jobData: unknown) =>
  request(() => API.patch(`/jobs/status/${id}`, jobData), 'You are not allowed to update this job');

export const applyForJob = (jobId: string | number, data: unknown) =>
  request(() => API.post(`/jobs/apply/${jobId}`, data), 'Failed to apply for job');

export const getJobApplications = (jobId: string | number) =>
  request(() => API.get(`/jobs/applications/${jobId}`), 'Failed to load applications');