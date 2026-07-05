// ============================================================
// usePermission — single hook for all role-based decisions.
//
// Import this in components instead of importing roleConfig
// directly. Keeps role logic out of UI components entirely.
//
// Usage:
//   const { can, canSeeWidget, isAdmin, role } = usePermission();
//   if (can('create', 'job')) { ... }
//   if (canSeeWidget('active_jobs')) { ... }
// ============================================================

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  getRoleConfig,
  getRolePermissions,
  getRoleVisibility,
  getRoleSearchBehavior,
  getRoleDefaultPath,
  hasPermission,
  isWidgetVisible,
  isCategoryVisible,
  isEmployerRole,
} from "@/config/roleConfig";

export function usePermission() {
  const { user } = useAuth();
  const role = user?.role ?? "worker";

  return useMemo(() => {
    const vis = getRoleVisibility(role);

    return {
      // ── Role identity ──────────────────────────────────────
      role,
      roleConfig:     getRoleConfig(role),
      searchBehavior: getRoleSearchBehavior(role),
      defaultPath:    getRoleDefaultPath(role),

      // ── Permission checks ──────────────────────────────────
      // can(action, resource) — generic check against the matrix
      can:         (action, resource) => hasPermission(role, action, resource),
      canRead:     (resource) => hasPermission(role, "read",     resource),
      canCreate:   (resource) => hasPermission(role, "create",   resource),
      canUpdate:   (resource) => hasPermission(role, "update",   resource),
      canDelete:   (resource) => hasPermission(role, "delete",   resource),
      canApprove:  (resource) => hasPermission(role, "approve",  resource),
      canReject:   (resource) => hasPermission(role, "reject",   resource),
      canModerate: (resource) => hasPermission(role, "moderate", resource),
      canSuspend:  (resource) => hasPermission(role, "suspend",  resource),

      // ── Visibility checks ──────────────────────────────────
      canSeeWidget:   (widgetId)   => isWidgetVisible(role, widgetId),
      canSeeCategory: (categoryId) => isCategoryVisible(role, categoryId),
      canSeeReport:   (reportId)   =>
        vis.reports.includes("*")         || vis.reports.includes(reportId),
      canSeeAnalytic: (analyticId) =>
        vis.analytics.includes("*")       || vis.analytics.includes(analyticId),
      canSeeSection:  (sectionId)  =>
        vis.profileSections.includes("*") || vis.profileSections.includes(sectionId),

      // ── Role type flags ────────────────────────────────────
      isAdmin:      role === "admin" || role === "super_admin",
      isSuperAdmin: role === "super_admin",
      isWorker:     !isEmployerRole(role),
      isEmployer:   isEmployerRole(role),

      // ── Raw objects (advanced use only) ───────────────────
      permissions: getRolePermissions(role),
      visibility:  vis,
    };
  }, [role]);
}