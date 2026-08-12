import { supabase } from '../../lib/supabase';
import type {
  JobCategory,
  GlobalIndustry,
  CountryJobCategory,
  CountryIndustry,
  CountryEmploymentRules,
  CountryAiLocalization,
  CountrySupportedLanguage,
  CountrySearchConfig,
  CountryGeoRule,
  CountrySearchBoost,
  CountrySkillTaxonomy,
  CountryLicenseRequirement,
  CountrySalaryBenchmark,
  CountryLaborLawsHistory,
  CountrySearchSynonym,
  BoostEntityType,
  ExperienceLevel,
  PayRatePeriod,
  WagePeriod,
  AiStrictnessLevel,
  SalaryPeriod,
} from '../../types/countryRules';

// ─── Row Types ────────────────────────────────────────────────────────────────

type JobCategoryRow = {
  id: string;
  category_key: string;
  default_name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  search_vector: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type GlobalIndustryRow = {
  id: string;
  industry_code: string;
  name: string;
  slug: string;
  description: string | null;
  search_vector: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CountryJobCategoryRow = {
  id: string;
  country_id: string;
  global_category_id: string;
  display_name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  requires_certification: boolean;
  minimum_pay_rate: number | null;
  pay_rate_period: PayRatePeriod;
  ai_matching_weight: number;
  metadata: Record<string, unknown>;
  effective_version: number;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_ip: string | null;
  updated_ip: string | null;
  created_device: string | null;
  created_at: string;
  updated_at: string;
};

type CountryIndustryRow = {
  id: string;
  country_id: string;
  global_industry_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_regulated: boolean;
  regulatory_body: string | null;
  requires_background_check: boolean;
  standard_insurance_required: boolean;
  metadata: Record<string, unknown>;
  effective_version: number;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_ip: string | null;
  updated_ip: string | null;
  created_device: string | null;
  created_at: string;
  updated_at: string;
};

type CountryEmploymentRulesRow = {
  id: string;
  country_id: string;
  standard_weekly_hours: number;
  maximum_weekly_hours: number;
  maximum_daily_hours: number;
  minimum_rest_hours: number;
  mandatory_break_minutes: number;
  overtime_after_hours: number;
  overtime_multiplier: number;
  night_shift_multiplier: number;
  holiday_multiplier: number;
  weekend_multiplier: number;
  minimum_wage_amount: number;
  currency_id: string;
  minimum_wage_period: WagePeriod;
  mandatory_paid_vacation_days: number;
  mandatory_sick_leave_days: number;
  maternity_leave_weeks: number;
  paternity_leave_weeks: number;
  severance_required: boolean;
  allow_independent_contractors: boolean;
  allow_remote_foreign_workers: boolean;
  allow_internships: boolean;
  mandatory_written_contract: boolean;
  effective_from: string;
  effective_to: string | null;
  metadata: Record<string, unknown>;
  effective_version: number;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_ip: string | null;
  updated_ip: string | null;
  created_device: string | null;
  created_at: string;
  updated_at: string;
};

type CountryAiLocalizationRow = {
  id: string;
  country_id: string;
  primary_language_id: string;
  enable_local_slang_parsing: boolean;
  embedding_model: string;
  translation_model: string;
  ranking_model: string;
  moderation_model: string;
  speech_model: string;
  ocr_model: string;
  resume_parsing_ai_strictness: AiStrictnessLevel;
  job_description_ai_filter: boolean;
  auto_translate_listings: boolean;
  ai_bias_mitigation_enabled: boolean;
  max_tokens_response_limit: number;
  metadata: Record<string, unknown>;
  effective_version: number;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_ip: string | null;
  updated_ip: string | null;
  created_device: string | null;
  created_at: string;
  updated_at: string;
};

type CountrySupportedLanguageRow = {
  id: string;
  country_id: string;
  language_id: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
};

type CountrySearchConfigRow = {
  id: string;
  country_id: string;
  default_search_radius_km: number;
  max_search_radius_km: number;
  fuzzy_matching_enabled: boolean;
  semantic_search: boolean;
  vector_search: boolean;
  hybrid_search: boolean;
  reranking_enabled: boolean;
  cache_enabled: boolean;
  synonyms_dictionary_key: string | null;
  ranking_weights: Record<string, unknown>;
  metadata: Record<string, unknown>;
  effective_version: number;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
};

type CountryGeoRuleRow = {
  id: string;
  country_id: string;
  region_code: string;
  region_name: string;
  is_geo_fenced: boolean;
  block_foreign_ip: boolean;
  require_exact_gps: boolean;
  max_allowed_accuracy_meters: number;
  geometry: string | null;
  geography: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
};

type CountrySearchBoostRow = {
  id: string;
  country_id: string;
  entity_type: BoostEntityType;
  entity_id: string;
  boost_multiplier: number;
  priority: number;
  manual_override: boolean;
  boost_reason: string;
  created_reason: string | null;
  starts_at: string;
  expires_at: string;
  approved_by: string | null;
  approved_at: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  is_deleted: boolean;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
};

type CountrySkillTaxonomyRow = {
  id: string;
  country_id: string;
  global_category_id: string | null;
  skill_key: string;
  display_name: string;
  slug: string;
  description: string | null;
  is_regulated_skill: boolean;
  metadata: Record<string, unknown>;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

type CountryLicenseRequirementRow = {
  id: string;
  country_id: string;
  license_code: string;
  name: string;
  issuing_authority: string;
  renewal_period_months: number;
  requires_exam: boolean;
  metadata: Record<string, unknown>;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

type CountrySalaryBenchmarkRow = {
  id: string;
  country_id: string;
  global_category_id: string | null;
  experience_level: ExperienceLevel;
  min_benchmark: number;
  median_benchmark: number;
  max_benchmark: number;
  currency_id: string;
  period: SalaryPeriod;
  metadata: Record<string, unknown>;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

type CountryLaborLawsHistoryRow = {
  id: string;
  country_id: string;
  employment_rule_id: string | null;
  version_label: string;
  summary_of_changes: string;
  effective_from: string;
  effective_to: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

type CountrySearchSynonymRow = {
  id: string;
  country_id: string;
  term: string;
  synonyms: string[];
  language_id: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapJobCategory(row: JobCategoryRow): JobCategory {
  return {
    id:           row.id,
    categoryKey:  row.category_key,
    defaultName:  row.default_name,
    slug:         row.slug,
    description:  row.description,
    icon:         row.icon,
    searchVector: row.search_vector,
    metadata:     row.metadata,
    isActive:     row.is_active,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
}

function mapGlobalIndustry(row: GlobalIndustryRow): GlobalIndustry {
  return {
    id:           row.id,
    industryCode: row.industry_code,
    name:         row.name,
    slug:         row.slug,
    description:  row.description,
    searchVector: row.search_vector,
    metadata:     row.metadata,
    isActive:     row.is_active,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
}

function mapCountryJobCategory(row: CountryJobCategoryRow): CountryJobCategory {
  return {
    id:                    row.id,
    countryId:             row.country_id,
    globalCategoryId:      row.global_category_id,
    displayName:           row.display_name,
    slug:                  row.slug,
    description:           row.description,
    icon:                  row.icon,
    isActive:              row.is_active,
    requiresCertification: row.requires_certification,
    minimumPayRate:        row.minimum_pay_rate,
    payRatePeriod:         row.pay_rate_period,
    aiMatchingWeight:      row.ai_matching_weight,
    metadata:              row.metadata,
    effectiveVersion:      row.effective_version,
    isDeleted:             row.is_deleted,
    deletedAt:             row.deleted_at,
    deletedReason:         row.deleted_reason,
    createdBy:             row.created_by,
    updatedBy:             row.updated_by,
    deletedBy:             row.deleted_by,
    createdIp:             row.created_ip,
    updatedIp:             row.updated_ip,
    createdDevice:         row.created_device,
    createdAt:             row.created_at,
    updatedAt:             row.updated_at,
  };
}

function mapCountryIndustry(row: CountryIndustryRow): CountryIndustry {
  return {
    id:                       row.id,
    countryId:                row.country_id,
    globalIndustryId:         row.global_industry_id,
    name:                     row.name,
    slug:                     row.slug,
    description:              row.description,
    isRegulated:              row.is_regulated,
    regulatoryBody:           row.regulatory_body,
    requiresBackgroundCheck:  row.requires_background_check,
    standardInsuranceRequired: row.standard_insurance_required,
    metadata:                 row.metadata,
    effectiveVersion:         row.effective_version,
    isActive:                 row.is_active,
    isDeleted:                row.is_deleted,
    deletedAt:                row.deleted_at,
    deletedReason:            row.deleted_reason,
    createdBy:                row.created_by,
    updatedBy:                row.updated_by,
    deletedBy:                row.deleted_by,
    createdIp:                row.created_ip,
    updatedIp:                row.updated_ip,
    createdDevice:            row.created_device,
    createdAt:                row.created_at,
    updatedAt:                row.updated_at,
  };
}

function mapEmploymentRules(row: CountryEmploymentRulesRow): CountryEmploymentRules {
  return {
    id:                         row.id,
    countryId:                  row.country_id,
    standardWeeklyHours:        row.standard_weekly_hours,
    maximumWeeklyHours:         row.maximum_weekly_hours,
    maximumDailyHours:          row.maximum_daily_hours,
    minimumRestHours:           row.minimum_rest_hours,
    mandatoryBreakMinutes:      row.mandatory_break_minutes,
    overtimeAfterHours:         row.overtime_after_hours,
    overtimeMultiplier:         row.overtime_multiplier,
    nightShiftMultiplier:       row.night_shift_multiplier,
    holidayMultiplier:          row.holiday_multiplier,
    weekendMultiplier:          row.weekend_multiplier,
    minimumWageAmount:          row.minimum_wage_amount,
    currencyId:                 row.currency_id,
    minimumWagePeriod:          row.minimum_wage_period,
    mandatoryPaidVacationDays:  row.mandatory_paid_vacation_days,
    mandatorySickLeaveDays:     row.mandatory_sick_leave_days,
    maternityLeaveWeeks:        row.maternity_leave_weeks,
    paternityLeaveWeeks:        row.paternity_leave_weeks,
    severanceRequired:          row.severance_required,
    allowIndependentContractors: row.allow_independent_contractors,
    allowRemoteForeignWorkers:  row.allow_remote_foreign_workers,
    allowInternships:           row.allow_internships,
    mandatoryWrittenContract:   row.mandatory_written_contract,
    effectiveFrom:              row.effective_from,
    effectiveTo:                row.effective_to,
    metadata:                   row.metadata,
    effectiveVersion:           row.effective_version,
    isDeleted:                  row.is_deleted,
    deletedAt:                  row.deleted_at,
    deletedReason:              row.deleted_reason,
    createdBy:                  row.created_by,
    updatedBy:                  row.updated_by,
    deletedBy:                  row.deleted_by,
    createdIp:                  row.created_ip,
    updatedIp:                  row.updated_ip,
    createdDevice:              row.created_device,
    createdAt:                  row.created_at,
    updatedAt:                  row.updated_at,
  };
}

function mapAiLocalization(row: CountryAiLocalizationRow): CountryAiLocalization {
  return {
    id:                          row.id,
    countryId:                   row.country_id,
    primaryLanguageId:           row.primary_language_id,
    enableLocalSlangParsing:     row.enable_local_slang_parsing,
    embeddingModel:              row.embedding_model,
    translationModel:            row.translation_model,
    rankingModel:                row.ranking_model,
    moderationModel:             row.moderation_model,
    speechModel:                 row.speech_model,
    ocrModel:                    row.ocr_model,
    resumeParsingAiStrictness:   row.resume_parsing_ai_strictness,
    jobDescriptionAiFilter:      row.job_description_ai_filter,
    autoTranslateListings:       row.auto_translate_listings,
    aiBiasMitigationEnabled:     row.ai_bias_mitigation_enabled,
    maxTokensResponseLimit:      row.max_tokens_response_limit,
    metadata:                    row.metadata,
    effectiveVersion:            row.effective_version,
    isActive:                    row.is_active,
    isDeleted:                   row.is_deleted,
    deletedAt:                   row.deleted_at,
    deletedReason:               row.deleted_reason,
    createdBy:                   row.created_by,
    updatedBy:                   row.updated_by,
    deletedBy:                   row.deleted_by,
    createdIp:                   row.created_ip,
    updatedIp:                   row.updated_ip,
    createdDevice:               row.created_device,
    createdAt:                   row.created_at,
    updatedAt:                   row.updated_at,
  };
}

function mapSearchConfig(row: CountrySearchConfigRow): CountrySearchConfig {
  return {
    id:                    row.id,
    countryId:             row.country_id,
    defaultSearchRadiusKm: row.default_search_radius_km,
    maxSearchRadiusKm:     row.max_search_radius_km,
    fuzzyMatchingEnabled:  row.fuzzy_matching_enabled,
    semanticSearch:        row.semantic_search,
    vectorSearch:          row.vector_search,
    hybridSearch:          row.hybrid_search,
    rerankingEnabled:      row.reranking_enabled,
    cacheEnabled:          row.cache_enabled,
    synonymsDictionaryKey: row.synonyms_dictionary_key,
    rankingWeights:        row.ranking_weights,
    metadata:              row.metadata,
    effectiveVersion:      row.effective_version,
    isActive:              row.is_active,
    isDeleted:             row.is_deleted,
    deletedAt:             row.deleted_at,
    createdBy:             row.created_by,
    updatedBy:             row.updated_by,
    deletedBy:             row.deleted_by,
    createdAt:             row.created_at,
    updatedAt:             row.updated_at,
  };
}

function mapGeoRule(row: CountryGeoRuleRow): CountryGeoRule {
  return {
    id:                       row.id,
    countryId:                row.country_id,
    regionCode:               row.region_code,
    regionName:               row.region_name,
    isGeoFenced:              row.is_geo_fenced,
    blockForeignIp:           row.block_foreign_ip,
    requireExactGps:          row.require_exact_gps,
    maxAllowedAccuracyMeters: row.max_allowed_accuracy_meters,
    geometry:                 row.geometry,
    geography:                row.geography,
    metadata:                 row.metadata,
    isActive:                 row.is_active,
    isDeleted:                row.is_deleted,
    deletedAt:                row.deleted_at,
    version:                  row.version,
    createdBy:                row.created_by,
    updatedBy:                row.updated_by,
    deletedBy:                row.deleted_by,
    createdAt:                row.created_at,
    updatedAt:                row.updated_at,
  };
}

function mapSearchBoost(row: CountrySearchBoostRow): CountrySearchBoost {
  return {
    id:             row.id,
    countryId:      row.country_id,
    entityType:     row.entity_type,
    entityId:       row.entity_id,
    boostMultiplier: row.boost_multiplier,
    priority:       row.priority,
    manualOverride: row.manual_override,
    boostReason:    row.boost_reason,
    createdReason:  row.created_reason,
    startsAt:       row.starts_at,
    expiresAt:      row.expires_at,
    approvedBy:     row.approved_by,
    approvedAt:     row.approved_at,
    metadata:       row.metadata,
    isActive:       row.is_active,
    isDeleted:      row.is_deleted,
    createdBy:      row.created_by,
    updatedBy:      row.updated_by,
    deletedBy:      row.deleted_by,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

// ─── Global Reference Tables ──────────────────────────────────────────────────

export async function getJobCategories(): Promise<JobCategory[]> {
  const { data, error } = await supabase
    .from('job_categories')
    .select('*')
    .eq('is_active', true)
    .order('default_name', { ascending: true });

  if (error) throw new Error(`Failed to load job categories: ${error.message}`);
  return (data ?? []).map((row) => mapJobCategory(row as JobCategoryRow));
}

export async function getGlobalIndustries(): Promise<GlobalIndustry[]> {
  const { data, error } = await supabase
    .from('global_industries')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load global industries: ${error.message}`);
  return (data ?? []).map((row) => mapGlobalIndustry(row as GlobalIndustryRow));
}

// ─── Country Job Categories ───────────────────────────────────────────────────

export async function getCountryJobCategories(countryId: string): Promise<CountryJobCategory[]> {
  const { data, error } = await supabase
    .from('country_job_categories')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('display_name', { ascending: true });

  if (error) throw new Error(`Failed to load job categories: ${error.message}`);
  return (data ?? []).map((row) => mapCountryJobCategory(row as CountryJobCategoryRow));
}

// ─── Country Industries ───────────────────────────────────────────────────────

export async function getCountryIndustries(countryId: string): Promise<CountryIndustry[]> {
  const { data, error } = await supabase
    .from('country_industries')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load industries: ${error.message}`);
  return (data ?? []).map((row) => mapCountryIndustry(row as CountryIndustryRow));
}

// ─── Employment Rules ─────────────────────────────────────────────────────────

export async function getCountryEmploymentRules(
  countryId: string
): Promise<CountryEmploymentRules | null> {
  const { data, error } = await supabase
    .from('country_employment_rules')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load employment rules: ${error.message}`);
  if (!data) return null;
  return mapEmploymentRules(data as CountryEmploymentRulesRow);
}

// ─── AI Localization ──────────────────────────────────────────────────────────

export async function getCountryAiLocalization(
  countryId: string
): Promise<CountryAiLocalization | null> {
  const { data, error } = await supabase
    .from('country_ai_localization')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load AI localization: ${error.message}`);
  if (!data) return null;
  return mapAiLocalization(data as CountryAiLocalizationRow);
}

// ─── Supported Languages ──────────────────────────────────────────────────────

export async function getCountrySupportedLanguages(
  countryId: string
): Promise<CountrySupportedLanguage[]> {
  const { data, error } = await supabase
    .from('country_supported_languages')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .order('is_default', { ascending: false });

  if (error) throw new Error(`Failed to load supported languages: ${error.message}`);
  return (data ?? []).map((row) => {
    const r = row as CountrySupportedLanguageRow;
    return {
      id:         r.id,
      countryId:  r.country_id,
      languageId: r.language_id,
      isDefault:  r.is_default,
      isActive:   r.is_active,
      createdAt:  r.created_at,
    };
  });
}

// ─── Search Config ────────────────────────────────────────────────────────────

export async function getCountrySearchConfig(
  countryId: string
): Promise<CountrySearchConfig | null> {
  const { data, error } = await supabase
    .from('country_search_configs')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load search config: ${error.message}`);
  if (!data) return null;
  return mapSearchConfig(data as CountrySearchConfigRow);
}

// ─── Geo Rules ────────────────────────────────────────────────────────────────

export async function getCountryGeoRules(countryId: string): Promise<CountryGeoRule[]> {
  const { data, error } = await supabase
    .from('country_geo_rules')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('region_code', { ascending: true });

  if (error) throw new Error(`Failed to load geo rules: ${error.message}`);
  return (data ?? []).map((row) => mapGeoRule(row as CountryGeoRuleRow));
}

// ─── Search Boosts ────────────────────────────────────────────────────────────

export async function getActiveSearchBoosts(
  countryId: string,
  entityType?: BoostEntityType
): Promise<CountrySearchBoost[]> {
  const now = new Date().toISOString();

  let query = supabase
    .from('country_search_boosts')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .lte('starts_at', now)
    .gte('expires_at', now);

  if (entityType !== undefined) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query.order('priority', { ascending: false });

  if (error) throw new Error(`Failed to load search boosts: ${error.message}`);
  return (data ?? []).map((row) => mapSearchBoost(row as CountrySearchBoostRow));
}

// ─── Skill Taxonomy ───────────────────────────────────────────────────────────

export async function getCountrySkillTaxonomy(countryId: string): Promise<CountrySkillTaxonomy[]> {
  const { data, error } = await supabase
    .from('country_skill_taxonomy')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('display_name', { ascending: true });

  if (error) throw new Error(`Failed to load skill taxonomy: ${error.message}`);
  return (data ?? []).map((row) => {
    const r = row as CountrySkillTaxonomyRow;
    return {
      id:               r.id,
      countryId:        r.country_id,
      globalCategoryId: r.global_category_id,
      skillKey:         r.skill_key,
      displayName:      r.display_name,
      slug:             r.slug,
      description:      r.description,
      isRegulatedSkill: r.is_regulated_skill,
      metadata:         r.metadata,
      isActive:         r.is_active,
      isDeleted:        r.is_deleted,
      createdAt:        r.created_at,
      updatedAt:        r.updated_at,
    };
  });
}

// ─── License Requirements ─────────────────────────────────────────────────────

export async function getCountryLicenseRequirements(
  countryId: string
): Promise<CountryLicenseRequirement[]> {
  const { data, error } = await supabase
    .from('country_license_requirements')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load license requirements: ${error.message}`);
  return (data ?? []).map((row) => {
    const r = row as CountryLicenseRequirementRow;
    return {
      id:                   r.id,
      countryId:            r.country_id,
      licenseCode:          r.license_code,
      name:                 r.name,
      issuingAuthority:     r.issuing_authority,
      renewalPeriodMonths:  r.renewal_period_months,
      requiresExam:         r.requires_exam,
      metadata:             r.metadata,
      isActive:             r.is_active,
      isDeleted:            r.is_deleted,
      createdAt:            r.created_at,
      updatedAt:            r.updated_at,
    };
  });
}

// ─── Salary Benchmarks ────────────────────────────────────────────────────────

export async function getCountrySalaryBenchmarks(
  countryId: string,
  globalCategoryId?: string,
  experienceLevel?: ExperienceLevel
): Promise<CountrySalaryBenchmark[]> {
  let query = supabase
    .from('country_salary_benchmarks')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false);

  if (globalCategoryId !== undefined) {
    query = query.eq('global_category_id', globalCategoryId);
  }

  if (experienceLevel !== undefined) {
    query = query.eq('experience_level', experienceLevel);
  }

  const { data, error } = await query.order('experience_level', { ascending: true });

  if (error) throw new Error(`Failed to load salary benchmarks: ${error.message}`);
  return (data ?? []).map((row) => {
    const r = row as CountrySalaryBenchmarkRow;
    return {
      id:               r.id,
      countryId:        r.country_id,
      globalCategoryId: r.global_category_id,
      experienceLevel:  r.experience_level,
      minBenchmark:     r.min_benchmark,
      medianBenchmark:  r.median_benchmark,
      maxBenchmark:     r.max_benchmark,
      currencyId:       r.currency_id,
      period:           r.period,
      metadata:         r.metadata,
      isActive:         r.is_active,
      isDeleted:        r.is_deleted,
      createdAt:        r.created_at,
      updatedAt:        r.updated_at,
    };
  });
}

// ─── Labor Laws History ───────────────────────────────────────────────────────

export async function getCountryLaborLawsHistory(
  countryId: string
): Promise<CountryLaborLawsHistory[]> {
  const { data, error } = await supabase
    .from('country_labor_laws_history')
    .select('*')
    .eq('country_id', countryId)
    .order('effective_from', { ascending: false });

  if (error) throw new Error(`Failed to load labor laws history: ${error.message}`);
  return (data ?? []).map((row) => {
    const r = row as CountryLaborLawsHistoryRow;
    return {
      id:               r.id,
      countryId:        r.country_id,
      employmentRuleId: r.employment_rule_id,
      versionLabel:     r.version_label,
      summaryOfChanges: r.summary_of_changes,
      effectiveFrom:    r.effective_from,
      effectiveTo:      r.effective_to,
      metadata:         r.metadata,
      createdBy:        r.created_by,
      createdAt:        r.created_at,
    };
  });
}

// ─── Search Synonyms ──────────────────────────────────────────────────────────

export async function getCountrySearchSynonyms(
  countryId: string,
  languageId?: string
): Promise<CountrySearchSynonym[]> {
  let query = supabase
    .from('country_search_synonyms')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true);

  if (languageId !== undefined) {
    query = query.eq('language_id', languageId);
  }

  const { data, error } = await query.order('term', { ascending: true });

  if (error) throw new Error(`Failed to load search synonyms: ${error.message}`);
  return (data ?? []).map((row) => {
    const r = row as CountrySearchSynonymRow;
    return {
      id:         r.id,
      countryId:  r.country_id,
      term:       r.term,
      synonyms:   r.synonyms,
      languageId: r.language_id,
      metadata:   r.metadata,
      isActive:   r.is_active,
      createdAt:  r.created_at,
    };
  });
}
