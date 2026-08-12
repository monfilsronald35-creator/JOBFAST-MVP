export type DetectionSource =
  | 'device_locale' | 'gps' | 'ip' | 'sim' | 'user_selected' | 'default';

export interface CountryContext {
  country:           string;   // ISO 3166-1 alpha-2
  region?:           string;
  state?:            string;
  city?:             string;
  timeZone:          string;
  currency:          string;
  language:          string;   // BCP 47 (e.g. 'ht', 'es', 'en')
  preferredLang?:    string;
  legalRegion?:      string;
  taxRegion?:        string;
  gpsRegion?:        string;
  telecomRegion?:    string;
  bankingRegion?:    string;
  marketplaceRegion?: string;
  detectedFrom:      DetectionSource;
  confirmedAt?:      string;   // ISO timestamp when user confirmed
}

export interface NumberFormatConfig {
  decimalSeparator:  '.' | ',';
  thousandSeparator: ',' | '.' | ' ';
  currencyPosition:  'before' | 'after';
}

export interface EmergencyNumbers {
  police:    string;
  fire:      string;
  ambulance: string;
  general?:  string;
}

export interface CountryConfig {
  code:              string;
  name:              string;
  nativeName:        string;
  flag:              string;   // emoji
  currency:          string;
  languages:         string[];
  primaryLanguage:   string;
  timeZone:          string;
  callingCode:       string;
  emergencyNumbers:  EmergencyNumbers;
  banks:             string[];
  wallets:           string[];
  telecomProviders:  string[];
  paymentMethods:    string[];
  taxRate:           number;   // percentage 0-100
  vatRate:           number;
  dateFormat:        string;   // e.g. 'DD/MM/YYYY'
  timeFormat:        '24h' | '12h';
  numberFormat:      NumberFormatConfig;
  addressFormat:     string[];
  minAge:            number;
  governmentApis:    boolean;
  legalNotes?:       string;
  active:            boolean;
}

export interface CountryFeatures {
  country:     string;
  wallet:      boolean;
  telecom:     boolean;
  travel:      boolean;
  marketplace: boolean;
  healthcare:  boolean;
  government:  boolean;
  ai:          boolean;
  enterprise:  boolean;
  maps:        boolean;
}

export interface CrossBorderEvent {
  id:          string;
  userId:      string;
  fromCountry: string;
  toCountry:   string;
  detectedAt:  string;
  confirmed:   boolean;
}

export interface CountryStats {
  country:      string;
  users:        number;
  jobs:         number;
  revenue:      number;   // HTG minor units
  orders:       number;
}

// What gets attached to req by localizationMiddleware
export interface LocalizationContext {
  ctx:      CountryContext;
  config:   CountryConfig;
  features: CountryFeatures;
}

// ─── Migration 004: Global Localization Foundation ────────────────────────────

export interface Timezone {
  id:                   string;
  zone_name:            string;
  country_id:           string | null;
  country_code:         string | null;
  abbreviation:         string;
  utc_offset_string:    string;
  utc_offset_minutes:   number;
  iana_version:         string;
  dst_observed:         boolean;
  raw_offset_seconds:   number;
  dst_offset_seconds:   number;
  is_active:            boolean;
  created_at:           string;
  updated_at:           string;
}

export interface DstRule {
  id:                     string;
  timezone_id:            string;
  year:                   number;
  dst_start_utc:          string;
  dst_end_utc:            string;
  offset_applied_seconds: number;
  created_at:             string;
}

export interface WorkingDay {
  id:              string;
  country_id:      string | null;
  entity_id:       string | null;
  day_of_week:     number;   // 1=Monday … 7=Sunday
  is_working_day:  boolean;
  is_half_day:     boolean;
  half_day_start:  string | null;
  half_day_end:    string | null;
  created_at:      string;
  updated_at:      string;
}

export interface BusinessHours {
  id:              string;
  country_id:      string | null;
  entity_id:       string | null;
  timezone_id:     string | null;
  day_of_week:     number;
  opens_at:        string | null;
  closes_at:       string | null;
  is_24_hours:     boolean;
  crosses_midnight: boolean;
  is_closed:       boolean;
  break_start:     string | null;
  break_end:       string | null;
  created_at:      string;
  updated_at:      string;
}

export interface Holiday {
  id:                    string;
  country_id:            string;
  name:                  string;
  local_name:            string | null;
  holiday_date:          string;
  holiday_scope:         'national' | 'regional' | 'city' | 'company' | 'religious' | 'optional';
  holiday_type:          'public' | 'religious' | 'bank' | 'observance' | 'company';
  is_recurring_annually: boolean;
  is_working_holiday:    boolean;
  is_bank_closed:        boolean;
  is_government_closed:  boolean;
  is_school_closed:      boolean;
  description:           string | null;
  created_at:            string;
}

export interface MeasurementSystem {
  id:          string;
  code:        string;
  name:        string;
  description: string | null;
  is_active:   boolean;
  created_at:  string;
}

export interface MeasurementUnit {
  id:                        string;
  measurement_system_id:     string | null;
  code:                      string;
  name:                      string;
  symbol:                    string;
  category:                  'distance' | 'weight' | 'temperature' | 'volume' | 'pressure' | 'speed' | 'energy' | 'currency' | 'time' | 'area';
  dimension_type:            string;
  conversion_factor_to_base: string;
  base_offset:               string;
  precision_digits:          number;
  is_base_unit:              boolean;
  is_active:                 boolean;
  created_at:                string;
}

export interface CountryMeasurementPreference {
  id:                    string;
  country_id:            string;
  measurement_system_id: string;
  distance_unit_id:      string | null;
  weight_unit_id:        string | null;
  temperature_unit_id:   string | null;
  volume_unit_id:        string | null;
  is_default:            boolean;
  created_at:            string;
}