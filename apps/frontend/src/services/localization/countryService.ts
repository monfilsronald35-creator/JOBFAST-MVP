import { supabase } from '../../lib/supabase';
import type { Country, CountryStatus } from '../../types/countries';

type CountryRow = {
  id: string;

  iso2: string;
  iso3: string;
  country_code: string;

  name: string;
  native_name: string | null;

  phone_code: string | null;
  phone_format: string | null;

  continent: string | null;
  region: string | null;
  subregion: string | null;

  default_language: string | null;
  default_currency: string | null;

  timezone: string;
  locale: string | null;

  is_supported: boolean;
  is_active: boolean;

  status: CountryStatus;

  flag_emoji: string | null;

  created_at: string;
  updated_at: string;

  deleted_at: string | null;

  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
};

function mapCountry(row: CountryRow): Country {
  return {
    id: row.id,

    iso2: row.iso2,
    iso3: row.iso3,
    countryCode: row.country_code,

    name: row.name,
    nativeName: row.native_name,

    phoneCode: row.phone_code,
    phoneFormat: row.phone_format,

    continent: row.continent,
    region: row.region,
    subregion: row.subregion,

    defaultLanguage: row.default_language,
    defaultCurrency: row.default_currency,

    timezone: row.timezone,
    locale: row.locale,

    isSupported: row.is_supported,
    isActive: row.is_active,

    status: row.status,

    flagEmoji: row.flag_emoji,

    createdAt: row.created_at,
    updatedAt: row.updated_at,

    deletedAt: row.deleted_at,

    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedBy: row.deleted_by,
  };
}

export async function getSupportedCountries(): Promise<Country[]> {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('is_supported', true)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load supported countries: ${error.message}`
    );
  }

  return (data ?? []).map(mapCountry);
}

export async function getCountryByIso2(
  iso2: string
): Promise<Country | null> {
  const normalizedIso2 = iso2.trim().toUpperCase();

  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('iso2', normalizedIso2)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load country: ${error.message}`
    );
  }

  return data ? mapCountry(data) : null;
}

export async function getCountryByCode(
  countryCode: string
): Promise<Country | null> {
  const normalizedCode = countryCode.trim().toUpperCase();

  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('country_code', normalizedCode)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load country by code: ${error.message}`
    );
  }

  return data ? mapCountry(data) : null;
}
