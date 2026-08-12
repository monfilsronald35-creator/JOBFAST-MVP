export const AUDIT_ACTIONS = ['INSERT', 'UPDATE', 'DELETE'] as const;

export type AuditAction = typeof AUDIT_ACTIONS[number];

export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: AuditAction;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  performedBy: string | null;
  clientIp: string | null;
  clientDevice: string | null;
  createdAt: string;
}

export interface VwActiveCountryEmploymentSummary {
  countryId: string;
  countryCode: string;
  countryName: string;
  countrySettingsId: string | null;
  standardWeeklyHours: number | null;
  minimumWageAmount: number | null;
  currencyCode: string | null;
  mandatoryPaidVacationDays: number | null;
  mandatorySickLeaveDays: number | null;
  languageCode: string | null;
  nlpModelFlavor: string | null;
}

export interface MvGlobalSearchIndex {
  countryCategoryId: string;
  countryId: string;
  categoryName: string;
  categorySlug: string;
  countryIndustryId: string;
  industryName: string;
  industrySlug: string;
  combinedSearchVector: string | null;
}
