/**
 * RbacEngine — Client-side permission check cache.
 * Permissions authoritative on server; this avoids redundant API calls for UI rendering.
 */

import type { PermissionResource, PermissionAction } from '../types';

interface PermissionSet {
  resource: PermissionResource;
  actions:  PermissionAction[];
  scope:    'all' | 'own' | 'team' | 'department';
}

interface UserPermissions {
  orgId:   string;
  roleId:  string;
  perms:   PermissionSet[];
  loadedAt: number;
}

const TTL = 5 * 60_000;
const _cache = new Map<string, UserPermissions>();

function cacheKey(userId: string, orgId: string): string { return `${userId}:${orgId}`; }

function getAuth(): string {
  try {
    const u = JSON.parse(localStorage.getItem('jobfast_user') ?? '{}') as { token?: string };
    return u.token ? `Bearer ${u.token}` : '';
  } catch { return ''; }
}

export const RbacEngine = {
  async loadPermissions(userId: string, orgId: string): Promise<UserPermissions> {
    const key = cacheKey(userId, orgId);
    const cached = _cache.get(key);
    if (cached && Date.now() - cached.loadedAt < TTL) return cached;

    const res = await fetch(`/api/organizations/${orgId}/permissions/me`, {
      headers: { Authorization: getAuth() },
    });
    if (!res.ok) throw new Error(`Cannot load permissions: HTTP ${res.status}`);
    const data = await res.json() as UserPermissions;
    data.loadedAt = Date.now();
    _cache.set(key, data);
    return data;
  },

  can(
    userId:   string,
    orgId:    string,
    resource: PermissionResource,
    action:   PermissionAction,
  ): boolean {
    const up = _cache.get(cacheKey(userId, orgId));
    if (!up) return false;
    return up.perms.some(p => p.resource === resource && p.actions.includes(action));
  },

  canAny(
    userId:   string,
    orgId:    string,
    resource: PermissionResource,
    actions:  PermissionAction[],
  ): boolean {
    return actions.some(a => this.can(userId, orgId, resource, a));
  },

  getScope(
    userId:   string,
    orgId:    string,
    resource: PermissionResource,
    action:   PermissionAction,
  ): PermissionSet['scope'] | null {
    const up = _cache.get(cacheKey(userId, orgId));
    if (!up) return null;
    const p = up.perms.find(p => p.resource === resource && p.actions.includes(action));
    return p?.scope ?? null;
  },

  invalidate(userId: string, orgId: string): void {
    _cache.delete(cacheKey(userId, orgId));
  },

  invalidateAll(): void {
    _cache.clear();
  },
};