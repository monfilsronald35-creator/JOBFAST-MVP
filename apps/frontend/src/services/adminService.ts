const API_URL = (import.meta.env['VITE_API_URL'] || 'http://localhost:5000').replace(/\/api\/v1$/, '');
const WS_URL  = API_URL.replace(/^http/, 'ws');

const STORAGE_KEY = 'jobfast_user';

interface StoredUser { token?: string; refreshToken?: string; user?: { id?: string; role?: string; }; }

const _getStored = (): StoredUser | null => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as StoredUser; } catch { return null; }
};

const getAccessToken  = (): string => _getStored()?.token || '';
const getRefreshToken = (): string => _getStored()?.refreshToken || '';
const getUser         = (): StoredUser['user'] | null => _getStored()?.user || null;

export const assertAdmin = (user = getUser()): true => {
  if (!user) throw new Error('Unauthorized');
  if (!['admin', 'super_admin'].includes(user.role ?? '')) throw new Error('Admin access required');
  return true;
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error('Refresh failed');

  const data = await res.json() as { token?: string; accessToken?: string };
  const newToken = data.token || data.accessToken;
  if (!newToken) throw new Error('No token in refresh response');

  const stored = _getStored();
  if (stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, token: newToken }));
  }

  return newToken;
};

interface RequestOptions {
  method?:  string;
  headers?: Record<string, string>;
  body?:    string;
}

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const request = async <T = unknown>(endpoint: string, options: RequestOptions = {}, retry = 2): Promise<T> => {
  try {
    const token = getAccessToken();
    const res   = await fetch(`${API_URL}${endpoint}`, {
      method:      options.method || 'GET',
      headers:     { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
      credentials: 'include',
      body:        options.body,
    });

    if (res.status === 401) {
      await refreshAccessToken();
      if (retry > 0) return request<T>(endpoint, options, retry - 1);
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({} as { message?: string })) as { message?: string };
      throw new Error(err.message || 'Request failed');
    }

    return await res.json() as T;
  } catch (err) {
    if (retry > 0) {
      await delay(300 * (3 - retry));
      return request<T>(endpoint, options, retry - 1);
    }
    console.error('[ADMIN SERVICE ERROR]', (err as Error).message);
    throw err;
  }
};

export const logAdminAction = (action: string, data: Record<string, unknown> = {}) =>
  request('/admin/logs', {
    method: 'POST',
    body:   JSON.stringify({ action, data, adminId: getUser()?.id, timestamp: new Date().toISOString() }),
  });

export const banUser = async (userId: string, reason = 'No reason') => {
  const res = await request(`/admin/users/${userId}/ban`, { method: 'PATCH', body: JSON.stringify({ reason }) });
  await logAdminAction('BAN_USER', { userId, reason });
  return res;
};

export const unbanUser = async (userId: string) => {
  const res = await request(`/admin/users/${userId}/unban`, { method: 'PATCH' });
  await logAdminAction('UNBAN_USER', { userId });
  return res;
};

export const changeUserRole = async (userId: string, role: string) => {
  if (!['user', 'moderator', 'admin'].includes(role)) throw new Error('Invalid role');
  const res = await request(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
  await logAdminAction('CHANGE_ROLE', { userId, role });
  return res;
};

export const deleteUser = async (userId: string) => {
  const res = await request(`/admin/users/${userId}`, { method: 'DELETE' });
  await logAdminAction('DELETE_USER', { userId });
  return res;
};

export const moderateContent = (payload: Record<string, unknown>) =>
  request('/admin/ai/moderate', { method: 'POST', body: JSON.stringify({ ...payload, model: 'ultra-ai-v3' }) });

export const aiSummarizeUser = (userId: string) =>
  request(`/admin/ai/users/${userId}/summary`, { method: 'POST' });

export const aiReviewLogs = (logId: string) =>
  request(`/admin/ai/logs/${logId}/review`, { method: 'POST' });

export const getAnalyticsOverview = (range = '30d') =>
  request(`/admin/analytics/overview?range=${range}`);

export const getUserGrowth = (range = '30d') =>
  request(`/admin/analytics/growth?range=${range}`);

export const getBanStats = (range = '30d') =>
  request(`/admin/analytics/bans?range=${range}`);

export const getAuditLogs = (filters: Record<string, string> = {}) =>
  request(`/admin/logs?${new URLSearchParams(filters)}`);

export interface AdminSocketHandle {
  socket: WebSocket;
  send:   (data: unknown) => void;
  close:  () => void;
}

export const connectAdminSocket = (
  onEvent:  (data: unknown) => void,
  onStatus: (status: string) => void
): AdminSocketHandle => {
  const socket = new WebSocket(`${WS_URL}?token=${getAccessToken()}`);

  socket.onopen    = () => onStatus?.('connected');
  socket.onclose   = () => onStatus?.('disconnected');
  socket.onerror   = () => onStatus?.('error');
  socket.onmessage = (event: MessageEvent<string>) => {
    try { onEvent?.(JSON.parse(event.data) as unknown); }
    catch { onEvent?.(event.data); }
  };

  return {
    socket,
    send:  (data) => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)); },
    close: () => socket.close(),
  };
};

const adminService = {
  banUser, unbanUser, changeUserRole, deleteUser,
  getUser:     (id: string) => request(`/admin/users/${id}`),
  getAllUsers:  (filters: Record<string, string> = {}) => request(`/admin/users?${new URLSearchParams(filters)}`),
  logAdminAction, moderateContent, aiSummarizeUser, aiReviewLogs,
  getAnalyticsOverview, getUserGrowth, getBanStats, getAuditLogs,
  connectAdminSocket, assertAdmin,
};

export default adminService;