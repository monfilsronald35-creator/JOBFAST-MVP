export type LanguageDirection = 'ltr' | 'rtl';

export interface Language {
  id: string;

  code: string;

  iso_639_1: string | null;

  iso_639_2: string | null;

  name: string;

  native_name: string | null;

  english_name: string | null;

  locale: string | null;

  fallback_language_id: string | null;

  direction: LanguageDirection;

  script: string | null;

  region_code: string | null;

  variant: string | null;

  extension: string | null;

  plural_rules: Record<string, unknown> | null;

  calendar_system: string | null;

  font_family: string | null;

  sort_order: number;

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
}

export interface CountryLanguage {
  id: string;

  country_id: string;

  language_id: string;

  is_official: boolean;

  is_national: boolean;

  is_regional: boolean;

  is_default: boolean;

  speakers_count: number | null;

  percentage: number | null;

  sort_order: number;

  is_deleted: boolean;

  deleted_at: string | null;

  deleted_reason: string | null;

  version: number;

  metadata: Record<string, unknown>;

  created_by: string | null;

  updated_by: string | null;

  deleted_by: string | null;

  created_ip: string | null;

  updated_ip: string | null;

  created_device: string | null;

  updated_device: string | null;

  created_at: string;

  updated_at: string;
}

export interface LanguageAlias {
  id: string;

  language_id: string;

  alias_code: string;

  alias_name: string | null;

  source: string | null;

  is_deleted: boolean;

  deleted_at: string | null;

  deleted_reason: string | null;

  version: number;

  created_at: string;

  updated_at: string;
}

export interface LanguageMetadata {
  id: string;

  language_id: string;

  country_id: string | null;

  cldr_locale: string;

  unicode_locale: string | null;

  date_format: string | null;

  time_format: string | null;

  number_format_pattern: string | null;

  currency_format: string | null;

  percent_format: string | null;

  decimal_separator: string | null;

  thousands_separator: string | null;

  measurement_system: string | null;

  temperature_unit: string | null;

  paper_size: string | null;

  first_day_of_week: number;

  is_deleted: boolean;

  deleted_at: string | null;

  deleted_reason: string | null;

  version: number;

  metadata: Record<string, unknown>;

  created_by: string | null;

  updated_by: string | null;

  deleted_by: string | null;

  created_ip: string | null;

  updated_ip: string | null;

  created_device: string | null;

  updated_device: string | null;

  created_at: string;

  updated_at: string;
}

export interface LanguageFtsConfig {
  id: string;

  language_id: string;

  postgres_config_name: string;

  dictionary_name: string | null;

  stop_words: string[] | null;

  is_default: boolean;

  created_at: string;
}
