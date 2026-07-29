import API from '../api/axios';

interface ApiError {
  response?: {
    data?: { message?: string; error?: string | { message?: string }; code?: string };
    status?: number;
  };
  message?: string;
}

interface ServiceSuccess<T> { success: true;  data: T;   meta: Record<string, unknown>; timestamp: number; }
interface ServiceError      { success: false; message: string; status: number | null; code: string | null; timestamp: number; }
type ServiceResult<T> = ServiceSuccess<T> | ServiceError;

const getErrorMessage = (error: ApiError | null | undefined, fallback: string): string =>
  error?.response?.data?.message ||
  (typeof error?.response?.data?.error === 'object' ? error.response!.data!.error?.message : null) ||
  (typeof error?.response?.data?.error === 'string' ? error.response!.data!.error : null) ||
  error?.message ||
  fallback;

const now = () => Date.now();

const success = <T>(data: T, meta: Record<string, unknown> = {}): ServiceSuccess<T> =>
  ({ success: true, data, meta, timestamp: now() });

const fail = (error: ApiError | null | undefined, fallback: string): ServiceError => ({
  success:   false,
  message:   getErrorMessage(error, fallback),
  status:    error?.response?.status ?? null,
  code:      error?.response?.data?.code ?? null,
  timestamp: now(),
});

const request = async <T = unknown>(
  fn: () => Promise<{ data: T }>,
  fallback: string,
  meta: Record<string, unknown> = {}
): Promise<ServiceResult<T>> => {
  try {
    const res = await fn();
    if (!res || typeof res !== 'object') return fail(null, 'No response from server');
    const data = res?.data;
    if (data == null || (typeof data === 'object' && !Array.isArray(data) && Object.keys(data as object).length === 0)) {
      return { success: false, message: 'Invalid server response', meta, timestamp: now() } as ServiceError;
    }
    if ((data as Record<string, unknown>)?.['success'] === false) {
      return { success: false, message: (data as Record<string, unknown>)?.['message'] as string || 'Request failed', meta, timestamp: now() } as ServiceError;
    }
    return success(data, meta);
  } catch (error) {
    return fail(error as ApiError || {}, fallback);
  }
};

const pendingRequests = new Map<string, Promise<ServiceResult<unknown>>>();

const makeKey = (name: string, payload: Record<string, unknown> = {}): string => {
  try {
    const safePayload = { ...payload };
    (['password', 'token', 'refreshToken', 'confirmPassword'] as const).forEach((k) => delete safePayload[k]);
    return `${name}:${JSON.stringify(safePayload)}`;
  } catch { return `${name}:static`; }
};

function dedupeRequest<T>(key: string, fn: () => Promise<ServiceResult<T>>): Promise<ServiceResult<T>> {
  if (pendingRequests.has(key)) return pendingRequests.get(key) as Promise<ServiceResult<T>>;
  const promise = fn();
  pendingRequests.set(key, promise as Promise<ServiceResult<unknown>>);
  promise.finally(() => { pendingRequests.delete(key); });
  return promise;
}

const safeParse = (v: string | null): unknown => { try { return v ? JSON.parse(v) : null; } catch { return null; } };

const updateStoredUser = (updater: (u: Record<string, unknown>) => Record<string, unknown>): void => {
  try {
    const raw = localStorage.getItem('jobfast_user');
    if (!raw) return;
    const user = safeParse(raw) as Record<string, unknown>;
    if (!user) return;
    const updated = updater(user);
    if (!updated) return;
    localStorage.setItem('jobfast_user', JSON.stringify(updated));
  } catch {}
};

export const login = (credentials: Record<string, unknown>) =>
  dedupeRequest(
    makeKey('login', { email: credentials['email'] as string }),
    () => request(() => API.post('/auth/login', credentials), 'Login failed.')
  );

export const register = (userData: Record<string, unknown>) =>
  dedupeRequest(
    makeKey('register', { email: userData['email'] as string }),
    () => request(() => API.post('/auth/register', userData), 'Registration failed.')
  );

export const getCurrentUser = () =>
  request(() => API.get('/auth/me'), 'Unable to fetch user profile.');

export const validateToken = () =>
  request(() => API.get('/auth/validate'), 'Token validation failed.');

export const refreshSession = async () => {
  const result = await request(() => API.post('/auth/refresh'), 'Unable to refresh session.');
  if (result.success) {
    const data = result.data as Record<string, unknown>;
    if (data?.['token']) {
      updateStoredUser((u) => ({
        ...u,
        token:        data['token'],
        refreshToken: data['refreshToken'] || u['refreshToken'],
      }));
    }
  }
  return result;
};

export const authHealthCheck = () =>
  request(() => API.get('/auth/health'), 'Auth service unavailable.');

export const logoutRequest = () =>
  request(() => API.post('/auth/logout'), 'Logout failed.');