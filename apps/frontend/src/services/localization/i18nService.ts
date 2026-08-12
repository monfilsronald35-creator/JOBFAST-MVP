import { supabase } from '../../lib/supabase';
import type {
  TranslationNamespace,
  TranslationKey,
  Translation,
  TranslationHistory,
  LocalizedMessage,
  LocalizedCategory,
  TranslationCache,
  MvTranslationCache,
  WorkflowStatus,
  MessageChannel,
  GenderRule,
  PluralForm,
} from '../../types/i18n';

// ─── Row Types ────────────────────────────────────────────────────────────────

type TranslationNamespaceRow = {
  id: string;
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

type TranslationKeyRow = {
  id: string;
  namespace_id: string;
  key_name: string;
  context: string | null;
  description: string | null;
  screen_name: string | null;
  page_name: string | null;
  screenshot_url: string | null;
  max_length: number | null;
  content_type: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  search_vector: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type TranslationRow = {
  id: string;
  translation_key_id: string;
  language_id: string;
  locale: string;
  translated_text: string;
  gender_rule: GenderRule;
  plural_form: PluralForm;
  workflow_status: WorkflowStatus;
  is_verified: boolean;
  verified_by: string | null;
  ai_generated: boolean;
  ai_model: string | null;
  confidence_score: number | null;
  translation_provider: string | null;
  variables_valid: boolean;
  tts_voice: string | null;
  voice_speed: number;
  voice_gender: string;
  embedding_vector: number[] | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  search_vector: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type TranslationHistoryRow = {
  id: string;
  translation_id: string;
  previous_text: string | null;
  new_text: string;
  workflow_status: string | null;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
};

type LocalizedMessageRow = {
  id: string;
  message_code: string;
  language_id: string;
  locale: string;
  subject: string | null;
  body: string;
  channel: MessageChannel;
  rtl_css: string | null;
  rtl_font: string | null;
  rtl_overrides: Record<string, unknown>;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  search_vector: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type LocalizedCategoryRow = {
  id: string;
  category_slug: string;
  language_id: string;
  locale: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  icon_url: string | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  search_vector: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type TranslationCacheRow = {
  id: string;
  language_code: string;
  namespace_name: string;
  cache_payload: Record<string, string>;
  compiled_at: string;
};

type MvTranslationCacheRow = {
  language_code: string;
  namespace_name: string;
  translations_map: Record<string, string>;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapNamespace(row: TranslationNamespaceRow): TranslationNamespace {
  return {
    id:            row.id,
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

function mapTranslationKey(row: TranslationKeyRow): TranslationKey {
  return {
    id:            row.id,
    namespaceId:   row.namespace_id,
    keyName:       row.key_name,
    context:       row.context,
    description:   row.description,
    screenName:    row.screen_name,
    pageName:      row.page_name,
    screenshotUrl: row.screenshot_url,
    maxLength:     row.max_length,
    contentType:   row.content_type as TranslationKey['contentType'],
    isDeleted:     row.is_deleted,
    deletedAt:     row.deleted_at,
    deletedReason: row.deleted_reason,
    version:       row.version,
    metadata:      row.metadata,
    searchVector:  row.search_vector,
    createdBy:     row.created_by,
    updatedBy:     row.updated_by,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

function mapTranslation(row: TranslationRow): Translation {
  return {
    id:                  row.id,
    translationKeyId:    row.translation_key_id,
    languageId:          row.language_id,
    locale:              row.locale,
    translatedText:      row.translated_text,
    genderRule:          row.gender_rule,
    pluralForm:          row.plural_form,
    workflowStatus:      row.workflow_status,
    isVerified:          row.is_verified,
    verifiedBy:          row.verified_by,
    aiGenerated:         row.ai_generated,
    aiModel:             row.ai_model,
    confidenceScore:     row.confidence_score,
    translationProvider: row.translation_provider as Translation['translationProvider'],
    variablesValid:      row.variables_valid,
    ttsVoice:            row.tts_voice,
    voiceSpeed:          row.voice_speed,
    voiceGender:         row.voice_gender,
    embeddingVector:     row.embedding_vector,
    isDeleted:           row.is_deleted,
    deletedAt:           row.deleted_at,
    deletedReason:       row.deleted_reason,
    version:             row.version,
    metadata:            row.metadata,
    searchVector:        row.search_vector,
    createdBy:           row.created_by,
    updatedBy:           row.updated_by,
    createdAt:           row.created_at,
    updatedAt:           row.updated_at,
  };
}

function mapHistory(row: TranslationHistoryRow): TranslationHistory {
  return {
    id:             row.id,
    translationId:  row.translation_id,
    previousText:   row.previous_text,
    newText:        row.new_text,
    workflowStatus: row.workflow_status,
    changedBy:      row.changed_by,
    changeReason:   row.change_reason,
    createdAt:      row.created_at,
  };
}

function mapLocalizedMessage(row: LocalizedMessageRow): LocalizedMessage {
  return {
    id:            row.id,
    messageCode:   row.message_code,
    languageId:    row.language_id,
    locale:        row.locale,
    subject:       row.subject,
    body:          row.body,
    channel:       row.channel,
    rtlCss:        row.rtl_css,
    rtlFont:       row.rtl_font,
    rtlOverrides:  row.rtl_overrides,
    isActive:      row.is_active,
    isDeleted:     row.is_deleted,
    deletedAt:     row.deleted_at,
    deletedReason: row.deleted_reason,
    version:       row.version,
    metadata:      row.metadata,
    searchVector:  row.search_vector,
    createdBy:     row.created_by,
    updatedBy:     row.updated_by,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

function mapLocalizedCategory(row: LocalizedCategoryRow): LocalizedCategory {
  return {
    id:            row.id,
    categorySlug:  row.category_slug,
    languageId:    row.language_id,
    locale:        row.locale,
    name:          row.name,
    description:   row.description,
    parentId:      row.parent_id,
    iconUrl:       row.icon_url,
    isActive:      row.is_active,
    isDeleted:     row.is_deleted,
    deletedAt:     row.deleted_at,
    deletedReason: row.deleted_reason,
    version:       row.version,
    metadata:      row.metadata,
    searchVector:  row.search_vector,
    createdBy:     row.created_by,
    updatedBy:     row.updated_by,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

// ─── Translation Namespaces ───────────────────────────────────────────────────

export async function getTranslationNamespaces(): Promise<TranslationNamespace[]> {
  const { data, error } = await supabase
    .from('translation_namespaces')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load namespaces: ${error.message}`);
  return (data ?? []).map((row) => mapNamespace(row as TranslationNamespaceRow));
}

// ─── Translation Keys ─────────────────────────────────────────────────────────

export async function getTranslationKeysByNamespace(
  namespaceId: string
): Promise<TranslationKey[]> {
  const { data, error } = await supabase
    .from('translation_keys')
    .select('*')
    .eq('namespace_id', namespaceId)
    .eq('is_deleted', false)
    .order('key_name', { ascending: true });

  if (error) throw new Error(`Failed to load translation keys: ${error.message}`);
  return (data ?? []).map((row) => mapTranslationKey(row as TranslationKeyRow));
}

export async function searchTranslationKeys(query: string): Promise<TranslationKey[]> {
  const { data, error } = await supabase
    .from('translation_keys')
    .select('*')
    .eq('is_deleted', false)
    .textSearch('search_vector', query, { type: 'plain' })
    .order('key_name', { ascending: true });

  if (error) throw new Error(`Failed to search translation keys: ${error.message}`);
  return (data ?? []).map((row) => mapTranslationKey(row as TranslationKeyRow));
}

// ─── Translations ─────────────────────────────────────────────────────────────

export async function getTranslationsByLanguage(
  languageId: string,
  status: WorkflowStatus = 'approved'
): Promise<Translation[]> {
  const { data, error } = await supabase
    .from('translations')
    .select('id, translation_key_id, language_id, locale, translated_text, gender_rule, plural_form, workflow_status, is_verified, verified_by, ai_generated, ai_model, confidence_score, translation_provider, variables_valid, tts_voice, voice_speed, voice_gender, is_deleted, deleted_at, deleted_reason, version, metadata, search_vector, created_by, updated_by, created_at, updated_at')
    .eq('language_id', languageId)
    .eq('workflow_status', status)
    .eq('is_deleted', false);

  if (error) throw new Error(`Failed to load translations: ${error.message}`);
  return (data ?? []).map((row) => mapTranslation({ ...row as TranslationRow, embedding_vector: null }));
}

export async function getTranslationsByKey(
  translationKeyId: string
): Promise<Translation[]> {
  const { data, error } = await supabase
    .from('translations')
    .select('id, translation_key_id, language_id, locale, translated_text, gender_rule, plural_form, workflow_status, is_verified, verified_by, ai_generated, ai_model, confidence_score, translation_provider, variables_valid, tts_voice, voice_speed, voice_gender, is_deleted, deleted_at, deleted_reason, version, metadata, search_vector, created_by, updated_by, created_at, updated_at')
    .eq('translation_key_id', translationKeyId)
    .eq('is_deleted', false)
    .order('locale', { ascending: true });

  if (error) throw new Error(`Failed to load translations: ${error.message}`);
  return (data ?? []).map((row) => mapTranslation({ ...row as TranslationRow, embedding_vector: null }));
}

// ─── Translation History ──────────────────────────────────────────────────────

export async function getTranslationHistory(
  translationId: string
): Promise<TranslationHistory[]> {
  const { data, error } = await supabase
    .from('translation_history')
    .select('*')
    .eq('translation_id', translationId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load translation history: ${error.message}`);
  return (data ?? []).map((row) => mapHistory(row as TranslationHistoryRow));
}

// ─── Translation Cache (fastest app-boot path) ────────────────────────────────

export async function loadTranslationsFromMv(
  languageCode: string,
  namespaceName: string
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('mv_translation_cache')
    .select('translations_map')
    .eq('language_code', languageCode)
    .eq('namespace_name', namespaceName)
    .maybeSingle();

  if (error) throw new Error(`Failed to load translation cache: ${error.message}`);
  const row = data as MvTranslationCacheRow | null;
  return row?.translations_map ?? {};
}

export async function loadTranslationsFromCache(
  languageCode: string,
  namespaceName: string
): Promise<TranslationCache | null> {
  const { data, error } = await supabase
    .from('translation_cache')
    .select('*')
    .eq('language_code', languageCode)
    .eq('namespace_name', namespaceName)
    .maybeSingle();

  if (error) throw new Error(`Failed to load translation cache: ${error.message}`);
  if (!data) return null;
  const row = data as TranslationCacheRow;
  return {
    id:            row.id,
    languageCode:  row.language_code,
    namespaceName: row.namespace_name,
    cachePayload:  row.cache_payload,
    compiledAt:    row.compiled_at,
  };
}

// ─── Localized Messages ───────────────────────────────────────────────────────

export async function getLocalizedMessage(
  messageCode: string,
  languageId: string,
  locale: string
): Promise<LocalizedMessage | null> {
  const { data, error } = await supabase
    .from('localized_messages')
    .select('*')
    .eq('message_code', messageCode)
    .eq('language_id', languageId)
    .eq('locale', locale)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load localized message: ${error.message}`);
  if (!data) return null;
  return mapLocalizedMessage(data as LocalizedMessageRow);
}

export async function getLocalizedMessagesByChannel(
  languageId: string,
  channel: MessageChannel
): Promise<LocalizedMessage[]> {
  const { data, error } = await supabase
    .from('localized_messages')
    .select('*')
    .eq('language_id', languageId)
    .eq('channel', channel)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('message_code', { ascending: true });

  if (error) throw new Error(`Failed to load localized messages: ${error.message}`);
  return (data ?? []).map((row) => mapLocalizedMessage(row as LocalizedMessageRow));
}

// ─── Localized Categories ─────────────────────────────────────────────────────

export async function getLocalizedCategories(
  languageId: string,
  locale: string
): Promise<LocalizedCategory[]> {
  const { data, error } = await supabase
    .from('localized_categories')
    .select('*')
    .eq('language_id', languageId)
    .eq('locale', locale)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load localized categories: ${error.message}`);
  return (data ?? []).map((row) => mapLocalizedCategory(row as LocalizedCategoryRow));
}

export async function getLocalizedCategoryBySlug(
  categorySlug: string,
  languageId: string,
  locale: string
): Promise<LocalizedCategory | null> {
  const { data, error } = await supabase
    .from('localized_categories')
    .select('*')
    .eq('category_slug', categorySlug)
    .eq('language_id', languageId)
    .eq('locale', locale)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load localized category: ${error.message}`);
  if (!data) return null;
  return mapLocalizedCategory(data as LocalizedCategoryRow);
}

export async function getChildCategories(
  parentId: string,
  languageId: string,
  locale: string
): Promise<LocalizedCategory[]> {
  const { data, error } = await supabase
    .from('localized_categories')
    .select('*')
    .eq('parent_id', parentId)
    .eq('language_id', languageId)
    .eq('locale', locale)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load child categories: ${error.message}`);
  return (data ?? []).map((row) => mapLocalizedCategory(row as LocalizedCategoryRow));
}
