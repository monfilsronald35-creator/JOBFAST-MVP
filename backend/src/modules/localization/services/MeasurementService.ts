import { db } from '../../../core/database/SupabaseClient.js';
import type {
  MeasurementSystem,
  MeasurementUnit,
  CountryMeasurementPreference,
} from '../types/localization.types.js';

let _systemsCache:   MeasurementSystem[]   | null = null;
let _unitsCache:     MeasurementUnit[]      | null = null;
let _cacheExpiry:    number                        = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const MeasurementService = {
  async listSystems(): Promise<MeasurementSystem[]> {
    if (_systemsCache && Date.now() < _cacheExpiry) return _systemsCache;
    const { data, error } = await db.client()
      .from('measurement_systems')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('code');
    if (error) throw error;
    _systemsCache = (data ?? []) as MeasurementSystem[];
    _cacheExpiry  = Date.now() + CACHE_TTL_MS;
    return _systemsCache;
  },

  async listUnits(opts: { category?: string; systemId?: string } = {}): Promise<MeasurementUnit[]> {
    if (!opts.category && !opts.systemId && _unitsCache && Date.now() < _cacheExpiry) {
      return _unitsCache;
    }

    let q = db.client()
      .from('measurement_units')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('category')
      .order('name');

    if (opts.category) q = q.eq('category', opts.category);
    if (opts.systemId) q = q.eq('measurement_system_id', opts.systemId);

    const { data, error } = await q;
    if (error) throw error;

    const result = (data ?? []) as MeasurementUnit[];
    if (!opts.category && !opts.systemId) {
      _unitsCache  = result;
      _cacheExpiry = Date.now() + CACHE_TTL_MS;
    }
    return result;
  },

  async getUnit(id: string): Promise<MeasurementUnit | null> {
    const { data, error } = await db.client()
      .from('measurement_units')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();
    if (error) throw error;
    return data as MeasurementUnit | null;
  },

  async getCountryPreferences(countryId: string): Promise<CountryMeasurementPreference[]> {
    const { data, error } = await db.client()
      .from('country_measurement_preferences')
      .select('*')
      .eq('country_id', countryId)
      .eq('is_deleted', false)
      .order('is_default', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CountryMeasurementPreference[];
  },

  convert(value: number, from: MeasurementUnit, to: MeasurementUnit): number {
    if (from.dimension_type !== to.dimension_type) {
      throw new Error(`Cannot convert ${from.dimension_type} to ${to.dimension_type}`);
    }
    const fromFactor = parseFloat(from.conversion_factor_to_base);
    const fromOffset = parseFloat(from.base_offset);
    const toFactor   = parseFloat(to.conversion_factor_to_base);
    const toOffset   = parseFloat(to.base_offset);

    // Convert to base then to target
    const baseValue = value * fromFactor + fromOffset;
    return (baseValue - toOffset) / toFactor;
  },
};
