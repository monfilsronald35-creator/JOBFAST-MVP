import { supabase } from '../../lib/supabase';
import type {
  AuditLog,
  VwActiveCountryEmploymentSummary,
  MvGlobalSearchIndex,
} from '../../types/audit';

// ---- Row types (snake_case) ----

type AuditLogRow = {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  performed_by: string | null;
  client_ip: string | null;
  client_device: string | null;
  created_at: string;
};

type VwCountryEmploymentRow = {
  country_id: string;
  country_code: string;
  country_name: string;
  country_settings_id: string | null;
  standard_weekly_hours: number | null;
  minimum_wage_amount: number | null;
  currency_code: string | null;
  mandatory_paid_vacation_days: number | null;
  mandatory_sick_leave_days: number | null;
  language_code: string | null;
  nlp_model_flavor: string | null;
};

type MvGlobalSearchRow = {
  country_category_id: string;
  country_id: string;
  category_name: string;
  category_slug: string;
  country_industry_id: string;
  industry_name: string;
  industry_slug: string;
  combined_search_vector: string | null;
};

// ---- Mappers ----

function mapAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    tableName: row.table_name,
    recordId: row.record_id,
    action: row.action,
    oldData: row.old_data,
    newData: row.new_data,
    performedBy: row.performed_by,
    clientIp: row.client_ip,
    clientDevice: row.client_device,
    createdAt: row.created_at,
  };
}

function mapVwEmploymentSummary(row: VwCountryEmploymentRow): VwActiveCountryEmploymentSummary {
  return {
    countryId: row.country_id,
    countryCode: row.country_code,
    countryName: row.country_name,
    countrySettingsId: row.country_settings_id,
    standardWeeklyHours: row.standard_weekly_hours,
    minimumWageAmount: row.minimum_wage_amount,
    currencyCode: row.currency_code,
    mandatoryPaidVacationDays: row.mandatory_paid_vacation_days,
    mandatorySickLeaveDays: row.mandatory_sick_leave_days,
    languageCode: row.language_code,
    nlpModelFlavor: row.nlp_model_flavor,
  };
}

function mapMvGlobalSearch(row: MvGlobalSearchRow): MvGlobalSearchIndex {
  return {
    countryCategoryId: row.country_category_id,
    countryId: row.country_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    countryIndustryId: row.country_industry_id,
    industryName: row.industry_name,
    industrySlug: row.industry_slug,
    combinedSearchVector: row.combined_search_vector,
  };
}

// ---- audit_logs queries ----

export async function getMyAuditLogs(limit = 50): Promise<AuditLog[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('performed_by', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as AuditLogRow[]).map(mapAuditLog);
}

export async function getAuditLogsByRecord(
  tableName: string,
  recordId: string
): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as AuditLogRow[]).map(mapAuditLog);
}

// ---- vw_active_country_employment_summary queries ----

export async function getCountryEmploymentSummary(
  countryId?: string
): Promise<VwActiveCountryEmploymentSummary[]> {
  let query = supabase
    .from('vw_active_country_employment_summary')
    .select('*');

  if (countryId) {
    query = query.eq('country_id', countryId);
  }

  const { data, error } = await query.order('country_name', { ascending: true });
  if (error) throw error;
  return (data as VwCountryEmploymentRow[]).map(mapVwEmploymentSummary);
}

// ---- mv_global_search_index queries ----

export async function searchGlobalIndex(
  query: string,
  countryId?: string
): Promise<MvGlobalSearchIndex[]> {
  let q = supabase
    .from('mv_global_search_index')
    .select('country_category_id, country_id, category_name, category_slug, country_industry_id, industry_name, industry_slug')
    .textSearch('combined_search_vector', query, { type: 'plain' });

  if (countryId) {
    q = q.eq('country_id', countryId);
  }

  const { data, error } = await q.limit(50);
  if (error) throw error;
  return (data as MvGlobalSearchRow[]).map(mapMvGlobalSearch);
}

export async function getGlobalSearchByCountry(
  countryId: string
): Promise<MvGlobalSearchIndex[]> {
  const { data, error } = await supabase
    .from('mv_global_search_index')
    .select('country_category_id, country_id, category_name, category_slug, country_industry_id, industry_name, industry_slug')
    .eq('country_id', countryId)
    .order('category_name', { ascending: true });

  if (error) throw error;
  return (data as MvGlobalSearchRow[]).map(mapMvGlobalSearch);
}
