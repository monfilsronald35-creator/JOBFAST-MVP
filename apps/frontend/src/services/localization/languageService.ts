import { supabase } from '../../lib/supabase';
import type {
  Language,
  CountryLanguage,
  LanguageAlias,
  LanguageMetadata,
  LanguageFtsConfig,
} from '../../types/localization';

export async function getLanguages(): Promise<Language[]> {
  const { data, error } = await supabase
    .from('languages')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data as Language[];
}

export async function getLanguageByCode(
  code: string
): Promise<Language | null> {
  const { data, error } = await supabase
    .from('languages')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Language | null;
}

export async function getCountryLanguages(
  countryId: string
): Promise<CountryLanguage[]> {
  const { data, error } = await supabase
    .from('country_languages')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data as CountryLanguage[];
}

export async function getLanguageAliases(
  languageId: string
): Promise<LanguageAlias[]> {
  const { data, error } = await supabase
    .from('language_aliases')
    .select('*')
    .eq('language_id', languageId)
    .eq('is_deleted', false);

  if (error) {
    throw error;
  }

  return data as LanguageAlias[];
}

export async function getLanguageMetadata(
  languageId: string
): Promise<LanguageMetadata[]> {
  const { data, error } = await supabase
    .from('language_metadata')
    .select('*')
    .eq('language_id', languageId);

  if (error) {
    throw error;
  }

  return data as LanguageMetadata[];
}

export async function searchLanguages(
  query: string
): Promise<Language[]> {
  const { data, error } = await supabase
    .from('languages')
    .select('*')
    .eq('is_deleted', false)
    .textSearch('search_vector', query, { type: 'plain' })
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data as Language[];
}

export async function getLanguageFtsConfigs(
  languageId: string
): Promise<LanguageFtsConfig[]> {
  const { data, error } = await supabase
    .from('language_fts_configs')
    .select('*')
    .eq('language_id', languageId);

  if (error) {
    throw error;
  }

  return data as LanguageFtsConfig[];
}
