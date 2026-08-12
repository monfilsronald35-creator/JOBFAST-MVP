import { apiClient } from '../../lib/apiClient.js';

export const BASE = '/localization';

export function locGet<T>(path: string, token?: string | null): Promise<{ success: boolean; data: T }> {
  return apiClient<{ success: boolean; data: T }>(`${BASE}${path}`, { token });
}

export function locPost<T>(path: string, body: unknown, token?: string | null): Promise<{ success: boolean; data: T }> {
  return apiClient<{ success: boolean; data: T }>(`${BASE}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export function locPut<T>(path: string, body: unknown, token: string): Promise<{ success: boolean; data: T }> {
  return apiClient<{ success: boolean; data: T }>(`${BASE}${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    token,
  });
}
