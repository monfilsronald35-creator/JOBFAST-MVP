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
      return fail(null, 'Invalid server response');
    }
    return success(data, meta);
  } catch (error) { return fail(error as ApiError || {}, fallback); }
};

export const getMyProfile = () => request(() => API.get('/users/profile'), 'Unable to load profile');

const VALID_STATUS = ['available', 'busy', 'working', 'offline'] as const;
type UserStatus = (typeof VALID_STATUS)[number];

export const updateUserStatus = (status: string): Promise<ServiceResult<unknown>> => {
  const normalized = typeof status === 'string' ? (status.toLowerCase() as UserStatus) : status;
  if (!(VALID_STATUS as readonly string[]).includes(normalized)) {
    return Promise.resolve(fail(null, 'Invalid status value'));
  }
  return request(() => API.patch('/users/status', { status: normalized }), 'Unable to update status');
};

export const updateProfile = (userData: unknown) =>
  request(() => API.put('/users/profile', userData), 'Unable to update profile');