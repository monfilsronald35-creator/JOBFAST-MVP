import { supabase } from '../../lib/supabase';
import type {
  PaymentProvider,
  VerificationProvider,
  TaxAuthority,
  CountrySettings,
  CountrySupportedFeature,
  CountryPaymentSettings,
  CountryTaxSettings,
  CountryVerificationRule,
  CountryEmergencyContact,
  CountryPermission,
  ProviderType,
  MeasurementSystem,
  DateFormat,
  NumberFormat,
  CurrencyDisplayFormat,
} from '../../types/countrySettings';

// ─── Row Types ────────────────────────────────────────────────────────────────

type PaymentProviderRow = {
  id: string;
  name: string;
  display_name: string;
  provider_type: ProviderType;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type VerificationProviderRow = {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type TaxAuthorityRow = {
  id: string;
  name: string;
  country_id: string;
  portal_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type CountrySettingsRow = {
  id: string;
  country_id: string;
  is_operational: boolean;
  maintenance_mode: boolean;
  measurement_system: MeasurementSystem;
  data_region: string;
  storage_region: string;
  backup_region: string;
  replication_region: string;
  gdpr_enabled: boolean;
  ccpa_enabled: boolean;
  lgpd_enabled: boolean;
  pipeda_enabled: boolean;
  hipaa_enabled: boolean;
  ai_enabled: boolean;
  ai_face_recognition: boolean;
  ai_voice: boolean;
  ai_recommendations: boolean;
  ai_scoring: boolean;
  crypto_enabled: boolean;
  btc_allowed: boolean;
  eth_allowed: boolean;
  usdt_allowed: boolean;
  stablecoins_allowed: boolean;
  defi_allowed: boolean;
  iban_required: boolean;
  swift_required: boolean;
  routing_required: boolean;
  sort_code_required: boolean;
  libphonenumber_region: string;
  example_phone: string | null;
  minimum_digits: number;
  maximum_digits: number;
  address_template: Record<string, unknown>;
  date_format: DateFormat;
  number_format: NumberFormat;
  currency_format: CurrencyDisplayFormat;
  weekend_days: string[];
  api_region: string;
  cdn_region: string;
  edge_region: string;
  metadata: Record<string, unknown>;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type CountrySupportedFeatureRow = {
  id: string;
  country_id: string;
  feature_key: string;
  is_supported: boolean;
  requires_kyc: boolean;
  min_age_requirement: number;
  rollout_percentage: number;
  is_beta: boolean;
  internal_only: boolean;
  enterprise_only: boolean;
  launch_date: string | null;
  feature_config: Record<string, unknown>;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type CountryPaymentSettingsRow = {
  id: string;
  country_id: string;
  provider_id: string;
  is_default: boolean;
  supports_payouts: boolean;
  supports_deposits: boolean;
  refund_supported: boolean;
  partial_refund: boolean;
  chargeback_supported: boolean;
  escrow_supported: boolean;
  instant_payout: boolean;
  supported_currencies: string[];
  processing_fee_percentage: number;
  processing_fee_fixed: number;
  min_transaction_amount: number;
  max_transaction_amount: number;
  gateway_config: Record<string, unknown>;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type CountryTaxSettingsRow = {
  id: string;
  country_id: string;
  tax_authority_id: string | null;
  tax_name: string;
  tax_rate: number;
  applies_to_services: boolean;
  applies_to_goods: boolean;
  vat_number_required: boolean;
  company_registration_required: boolean;
  tax_id_format_regex: string | null;
  invoice_prefix: string;
  invoice_template: Record<string, unknown>;
  is_inclusive: boolean;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type CountryVerificationRuleRow = {
  id: string;
  country_id: string;
  verification_provider_id: string;
  id_type: string;
  is_mandatory: boolean;
  requires_address_proof: boolean;
  requires_biometrics: boolean;
  face_match_required: boolean;
  liveness_check: boolean;
  document_expiry_check: boolean;
  minimum_age: number;
  sanctions_check: boolean;
  pep_check: boolean;
  aml_check: boolean;
  allowed_issuing_authorities: string[] | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type CountryEmergencyContactRow = {
  id: string;
  country_id: string;
  service_name: string;
  emergency_number: string;
  website: string | null;
  sms_number: string | null;
  email: string | null;
  available_languages: string[];
  gps_supported: boolean;
  description: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  created_at: string;
  updated_at: string;
};

type CountryPermissionRow = {
  id: string;
  country_id: string;
  permission_key: string;
  is_allowed: boolean;
  requires_local_entity: boolean;
  requires_license: boolean;
  requires_business_registration: boolean;
  requires_insurance: boolean;
  compliance_notes: string | null;
  legal_basis: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapPaymentProvider(row: PaymentProviderRow): PaymentProvider {
  return {
    id:           row.id,
    name:         row.name,
    displayName:  row.display_name,
    providerType: row.provider_type,
    isActive:     row.is_active,
    metadata:     row.metadata,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
  };
}

function mapVerificationProvider(row: VerificationProviderRow): VerificationProvider {
  return {
    id:          row.id,
    name:        row.name,
    displayName: row.display_name,
    isActive:    row.is_active,
    metadata:    row.metadata,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

function mapTaxAuthority(row: TaxAuthorityRow): TaxAuthority {
  return {
    id:        row.id,
    name:      row.name,
    countryId: row.country_id,
    portalUrl: row.portal_url,
    metadata:  row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCountrySettings(row: CountrySettingsRow): CountrySettings {
  return {
    id:                   row.id,
    countryId:            row.country_id,
    isOperational:        row.is_operational,
    maintenanceMode:      row.maintenance_mode,
    measurementSystem:    row.measurement_system,
    dataRegion:           row.data_region,
    storageRegion:        row.storage_region,
    backupRegion:         row.backup_region,
    replicationRegion:    row.replication_region,
    gdprEnabled:          row.gdpr_enabled,
    ccpaEnabled:          row.ccpa_enabled,
    lgpdEnabled:          row.lgpd_enabled,
    pipedaEnabled:        row.pipeda_enabled,
    hipaaEnabled:         row.hipaa_enabled,
    aiEnabled:            row.ai_enabled,
    aiFaceRecognition:    row.ai_face_recognition,
    aiVoice:              row.ai_voice,
    aiRecommendations:    row.ai_recommendations,
    aiScoring:            row.ai_scoring,
    cryptoEnabled:        row.crypto_enabled,
    btcAllowed:           row.btc_allowed,
    ethAllowed:           row.eth_allowed,
    usdtAllowed:          row.usdt_allowed,
    stablecoinsAllowed:   row.stablecoins_allowed,
    defiAllowed:          row.defi_allowed,
    ibanRequired:         row.iban_required,
    swiftRequired:        row.swift_required,
    routingRequired:      row.routing_required,
    sortCodeRequired:     row.sort_code_required,
    libphonenumberRegion: row.libphonenumber_region,
    examplePhone:         row.example_phone,
    minimumDigits:        row.minimum_digits,
    maximumDigits:        row.maximum_digits,
    addressTemplate:      row.address_template,
    dateFormat:           row.date_format,
    numberFormat:         row.number_format,
    currencyFormat:       row.currency_format,
    weekendDays:          row.weekend_days,
    apiRegion:            row.api_region,
    cdnRegion:            row.cdn_region,
    edgeRegion:           row.edge_region,
    metadata:             row.metadata,
    isDeleted:            row.is_deleted,
    deletedAt:            row.deleted_at,
    deletedReason:        row.deleted_reason,
    version:              row.version,
    createdBy:            row.created_by,
    updatedBy:            row.updated_by,
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
  };
}

function mapSupportedFeature(row: CountrySupportedFeatureRow): CountrySupportedFeature {
  return {
    id:                row.id,
    countryId:         row.country_id,
    featureKey:        row.feature_key,
    isSupported:       row.is_supported,
    requiresKyc:       row.requires_kyc,
    minAgeRequirement: row.min_age_requirement,
    rolloutPercentage: row.rollout_percentage,
    isBeta:            row.is_beta,
    internalOnly:      row.internal_only,
    enterpriseOnly:    row.enterprise_only,
    launchDate:        row.launch_date,
    featureConfig:     row.feature_config,
    isDeleted:         row.is_deleted,
    deletedAt:         row.deleted_at,
    deletedReason:     row.deleted_reason,
    version:           row.version,
    metadata:          row.metadata,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
  };
}

function mapPaymentSettings(row: CountryPaymentSettingsRow): CountryPaymentSettings {
  return {
    id:                     row.id,
    countryId:              row.country_id,
    providerId:             row.provider_id,
    isDefault:              row.is_default,
    supportsPayouts:        row.supports_payouts,
    supportsDeposits:       row.supports_deposits,
    refundSupported:        row.refund_supported,
    partialRefund:          row.partial_refund,
    chargebackSupported:    row.chargeback_supported,
    escrowSupported:        row.escrow_supported,
    instantPayout:          row.instant_payout,
    supportedCurrencies:    row.supported_currencies,
    processingFeePercentage: row.processing_fee_percentage,
    processingFeeFixed:     row.processing_fee_fixed,
    minTransactionAmount:   row.min_transaction_amount,
    maxTransactionAmount:   row.max_transaction_amount,
    gatewayConfig:          row.gateway_config,
    isActive:               row.is_active,
    isDeleted:              row.is_deleted,
    deletedAt:              row.deleted_at,
    deletedReason:          row.deleted_reason,
    version:                row.version,
    metadata:               row.metadata,
    createdAt:              row.created_at,
    updatedAt:              row.updated_at,
  };
}

function mapTaxSettings(row: CountryTaxSettingsRow): CountryTaxSettings {
  return {
    id:                           row.id,
    countryId:                    row.country_id,
    taxAuthorityId:               row.tax_authority_id,
    taxName:                      row.tax_name,
    taxRate:                      row.tax_rate,
    appliesToServices:            row.applies_to_services,
    appliesToGoods:               row.applies_to_goods,
    vatNumberRequired:            row.vat_number_required,
    companyRegistrationRequired:  row.company_registration_required,
    taxIdFormatRegex:             row.tax_id_format_regex,
    invoicePrefix:                row.invoice_prefix,
    invoiceTemplate:              row.invoice_template,
    isInclusive:                  row.is_inclusive,
    isActive:                     row.is_active,
    isDeleted:                    row.is_deleted,
    deletedAt:                    row.deleted_at,
    deletedReason:                row.deleted_reason,
    version:                      row.version,
    metadata:                     row.metadata,
    createdAt:                    row.created_at,
    updatedAt:                    row.updated_at,
  };
}

function mapVerificationRule(row: CountryVerificationRuleRow): CountryVerificationRule {
  return {
    id:                        row.id,
    countryId:                 row.country_id,
    verificationProviderId:    row.verification_provider_id,
    idType:                    row.id_type,
    isMandatory:               row.is_mandatory,
    requiresAddressProof:      row.requires_address_proof,
    requiresBiometrics:        row.requires_biometrics,
    faceMatchRequired:         row.face_match_required,
    livenessCheck:             row.liveness_check,
    documentExpiryCheck:       row.document_expiry_check,
    minimumAge:                row.minimum_age,
    sanctionsCheck:            row.sanctions_check,
    pepCheck:                  row.pep_check,
    amlCheck:                  row.aml_check,
    allowedIssuingAuthorities: row.allowed_issuing_authorities,
    isActive:                  row.is_active,
    isDeleted:                 row.is_deleted,
    deletedAt:                 row.deleted_at,
    deletedReason:             row.deleted_reason,
    version:                   row.version,
    metadata:                  row.metadata,
    createdAt:                 row.created_at,
    updatedAt:                 row.updated_at,
  };
}

function mapEmergencyContact(row: CountryEmergencyContactRow): CountryEmergencyContact {
  return {
    id:                 row.id,
    countryId:          row.country_id,
    serviceName:        row.service_name,
    emergencyNumber:    row.emergency_number,
    website:            row.website,
    smsNumber:          row.sms_number,
    email:              row.email,
    availableLanguages: row.available_languages,
    gpsSupported:       row.gps_supported,
    description:        row.description,
    metadata:           row.metadata,
    isActive:           row.is_active,
    isDeleted:          row.is_deleted,
    deletedAt:          row.deleted_at,
    deletedReason:      row.deleted_reason,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
  };
}

function mapPermission(row: CountryPermissionRow): CountryPermission {
  return {
    id:                           row.id,
    countryId:                    row.country_id,
    permissionKey:                row.permission_key,
    isAllowed:                    row.is_allowed,
    requiresLocalEntity:          row.requires_local_entity,
    requiresLicense:              row.requires_license,
    requiresBusinessRegistration: row.requires_business_registration,
    requiresInsurance:            row.requires_insurance,
    complianceNotes:              row.compliance_notes,
    legalBasis:                   row.legal_basis,
    isDeleted:                    row.is_deleted,
    deletedAt:                    row.deleted_at,
    deletedReason:                row.deleted_reason,
    version:                      row.version,
    metadata:                     row.metadata,
    createdAt:                    row.created_at,
    updatedAt:                    row.updated_at,
  };
}

// ─── Reference Entities ───────────────────────────────────────────────────────

export async function getPaymentProviders(): Promise<PaymentProvider[]> {
  const { data, error } = await supabase
    .from('payment_providers')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load payment providers: ${error.message}`);
  return (data ?? []).map((row) => mapPaymentProvider(row as PaymentProviderRow));
}

export async function getVerificationProviders(): Promise<VerificationProvider[]> {
  const { data, error } = await supabase
    .from('verification_providers')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load verification providers: ${error.message}`);
  return (data ?? []).map((row) => mapVerificationProvider(row as VerificationProviderRow));
}

export async function getTaxAuthoritiesByCountry(countryId: string): Promise<TaxAuthority[]> {
  const { data, error } = await supabase
    .from('tax_authorities')
    .select('*')
    .eq('country_id', countryId)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load tax authorities: ${error.message}`);
  return (data ?? []).map((row) => mapTaxAuthority(row as TaxAuthorityRow));
}

// ─── Country Settings ─────────────────────────────────────────────────────────

export async function getCountrySettings(countryId: string): Promise<CountrySettings | null> {
  const { data, error } = await supabase
    .from('country_settings')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to load country settings: ${error.message}`);
  if (!data) return null;
  return mapCountrySettings(data as CountrySettingsRow);
}

// ─── Supported Features ───────────────────────────────────────────────────────

export async function getCountrySupportedFeatures(
  countryId: string
): Promise<CountrySupportedFeature[]> {
  const { data, error } = await supabase
    .from('country_supported_features')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .order('feature_key', { ascending: true });

  if (error) throw new Error(`Failed to load supported features: ${error.message}`);
  return (data ?? []).map((row) => mapSupportedFeature(row as CountrySupportedFeatureRow));
}

export async function isFeatureSupported(
  countryId: string,
  featureKey: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('country_supported_features')
    .select('is_supported, rollout_percentage')
    .eq('country_id', countryId)
    .eq('feature_key', featureKey)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to check feature: ${error.message}`);
  if (!data) return false;
  const row = data as { is_supported: boolean; rollout_percentage: number };
  return row.is_supported && row.rollout_percentage === 100;
}

// ─── Payment Settings ─────────────────────────────────────────────────────────

export async function getCountryPaymentSettings(
  countryId: string
): Promise<CountryPaymentSettings[]> {
  const { data, error } = await supabase
    .from('country_payment_settings')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('is_default', { ascending: false });

  if (error) throw new Error(`Failed to load payment settings: ${error.message}`);
  return (data ?? []).map((row) => mapPaymentSettings(row as CountryPaymentSettingsRow));
}

// ─── Tax Settings ─────────────────────────────────────────────────────────────

export async function getCountryTaxSettings(
  countryId: string
): Promise<CountryTaxSettings[]> {
  const { data, error } = await supabase
    .from('country_tax_settings')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('tax_name', { ascending: true });

  if (error) throw new Error(`Failed to load tax settings: ${error.message}`);
  return (data ?? []).map((row) => mapTaxSettings(row as CountryTaxSettingsRow));
}

// ─── Verification Rules ───────────────────────────────────────────────────────

export async function getCountryVerificationRules(
  countryId: string
): Promise<CountryVerificationRule[]> {
  const { data, error } = await supabase
    .from('country_verification_rules')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('id_type', { ascending: true });

  if (error) throw new Error(`Failed to load verification rules: ${error.message}`);
  return (data ?? []).map((row) => mapVerificationRule(row as CountryVerificationRuleRow));
}

// ─── Emergency Contacts ───────────────────────────────────────────────────────

export async function getCountryEmergencyContacts(
  countryId: string
): Promise<CountryEmergencyContact[]> {
  const { data, error } = await supabase
    .from('country_emergency_contacts')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('service_name', { ascending: true });

  if (error) throw new Error(`Failed to load emergency contacts: ${error.message}`);
  return (data ?? []).map((row) => mapEmergencyContact(row as CountryEmergencyContactRow));
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function getCountryPermissions(
  countryId: string
): Promise<CountryPermission[]> {
  const { data, error } = await supabase
    .from('country_permissions')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_deleted', false)
    .order('permission_key', { ascending: true });

  if (error) throw new Error(`Failed to load permissions: ${error.message}`);
  return (data ?? []).map((row) => mapPermission(row as CountryPermissionRow));
}

export async function isPermissionAllowed(
  countryId: string,
  permissionKey: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('country_permissions')
    .select('is_allowed')
    .eq('country_id', countryId)
    .eq('permission_key', permissionKey)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to check permission: ${error.message}`);
  if (!data) return false;
  return (data as { is_allowed: boolean }).is_allowed;
}
