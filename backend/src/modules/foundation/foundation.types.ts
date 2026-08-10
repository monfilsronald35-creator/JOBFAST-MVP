export const FEATURE_STATUSES = [
  'active',
  'inactive',
  'beta',
  'deprecated',
] as const;

export type FeatureStatus = (typeof FEATURE_STATUSES)[number];


export const AUDIT_ACTION_TYPES = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'CUSTOM',
] as const;

export type AuditActionType = (typeof AUDIT_ACTION_TYPES)[number];


export const ENVIRONMENT_TYPES = [
  'production',
  'staging',
  'development',
  'testing',
] as const;

export type EnvironmentType = (typeof ENVIRONMENT_TYPES)[number];


export interface SchemaMigration {
  version:      string;
  executed_at:  string;
  description:  string | null;
}
