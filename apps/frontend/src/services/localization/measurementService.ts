import { supabase } from '../../lib/supabase';
import type {
  MeasurementSystem,
  MeasurementUnit,
  CountryMeasurementPreference,
  MeasurementCategory,
} from '../../types/measurement';

// ─── Row Types ────────────────────────────────────────────────────────────────

type MeasurementSystemRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
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

type MeasurementUnitRow = {
  id: string;
  measurement_system_id: string | null;
  code: string;
  name: string;
  symbol: string;
  category: MeasurementCategory;
  dimension_type: string;
  conversion_factor_to_base: number;
  base_offset: number;
  precision_digits: number;
  is_base_unit: boolean;
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
  created_at: string;
  updated_at: string;
};

type CountryMeasurementPreferenceRow = {
  id: string;
  country_id: string;
  measurement_system_id: string;
  distance_unit_id: string | null;
  weight_unit_id: string | null;
  temperature_unit_id: string | null;
  volume_unit_id: string | null;
  is_default: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapMeasurementSystem(row: MeasurementSystemRow): MeasurementSystem {
  return {
    id:            row.id,
    code:          row.code,
    name:          row.name,
    description:   row.description,
    isActive:      row.is_active,
    isDeleted:     row.is_deleted,
    deletedAt:     row.deleted_at,
    deletedReason: row.deleted_reason,
    version:       row.version,
    metadata:      row.metadata,
    createdBy:     row.created_by,
    updatedBy:     row.updated_by,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

function mapMeasurementUnit(row: MeasurementUnitRow): MeasurementUnit {
  return {
    id:                      row.id,
    measurementSystemId:     row.measurement_system_id,
    code:                    row.code,
    name:                    row.name,
    symbol:                  row.symbol,
    category:                row.category,
    dimensionType:           row.dimension_type,
    conversionFactorToBase:  row.conversion_factor_to_base,
    baseOffset:              row.base_offset,
    precisionDigits:         row.precision_digits,
    isBaseUnit:              row.is_base_unit,
    isActive:                row.is_active,
    isDeleted:               row.is_deleted,
    deletedAt:               row.deleted_at,
    deletedReason:           row.deleted_reason,
    version:                 row.version,
    metadata:                row.metadata,
    searchVector:            row.search_vector,
    createdBy:               row.created_by,
    updatedBy:               row.updated_by,
    deletedBy:               row.deleted_by,
    createdAt:               row.created_at,
    updatedAt:               row.updated_at,
  };
}

function mapCountryMeasurementPreference(
  row: CountryMeasurementPreferenceRow
): CountryMeasurementPreference {
  return {
    id:                  row.id,
    countryId:           row.country_id,
    measurementSystemId: row.measurement_system_id,
    distanceUnitId:      row.distance_unit_id,
    weightUnitId:        row.weight_unit_id,
    temperatureUnitId:   row.temperature_unit_id,
    volumeUnitId:        row.volume_unit_id,
    isDefault:           row.is_default,
    isDeleted:           row.is_deleted,
    deletedAt:           row.deleted_at,
    version:             row.version,
    metadata:            row.metadata,
    createdAt:           row.created_at,
    updatedAt:           row.updated_at,
  };
}

// ─── Measurement Systems ──────────────────────────────────────────────────────

export async function getMeasurementSystems(): Promise<MeasurementSystem[]> {
  const { data, error } = await supabase
    .from('measurement_systems')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load measurement systems: ${error.message}`);
  return (data ?? []).map((row) => mapMeasurementSystem(row as MeasurementSystemRow));
}

export async function getMeasurementSystemByCode(code: string): Promise<MeasurementSystem | null> {
  const { data, error } = await supabase
    .from('measurement_systems')
    .select('*')
    .eq('code', code)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load measurement system: ${error.message}`);
  if (!data) return null;
  return mapMeasurementSystem(data as MeasurementSystemRow);
}

// ─── Measurement Units ────────────────────────────────────────────────────────

export async function getMeasurementUnits(): Promise<MeasurementUnit[]> {
  const { data, error } = await supabase
    .from('measurement_units')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('category', { ascending: true });

  if (error) throw new Error(`Failed to load measurement units: ${error.message}`);
  return (data ?? []).map((row) => mapMeasurementUnit(row as MeasurementUnitRow));
}

export async function getMeasurementUnitsByCategory(
  category: MeasurementCategory
): Promise<MeasurementUnit[]> {
  const { data, error } = await supabase
    .from('measurement_units')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('is_base_unit', { ascending: false });

  if (error) throw new Error(`Failed to load measurement units: ${error.message}`);
  return (data ?? []).map((row) => mapMeasurementUnit(row as MeasurementUnitRow));
}

export async function getMeasurementUnitsBySystem(
  measurementSystemId: string
): Promise<MeasurementUnit[]> {
  const { data, error } = await supabase
    .from('measurement_units')
    .select('*')
    .eq('measurement_system_id', measurementSystemId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('category', { ascending: true });

  if (error) throw new Error(`Failed to load measurement units: ${error.message}`);
  return (data ?? []).map((row) => mapMeasurementUnit(row as MeasurementUnitRow));
}

export async function searchMeasurementUnits(query: string): Promise<MeasurementUnit[]> {
  const { data, error } = await supabase
    .from('measurement_units')
    .select('*')
    .eq('is_deleted', false)
    .textSearch('search_vector', query, { type: 'plain' })
    .order('category', { ascending: true });

  if (error) throw new Error(`Failed to search measurement units: ${error.message}`);
  return (data ?? []).map((row) => mapMeasurementUnit(row as MeasurementUnitRow));
}

// ─── Country Measurement Preferences ─────────────────────────────────────────

export async function getCountryMeasurementPreferences(
  countryId: string
): Promise<CountryMeasurementPreference[]> {
  const { data, error } = await supabase
    .from('country_measurement_preferences')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .order('is_default', { ascending: false });

  if (error) throw new Error(`Failed to load measurement preferences: ${error.message}`);
  return (data ?? []).map(
    (row) => mapCountryMeasurementPreference(row as CountryMeasurementPreferenceRow)
  );
}
