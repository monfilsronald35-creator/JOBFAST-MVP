import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getRoleConfig, getRolePermissions, getRoleVisibility,
  getRoleSearchBehavior, getRoleDefaultPath,
  hasPermission, isWidgetVisible, isCategoryVisible, isEmployerRole,
} from '@/config/roleConfig';

export function usePermission() {
  const { user } = useAuth();
  const role = (user as { role?: string } | null)?.role ?? 'worker';

  return useMemo(() => {
    const vis = getRoleVisibility(role);

    return {
      role,
      roleConfig:     getRoleConfig(role),
      searchBehavior: getRoleSearchBehavior(role),
      defaultPath:    getRoleDefaultPath(role),

      can:         (action: string, resource: string) => hasPermission(role, action, resource),
      canRead:     (resource: string) => hasPermission(role, 'read',     resource),
      canCreate:   (resource: string) => hasPermission(role, 'create',   resource),
      canUpdate:   (resource: string) => hasPermission(role, 'update',   resource),
      canDelete:   (resource: string) => hasPermission(role, 'delete',   resource),
      canApprove:  (resource: string) => hasPermission(role, 'approve',  resource),
      canReject:   (resource: string) => hasPermission(role, 'reject',   resource),
      canModerate: (resource: string) => hasPermission(role, 'moderate', resource),
      canSuspend:  (resource: string) => hasPermission(role, 'suspend',  resource),

      canSeeWidget:   (widgetId: string)   => isWidgetVisible(role, widgetId),
      canSeeCategory: (categoryId: string) => isCategoryVisible(role, categoryId),
      canSeeReport:   (reportId: string)   =>
        vis.reports.includes('*')         || vis.reports.includes(reportId),
      canSeeAnalytic: (analyticId: string) =>
        vis.analytics.includes('*')       || vis.analytics.includes(analyticId),
      canSeeSection:  (sectionId: string)  =>
        vis.profileSections.includes('*') || vis.profileSections.includes(sectionId),

      isAdmin:      role === 'admin' || role === 'super_admin',
      isSuperAdmin: role === 'super_admin',
      isWorker:     !isEmployerRole(role),
      isEmployer:   isEmployerRole(role),

      permissions: getRolePermissions(role),
      visibility:  vis,
    };
  }, [role]);
}