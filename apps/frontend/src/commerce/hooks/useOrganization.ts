import { useState, useCallback } from 'react';
import type { Organization } from '../types';
import { OrgService }  from '../organization/OrgService';
import { RbacEngine }  from '../organization/RbacEngine';
import { AuditLogger } from '../organization/AuditLogger';

export function useOrganization(userId?: string) {
  const [orgs,    setOrgs]    = useState<Organization[]>([]);
  const [current, setCurrent] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const loadMyOrgs = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const list = await OrgService.getMyOrgs();
      setOrgs(list);
      if (list.length > 0 && !current) setCurrent(list[0] ?? null);
      return list;
    } catch (e) {
      setError((e as Error).message); return [];
    } finally {
      setLoading(false);
    }
  }, [current]);

  const create = useCallback(async (
    data: Parameters<typeof OrgService.create>[0],
  ): Promise<Organization | null> => {
    setLoading(true); setError(null);
    try {
      const org = await OrgService.create(data);
      setOrgs(prev => [...prev, org]);
      setCurrent(org);
      return org;
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const switchOrg = useCallback(async (orgId: string) => {
    const org = orgs.find(o => o.id === orgId);
    if (org) { setCurrent(org); return org; }
    setLoading(true);
    try {
      const o = await OrgService.get(orgId);
      setCurrent(o);
      return o;
    } catch (e) {
      setError((e as Error).message); return null;
    } finally {
      setLoading(false);
    }
  }, [orgs]);

  const can = useCallback((resource: Parameters<typeof RbacEngine.can>[2], action: Parameters<typeof RbacEngine.can>[3]): boolean => {
    if (!userId || !current) return false;
    return RbacEngine.can(userId, current.id, resource, action);
  }, [userId, current]);

  const loadPerms = useCallback(async () => {
    if (!userId || !current) return;
    await RbacEngine.loadPermissions(userId, current.id).catch(() => { /* non-fatal */ });
  }, [userId, current]);

  return {
    orgs, current, loading, error,
    loadMyOrgs, create, switchOrg,
    can, loadPerms,
    AuditLogger,
  };
}