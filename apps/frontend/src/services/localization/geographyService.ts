import { supabase } from '../../lib/supabase';
import type {
  CountryGroup,
  Country,
  State,
  Region,
  City,
  District,
  Neighborhood,
} from '../../types/geography';

// ─── Row Types ────────────────────────────────────────────────────────────────

type CountryGroupRow = {
  id: string;
  code: string;
  name: string;
  type: string | null;
  sort_order: number;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type CountryRow = {
  id: string;
  iso_alpha2: string;
  iso_alpha3: string;
  iso_numeric: string;
  name: string;
  slug: string;
  native_name: string | null;
  capital: string | null;
  phone_code: string | null;
  currency_id: string | null;
  default_language_id: string | null;
  timezone_id: string | null;
  group_id: string | null;
  continent: string | null;
  subregion: string | null;
  emoji: string | null;
  flag_svg_url: string | null;
  flag_png_url: string | null;
  population: number | null;
  area_km2: number | null;
  internet_tld: string[] | null;
  calling_codes: string[] | null;
  is_active: boolean;
  is_supported: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  search_vector: string | null;
  created_at: string;
  updated_at: string;
};

type StateRow = {
  id: string;
  country_id: string;
  code: string;
  name: string;
  slug: string;
  native_name: string | null;
  iso_code: string | null;
  fips_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  search_vector: string | null;
  created_at: string;
  updated_at: string;
};

type RegionRow = {
  id: string;
  country_id: string;
  state_id: string | null;
  name: string;
  slug: string;
  code: string | null;
  boundary: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  search_vector: string | null;
  created_at: string;
  updated_at: string;
};

type CityRow = {
  id: string;
  country_id: string;
  state_id: string | null;
  region_id: string | null;
  name: string;
  slug: string;
  postal_code_format: string | null;
  place_type: string;
  latitude: number | null;
  longitude: number | null;
  elevation_m: number | null;
  location: string | null;
  boundary: string | null;
  population: number | null;
  timezone_id: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  search_vector: string | null;
  created_at: string;
  updated_at: string;
};

type DistrictRow = {
  id: string;
  country_id: string;
  city_id: string;
  code: string | null;
  name: string;
  boundary: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
};

type NeighborhoodRow = {
  id: string;
  country_id: string;
  city_id: string;
  district_id: string | null;
  code: string | null;
  name: string;
  boundary: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapCountryGroup(row: CountryGroupRow): CountryGroup {
  return {
    id:          row.id,
    code:        row.code,
    name:        row.name,
    type:        row.type,
    sortOrder:   row.sort_order,
    description: row.description,
    metadata:    row.metadata,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

function mapCountry(row: CountryRow): Country {
  return {
    id:                row.id,
    isoAlpha2:         row.iso_alpha2,
    isoAlpha3:         row.iso_alpha3,
    isoNumeric:        row.iso_numeric,
    name:              row.name,
    slug:              row.slug,
    nativeName:        row.native_name,
    capital:           row.capital,
    phoneCode:         row.phone_code,
    currencyId:        row.currency_id,
    defaultLanguageId: row.default_language_id,
    timezoneId:        row.timezone_id,
    groupId:           row.group_id,
    continent:         row.continent,
    subregion:         row.subregion,
    emoji:             row.emoji,
    flagSvgUrl:        row.flag_svg_url,
    flagPngUrl:        row.flag_png_url,
    population:        row.population,
    areaKm2:           row.area_km2,
    internetTld:       row.internet_tld,
    callingCodes:      row.calling_codes,
    isActive:          row.is_active,
    isSupported:       row.is_supported,
    isDeleted:         row.is_deleted,
    deletedAt:         row.deleted_at,
    metadata:          row.metadata,
    createdBy:         row.created_by,
    updatedBy:         row.updated_by,
    deletedBy:         row.deleted_by,
    searchVector:      row.search_vector,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
  };
}

function mapState(row: StateRow): State {
  return {
    id:           row.id,
    countryId:    row.country_id,
    code:         row.code,
    name:         row.name,
    slug:         row.slug,
    nativeName:   row.native_name,
    isoCode:      row.iso_code,
    fipsCode:     row.fips_code,
    latitude:     row.latitude,
    longitude:    row.longitude,
    isDeleted:    row.is_deleted,
    deletedAt:    row.deleted_at,
    metadata:     row.metadata,
    createdBy:    row.created_by,
    updatedBy:    row.updated_by,
    deletedBy:    row.deleted_by,
    searchVector: row.search_vector,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
}

function mapRegion(row: RegionRow): Region {
  return {
    id:           row.id,
    countryId:    row.country_id,
    stateId:      row.state_id,
    name:         row.name,
    slug:         row.slug,
    code:         row.code,
    boundary:     row.boundary,
    isDeleted:    row.is_deleted,
    deletedAt:    row.deleted_at,
    metadata:     row.metadata,
    createdBy:    row.created_by,
    updatedBy:    row.updated_by,
    deletedBy:    row.deleted_by,
    searchVector: row.search_vector,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
}

function mapCity(row: CityRow): City {
  return {
    id:               row.id,
    countryId:        row.country_id,
    stateId:          row.state_id,
    regionId:         row.region_id,
    name:             row.name,
    slug:             row.slug,
    postalCodeFormat: row.postal_code_format,
    placeType:        row.place_type,
    latitude:         row.latitude,
    longitude:        row.longitude,
    elevationM:       row.elevation_m,
    location:         row.location,
    boundary:         row.boundary,
    population:       row.population,
    timezoneId:       row.timezone_id,
    isDeleted:        row.is_deleted,
    deletedAt:        row.deleted_at,
    metadata:         row.metadata,
    createdBy:        row.created_by,
    updatedBy:        row.updated_by,
    deletedBy:        row.deleted_by,
    searchVector:     row.search_vector,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  };
}

function mapDistrict(row: DistrictRow): District {
  return {
    id:        row.id,
    countryId: row.country_id,
    cityId:    row.city_id,
    code:      row.code,
    name:      row.name,
    boundary:  row.boundary,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    metadata:  row.metadata,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedBy: row.deleted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNeighborhood(row: NeighborhoodRow): Neighborhood {
  return {
    id:         row.id,
    countryId:  row.country_id,
    cityId:     row.city_id,
    districtId: row.district_id,
    code:       row.code,
    name:       row.name,
    boundary:   row.boundary,
    isDeleted:  row.is_deleted,
    deletedAt:  row.deleted_at,
    metadata:   row.metadata,
    createdBy:  row.created_by,
    updatedBy:  row.updated_by,
    deletedBy:  row.deleted_by,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

// ─── Country Groups ───────────────────────────────────────────────────────────

export async function getCountryGroups(): Promise<CountryGroup[]> {
  const { data, error } = await supabase
    .from('country_groups')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to load country groups: ${error.message}`);
  return (data ?? []).map((row) => mapCountryGroup(row as CountryGroupRow));
}

// ─── Countries ────────────────────────────────────────────────────────────────

export async function getCountries(): Promise<Country[]> {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('is_active', true)
    .eq('is_supported', true)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load countries: ${error.message}`);
  return (data ?? []).map((row) => mapCountry(row as CountryRow));
}

export async function getCountryBySlug(slug: string): Promise<Country | null> {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load country: ${error.message}`);
  if (!data) return null;
  return mapCountry(data as CountryRow);
}

export async function getCountryByIso2(iso2: string): Promise<Country | null> {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('iso_alpha2', iso2.toUpperCase())
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load country: ${error.message}`);
  if (!data) return null;
  return mapCountry(data as CountryRow);
}

export async function searchCountries(query: string): Promise<Country[]> {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('is_deleted', false)
    .textSearch('search_vector', query, { type: 'plain' })
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to search countries: ${error.message}`);
  return (data ?? []).map((row) => mapCountry(row as CountryRow));
}

// ─── States ───────────────────────────────────────────────────────────────────

export async function getStatesByCountry(countryId: string): Promise<State[]> {
  const { data, error } = await supabase
    .from('states')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load states: ${error.message}`);
  return (data ?? []).map((row) => mapState(row as StateRow));
}

export async function getStateBySlug(slug: string): Promise<State | null> {
  const { data, error } = await supabase
    .from('states')
    .select('*')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load state: ${error.message}`);
  if (!data) return null;
  return mapState(data as StateRow);
}

// ─── Regions ──────────────────────────────────────────────────────────────────

export async function getRegionsByCountry(countryId: string): Promise<Region[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load regions: ${error.message}`);
  return (data ?? []).map((row) => mapRegion(row as RegionRow));
}

// ─── Cities ───────────────────────────────────────────────────────────────────

export async function getCitiesByCountry(countryId: string): Promise<City[]> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load cities: ${error.message}`);
  return (data ?? []).map((row) => mapCity(row as CityRow));
}

export async function getCitiesByState(stateId: string): Promise<City[]> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('state_id', stateId)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load cities: ${error.message}`);
  return (data ?? []).map((row) => mapCity(row as CityRow));
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load city: ${error.message}`);
  if (!data) return null;
  return mapCity(data as CityRow);
}

export async function searchCities(query: string): Promise<City[]> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('is_deleted', false)
    .textSearch('search_vector', query, { type: 'plain' })
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to search cities: ${error.message}`);
  return (data ?? []).map((row) => mapCity(row as CityRow));
}

// ─── Districts ────────────────────────────────────────────────────────────────

export async function getDistrictsByCity(cityId: string): Promise<District[]> {
  const { data, error } = await supabase
    .from('districts')
    .select('*')
    .eq('city_id', cityId)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load districts: ${error.message}`);
  return (data ?? []).map((row) => mapDistrict(row as DistrictRow));
}

// ─── Neighborhoods ────────────────────────────────────────────────────────────

export async function getNeighborhoodsByCity(cityId: string): Promise<Neighborhood[]> {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('city_id', cityId)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load neighborhoods: ${error.message}`);
  return (data ?? []).map((row) => mapNeighborhood(row as NeighborhoodRow));
}

export async function getNeighborhoodsByDistrict(districtId: string): Promise<Neighborhood[]> {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('district_id', districtId)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load neighborhoods: ${error.message}`);
  return (data ?? []).map((row) => mapNeighborhood(row as NeighborhoodRow));
}
