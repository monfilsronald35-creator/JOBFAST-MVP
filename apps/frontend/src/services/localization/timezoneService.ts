import { supabase } from '../../lib/supabase';
import type {
  Timezone,
  DstRule,
  WorkingDay,
  BusinessHours,
  Holiday,
  HolidayScope,
  HolidayType,
} from '../../types/timezone';

// ─── Row Types ────────────────────────────────────────────────────────────────

type TimezoneRow = {
  id: string;
  zone_name: string;
  country_id: string | null;
  country_code: string | null;
  abbreviation: string;
  utc_offset: string;
  utc_offset_string: string;
  utc_offset_minutes: number;
  iana_version: string;
  dst_observed: boolean;
  raw_offset_seconds: number;
  dst_offset_seconds: number;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  search_vector: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_ip: string | null;
  updated_ip: string | null;
  created_device: string | null;
  updated_device: string | null;
  created_at: string;
  updated_at: string;
};

type DstRuleRow = {
  id: string;
  timezone_id: string;
  year: number;
  dst_start_utc: string;
  dst_end_utc: string;
  offset_applied_seconds: number;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type WorkingDayRow = {
  id: string;
  country_id: string | null;
  entity_id: string | null;
  day_of_week: number;
  is_working_day: boolean;
  is_half_day: boolean;
  half_day_start: string | null;
  half_day_end: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type BusinessHoursRow = {
  id: string;
  country_id: string | null;
  entity_id: string | null;
  timezone_id: string | null;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_24_hours: boolean;
  crosses_midnight: boolean;
  is_closed: boolean;
  break_start: string | null;
  break_end: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type HolidayRow = {
  id: string;
  country_id: string;
  name: string;
  local_name: string | null;
  holiday_date: string;
  holiday_scope: HolidayScope;
  holiday_type: HolidayType;
  is_recurring_annually: boolean;
  is_working_holiday: boolean;
  is_bank_closed: boolean;
  is_government_closed: boolean;
  is_school_closed: boolean;
  description: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  search_vector: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapTimezone(row: TimezoneRow): Timezone {
  return {
    id:               row.id,
    zoneName:         row.zone_name,
    countryId:        row.country_id,
    countryCode:      row.country_code,
    abbreviation:     row.abbreviation,
    utcOffset:        row.utc_offset,
    utcOffsetString:  row.utc_offset_string,
    utcOffsetMinutes: row.utc_offset_minutes,
    ianaVersion:      row.iana_version,
    dstObserved:      row.dst_observed,
    rawOffsetSeconds: row.raw_offset_seconds,
    dstOffsetSeconds: row.dst_offset_seconds,
    isActive:         row.is_active,
    isDeleted:        row.is_deleted,
    deletedAt:        row.deleted_at,
    deletedReason:    row.deleted_reason,
    version:          row.version,
    metadata:         row.metadata,
    searchVector:     row.search_vector,
    createdBy:        row.created_by,
    updatedBy:        row.updated_by,
    deletedBy:        row.deleted_by,
    createdIp:        row.created_ip,
    updatedIp:        row.updated_ip,
    createdDevice:    row.created_device,
    updatedDevice:    row.updated_device,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  };
}

function mapDstRule(row: DstRuleRow): DstRule {
  return {
    id:                   row.id,
    timezoneId:           row.timezone_id,
    year:                 row.year,
    dstStartUtc:          row.dst_start_utc,
    dstEndUtc:            row.dst_end_utc,
    offsetAppliedSeconds: row.offset_applied_seconds,
    isDeleted:            row.is_deleted,
    deletedAt:            row.deleted_at,
    deletedReason:        row.deleted_reason,
    version:              row.version,
    metadata:             row.metadata,
    createdBy:            row.created_by,
    updatedBy:            row.updated_by,
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
  };
}

function mapWorkingDay(row: WorkingDayRow): WorkingDay {
  return {
    id:           row.id,
    countryId:    row.country_id,
    entityId:     row.entity_id,
    dayOfWeek:    row.day_of_week,
    isWorkingDay: row.is_working_day,
    isHalfDay:    row.is_half_day,
    halfDayStart: row.half_day_start,
    halfDayEnd:   row.half_day_end,
    isDeleted:    row.is_deleted,
    deletedAt:    row.deleted_at,
    deletedReason: row.deleted_reason,
    version:      row.version,
    metadata:     row.metadata,
    createdBy:    row.created_by,
    updatedBy:    row.updated_by,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
}

function mapBusinessHours(row: BusinessHoursRow): BusinessHours {
  return {
    id:             row.id,
    countryId:      row.country_id,
    entityId:       row.entity_id,
    timezoneId:     row.timezone_id,
    dayOfWeek:      row.day_of_week,
    opensAt:        row.opens_at,
    closesAt:       row.closes_at,
    is24Hours:      row.is_24_hours,
    crossesMidnight: row.crosses_midnight,
    isClosed:       row.is_closed,
    breakStart:     row.break_start,
    breakEnd:       row.break_end,
    isDeleted:      row.is_deleted,
    deletedAt:      row.deleted_at,
    deletedReason:  row.deleted_reason,
    version:        row.version,
    metadata:       row.metadata,
    createdBy:      row.created_by,
    updatedBy:      row.updated_by,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

function mapHoliday(row: HolidayRow): Holiday {
  return {
    id:                  row.id,
    countryId:           row.country_id,
    name:                row.name,
    localName:           row.local_name,
    holidayDate:         row.holiday_date,
    holidayScope:        row.holiday_scope,
    holidayType:         row.holiday_type,
    isRecurringAnnually: row.is_recurring_annually,
    isWorkingHoliday:    row.is_working_holiday,
    isBankClosed:        row.is_bank_closed,
    isGovernmentClosed:  row.is_government_closed,
    isSchoolClosed:      row.is_school_closed,
    description:         row.description,
    isDeleted:           row.is_deleted,
    deletedAt:           row.deleted_at,
    deletedReason:       row.deleted_reason,
    version:             row.version,
    metadata:            row.metadata,
    searchVector:        row.search_vector,
    createdBy:           row.created_by,
    updatedBy:           row.updated_by,
    deletedBy:           row.deleted_by,
    createdAt:           row.created_at,
    updatedAt:           row.updated_at,
  };
}

// ─── Timezones ────────────────────────────────────────────────────────────────

export async function getTimezones(): Promise<Timezone[]> {
  const { data, error } = await supabase
    .from('timezones')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('utc_offset_minutes', { ascending: true });

  if (error) throw new Error(`Failed to load timezones: ${error.message}`);
  return (data ?? []).map((row) => mapTimezone(row as TimezoneRow));
}

export async function getTimezonesByCountry(countryId: string): Promise<Timezone[]> {
  const { data, error } = await supabase
    .from('timezones')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('utc_offset_minutes', { ascending: true });

  if (error) throw new Error(`Failed to load timezones: ${error.message}`);
  return (data ?? []).map((row) => mapTimezone(row as TimezoneRow));
}

export async function getTimezoneByZoneName(zoneName: string): Promise<Timezone | null> {
  const { data, error } = await supabase
    .from('timezones')
    .select('*')
    .eq('zone_name', zoneName)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load timezone: ${error.message}`);
  if (!data) return null;
  return mapTimezone(data as TimezoneRow);
}

export async function searchTimezones(query: string): Promise<Timezone[]> {
  const { data, error } = await supabase
    .from('timezones')
    .select('*')
    .eq('is_deleted', false)
    .textSearch('search_vector', query, { type: 'plain' })
    .order('utc_offset_minutes', { ascending: true });

  if (error) throw new Error(`Failed to search timezones: ${error.message}`);
  return (data ?? []).map((row) => mapTimezone(row as TimezoneRow));
}

// ─── DST Rules ────────────────────────────────────────────────────────────────

export async function getDstRules(timezoneId: string): Promise<DstRule[]> {
  const { data, error } = await supabase
    .from('dst_rules')
    .select('*')
    .eq('timezone_id', timezoneId)
    .eq('is_deleted', false)
    .order('year', { ascending: false });

  if (error) throw new Error(`Failed to load DST rules: ${error.message}`);
  return (data ?? []).map((row) => mapDstRule(row as DstRuleRow));
}

export async function getDstRuleForYear(timezoneId: string, year: number): Promise<DstRule | null> {
  const { data, error } = await supabase
    .from('dst_rules')
    .select('*')
    .eq('timezone_id', timezoneId)
    .eq('year', year)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load DST rule: ${error.message}`);
  if (!data) return null;
  return mapDstRule(data as DstRuleRow);
}

// ─── Working Days ─────────────────────────────────────────────────────────────

export async function getWorkingDaysByCountry(countryId: string): Promise<WorkingDay[]> {
  const { data, error } = await supabase
    .from('working_days')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .order('day_of_week', { ascending: true });

  if (error) throw new Error(`Failed to load working days: ${error.message}`);
  return (data ?? []).map((row) => mapWorkingDay(row as WorkingDayRow));
}

export async function getWorkingDaysByEntity(entityId: string): Promise<WorkingDay[]> {
  const { data, error } = await supabase
    .from('working_days')
    .select('*')
    .eq('entity_id', entityId)
    .eq('is_deleted', false)
    .order('day_of_week', { ascending: true });

  if (error) throw new Error(`Failed to load working days: ${error.message}`);
  return (data ?? []).map((row) => mapWorkingDay(row as WorkingDayRow));
}

// ─── Business Hours ───────────────────────────────────────────────────────────

export async function getBusinessHoursByCountry(countryId: string): Promise<BusinessHours[]> {
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .order('day_of_week', { ascending: true });

  if (error) throw new Error(`Failed to load business hours: ${error.message}`);
  return (data ?? []).map((row) => mapBusinessHours(row as BusinessHoursRow));
}

export async function getBusinessHoursByEntity(entityId: string): Promise<BusinessHours[]> {
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .eq('entity_id', entityId)
    .eq('is_deleted', false)
    .order('day_of_week', { ascending: true });

  if (error) throw new Error(`Failed to load business hours: ${error.message}`);
  return (data ?? []).map((row) => mapBusinessHours(row as BusinessHoursRow));
}

// ─── Holidays ─────────────────────────────────────────────────────────────────

export async function getHolidaysByCountry(
  countryId: string,
  year?: number
): Promise<Holiday[]> {
  let query = supabase
    .from('holidays')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false);

  if (year !== undefined) {
    const start = `${year}-01-01`;
    const end   = `${year}-12-31`;
    query = query.gte('holiday_date', start).lte('holiday_date', end);
  }

  const { data, error } = await query.order('holiday_date', { ascending: true });

  if (error) throw new Error(`Failed to load holidays: ${error.message}`);
  return (data ?? []).map((row) => mapHoliday(row as HolidayRow));
}

export async function getHolidaysByScope(
  countryId: string,
  scope: HolidayScope
): Promise<Holiday[]> {
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .eq('country_id', countryId)
    .eq('holiday_scope', scope)
    .eq('is_deleted', false)
    .order('holiday_date', { ascending: true });

  if (error) throw new Error(`Failed to load holidays: ${error.message}`);
  return (data ?? []).map((row) => mapHoliday(row as HolidayRow));
}

export async function searchHolidays(
  countryId: string,
  query: string
): Promise<Holiday[]> {
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .textSearch('search_vector', query, { type: 'plain' })
    .order('holiday_date', { ascending: true });

  if (error) throw new Error(`Failed to search holidays: ${error.message}`);
  return (data ?? []).map((row) => mapHoliday(row as HolidayRow));
}
