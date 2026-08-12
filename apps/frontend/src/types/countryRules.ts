export const PAY_RATE_PERIODS = ['hourly', 'monthly', 'yearly', 'project'] as const;

export type PayRatePeriod = typeof PAY_RATE_PERIODS[number];

export const WAGE_PERIODS = ['hourly', 'monthly'] as const;

export type WagePeriod = typeof WAGE_PERIODS[number];

export const AI_STRICTNESS_LEVELS = ['strict', 'balanced', 'relaxed'] as const;

export type AiStrictnessLevel = typeof AI_STRICTNESS_LEVELS[number];

export const BOOST_ENTITY_TYPES = [
  'job',
  'company',
  'service',
  'property',
  'tourism',
] as const;

export type BoostEntityType = typeof BOOST_ENTITY_TYPES[number];

export const EXPERIENCE_LEVELS = [
  'entry',
  'mid',
  'senior',
  'lead',
  'executive',
] as const;

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];

export const SALARY_PERIODS = ['hourly', 'monthly', 'yearly'] as const;

export type SalaryPeriod = typeof SALARY_PERIODS[number];

export interface JobCategory {
  id: string;
  categoryKey: string;
  defaultName: string;
  slug: string;
  description: string | null;
  icon: string | null;
  searchVector: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalIndustry {
  id: string;
  industryCode: string;
  name: string;
  slug: string;
  description: string | null;
  searchVector: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CountryJobCategory {
  id: string;
  countryId: string;
  globalCategoryId: string;
  displayName: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  requiresCertification: boolean;
  minimumPayRate: number | null;
  payRatePeriod: PayRatePeriod;
  aiMatchingWeight: number;
  metadata: Record<string, unknown>;
  effectiveVersion: number;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdIp: string | null;
  updatedIp: string | null;
  createdDevice: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountryIndustry {
  id: string;
  countryId: string;
  globalIndustryId: string;
  name: string;
  slug: string;
  description: string | null;
  isRegulated: boolean;
  regulatoryBody: string | null;
  requiresBackgroundCheck: boolean;
  standardInsuranceRequired: boolean;
  metadata: Record<string, unknown>;
  effectiveVersion: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdIp: string | null;
  updatedIp: string | null;
  createdDevice: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountryEmploymentRules {
  id: string;
  countryId: string;
  standardWeeklyHours: number;
  maximumWeeklyHours: number;
  maximumDailyHours: number;
  minimumRestHours: number;
  mandatoryBreakMinutes: number;
  overtimeAfterHours: number;
  overtimeMultiplier: number;
  nightShiftMultiplier: number;
  holidayMultiplier: number;
  weekendMultiplier: number;
  minimumWageAmount: number;
  currencyId: string;
  minimumWagePeriod: WagePeriod;
  mandatoryPaidVacationDays: number;
  mandatorySickLeaveDays: number;
  maternityLeaveWeeks: number;
  paternityLeaveWeeks: number;
  severanceRequired: boolean;
  allowIndependentContractors: boolean;
  allowRemoteForeignWorkers: boolean;
  allowInternships: boolean;
  mandatoryWrittenContract: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  metadata: Record<string, unknown>;
  effectiveVersion: number;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdIp: string | null;
  updatedIp: string | null;
  createdDevice: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountryAiLocalization {
  id: string;
  countryId: string;
  primaryLanguageId: string;
  enableLocalSlangParsing: boolean;
  embeddingModel: string;
  translationModel: string;
  rankingModel: string;
  moderationModel: string;
  speechModel: string;
  ocrModel: string;
  resumeParsingAiStrictness: AiStrictnessLevel;
  jobDescriptionAiFilter: boolean;
  autoTranslateListings: boolean;
  aiBiasMitigationEnabled: boolean;
  maxTokensResponseLimit: number;
  metadata: Record<string, unknown>;
  effectiveVersion: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdIp: string | null;
  updatedIp: string | null;
  createdDevice: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountrySupportedLanguage {
  id: string;
  countryId: string;
  languageId: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CountrySearchConfig {
  id: string;
  countryId: string;
  defaultSearchRadiusKm: number;
  maxSearchRadiusKm: number;
  fuzzyMatchingEnabled: boolean;
  semanticSearch: boolean;
  vectorSearch: boolean;
  hybridSearch: boolean;
  rerankingEnabled: boolean;
  cacheEnabled: boolean;
  synonymsDictionaryKey: string | null;
  rankingWeights: Record<string, unknown>;
  metadata: Record<string, unknown>;
  effectiveVersion: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountryGeoRule {
  id: string;
  countryId: string;
  regionCode: string;
  regionName: string;
  isGeoFenced: boolean;
  blockForeignIp: boolean;
  requireExactGps: boolean;
  maxAllowedAccuracyMeters: number;
  geometry: string | null;
  geography: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountrySearchBoost {
  id: string;
  countryId: string;
  entityType: BoostEntityType;
  entityId: string;
  boostMultiplier: number;
  priority: number;
  manualOverride: boolean;
  boostReason: string;
  createdReason: string | null;
  startsAt: string;
  expiresAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountrySkillTaxonomy {
  id: string;
  countryId: string;
  globalCategoryId: string | null;
  skillKey: string;
  displayName: string;
  slug: string;
  description: string | null;
  isRegulatedSkill: boolean;
  metadata: Record<string, unknown>;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CountryLicenseRequirement {
  id: string;
  countryId: string;
  licenseCode: string;
  name: string;
  issuingAuthority: string;
  renewalPeriodMonths: number;
  requiresExam: boolean;
  metadata: Record<string, unknown>;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CountrySalaryBenchmark {
  id: string;
  countryId: string;
  globalCategoryId: string | null;
  experienceLevel: ExperienceLevel;
  minBenchmark: number;
  medianBenchmark: number;
  maxBenchmark: number;
  currencyId: string;
  period: SalaryPeriod;
  metadata: Record<string, unknown>;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CountryLaborLawsHistory {
  id: string;
  countryId: string;
  employmentRuleId: string | null;
  versionLabel: string;
  summaryOfChanges: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

export interface CountrySearchSynonym {
  id: string;
  countryId: string;
  term: string;
  synonyms: string[];
  languageId: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}
