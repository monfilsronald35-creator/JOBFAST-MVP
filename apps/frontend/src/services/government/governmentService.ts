import { supabase } from '../../lib/supabase';
import type {
  GovernmentEntity,
  EntityType,
  EntityVerificationStatus,
  GovernmentOffice,
  CitizenProfile,
  ResidencyStatus,
  License,
  LicenseType,
  LicenseStatus,
  DiplomaticTreaty,
  TreatyType,
  InfrastructureDigitalTwin,
  InfrastructureType,
  InfrastructureStatus,
  Permit,
  PermitType,
  PermitWorkflowStatus,
  Certificate,
  CertificateType,
  CertificateVerificationStatus,
  GovernmentApplication,
  ApplicationStage,
  SmartPermitAutomation,
  AutomatedApprovalStatus,
  WorkflowPhase,
  PhaseStatus,
  CrossBorderCredentialVerification,
  ValidationVerdict,
  VaultAccessLog,
  TaxService,
  TaxType,
  TaxFilingStatus,
  GovernmentPayment,
  GovServiceType,
  GovPaymentStatus,
  DigitalSignature,
  TaxAuditResult,
  AiAuditVerdict,
  CbdcSettlement,
  CbdcSettlementStatus,
  FiscalReconciliation,
  ReconciliationStatus,
  CryptographicStamp,
  ResistanceLevel,
  RevenueOptimizationForecast,
  IdentityCheck,
  IdentityDocumentType,
  IdentityVerificationStatus,
  BlockchainVerificationEntry,
  PublicRecordAudit,
  ComplianceCheckResult,
  ComplianceVerdict,
  ZkpIdentityVerification,
  ZkpStatus,
  HyperLedgerConsensusNode,
  BlockImmutabilityStatus,
  ZeroTrustAccessAudit,
  MitigationAction,
  ComplianceSentinelResult,
  SentinelVerdict,
} from '../../types/government';

// Backend-only fields (never queried from frontend):
//   government_entities: licensing_metadata — internal government configuration
//   citizen_profiles: biometric_hash — ABSOLUTE NEVER

// ── Column constants ───────────────────────────────────────────────────────

const ENTITY_COLS =
  'id, organization_id, entity_name, country, entity_type, currency, verification_status, created_at, updated_at';
// licensing_metadata excluded — internal government configuration

const OFFICE_COLS =
  'id, entity_id, office_name, city, address, gps_latitude, gps_longitude, working_hours, departments_housed, is_active, created_at';

const CITIZEN_COLS =
  'id, user_id, national_id_number, country_of_citizenship, residential_address, family_members_json, residency_status, created_at, updated_at';
// biometric_hash excluded — ABSOLUTE NEVER

const LICENSE_COLS =
  'id, entity_id, citizen_id, license_type, holder_name, license_number, qr_validation_code, status, issued_date, expires_date, created_at, updated_at';

// ── Row types ─────────────────────────────────────────────────────────────

type EntityRow = {
  id: string;
  organization_id: string | null;
  entity_name: string;
  country: string;
  entity_type: EntityType;
  currency: string;
  verification_status: EntityVerificationStatus;
  created_at: string;
  updated_at: string;
};

type OfficeRow = {
  id: string;
  entity_id: string;
  office_name: string;
  city: string;
  address: string;
  gps_latitude: number;
  gps_longitude: number;
  working_hours: Record<string, unknown>;
  departments_housed: string[];
  is_active: boolean;
  created_at: string;
};

type CitizenRow = {
  id: string;
  user_id: string;
  national_id_number: string;
  country_of_citizenship: string;
  residential_address: string;
  family_members_json: Record<string, unknown>[];
  residency_status: ResidencyStatus;
  created_at: string;
  updated_at: string;
};

type LicenseRow = {
  id: string;
  entity_id: string;
  citizen_id: string | null;
  license_type: LicenseType;
  holder_name: string;
  license_number: string;
  qr_validation_code: string;
  status: LicenseStatus;
  issued_date: string;
  expires_date: string;
  created_at: string;
  updated_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapEntity(r: EntityRow): GovernmentEntity {
  return {
    id: r.id,
    organizationId: r.organization_id,
    entityName: r.entity_name,
    country: r.country,
    entityType: r.entity_type,
    currency: r.currency,
    verificationStatus: r.verification_status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapOffice(r: OfficeRow): GovernmentOffice {
  return {
    id: r.id,
    entityId: r.entity_id,
    officeName: r.office_name,
    city: r.city,
    address: r.address,
    gpsLatitude: r.gps_latitude,
    gpsLongitude: r.gps_longitude,
    workingHours: r.working_hours,
    departmentsHoused: r.departments_housed,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapCitizen(r: CitizenRow): CitizenProfile {
  return {
    id: r.id,
    userId: r.user_id,
    nationalIdNumber: r.national_id_number,
    countryOfCitizenship: r.country_of_citizenship,
    residentialAddress: r.residential_address,
    familyMembersJson: r.family_members_json,
    residencyStatus: r.residency_status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapLicense(r: LicenseRow): License {
  return {
    id: r.id,
    entityId: r.entity_id,
    citizenId: r.citizen_id,
    licenseType: r.license_type,
    holderName: r.holder_name,
    licenseNumber: r.license_number,
    qrValidationCode: r.qr_validation_code,
    status: r.status,
    issuedDate: r.issued_date,
    expiresDate: r.expires_date,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── Government Entity functions ───────────────────────────────────────────

export async function getGovernmentEntities(options: {
  country?: string;
  entityType?: EntityType;
  verificationStatus?: EntityVerificationStatus;
  limit?: number;
} = {}): Promise<GovernmentEntity[]> {
  let q = supabase
    .from('government_entities')
    .select(ENTITY_COLS);

  if (options.country) q = q.eq('country', options.country);
  if (options.entityType) q = q.eq('entity_type', options.entityType);
  if (options.verificationStatus) q = q.eq('verification_status', options.verificationStatus);

  const { data, error } = await q
    .order('entity_name', { ascending: true })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as EntityRow[]).map(mapEntity);
}

export async function getGovernmentEntity(id: string): Promise<GovernmentEntity | null> {
  const { data, error } = await supabase
    .from('government_entities')
    .select(ENTITY_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapEntity(data as EntityRow) : null;
}

export async function getEntitiesByCountry(
  country: string,
  options: { entityType?: EntityType; limit?: number } = {}
): Promise<GovernmentEntity[]> {
  let q = supabase
    .from('government_entities')
    .select(ENTITY_COLS)
    .eq('country', country)
    .eq('verification_status', 'active');

  if (options.entityType) q = q.eq('entity_type', options.entityType);

  const { data, error } = await q
    .order('entity_name', { ascending: true })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as EntityRow[]).map(mapEntity);
}

export async function getEntitiesByType(
  entityType: EntityType,
  options: { country?: string; limit?: number } = {}
): Promise<GovernmentEntity[]> {
  let q = supabase
    .from('government_entities')
    .select(ENTITY_COLS)
    .eq('entity_type', entityType);

  if (options.country) q = q.eq('country', options.country);

  const { data, error } = await q
    .order('entity_name', { ascending: true })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as EntityRow[]).map(mapEntity);
}

// ── Government Office functions ───────────────────────────────────────────

export async function getGovernmentOffices(
  entityId: string,
  options: { activeOnly?: boolean; limit?: number } = {}
): Promise<GovernmentOffice[]> {
  let q = supabase
    .from('government_offices')
    .select(OFFICE_COLS)
    .eq('entity_id', entityId);

  if (options.activeOnly !== false) q = q.eq('is_active', true);

  const { data, error } = await q
    .order('city', { ascending: true })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as OfficeRow[]).map(mapOffice);
}

export async function getGovernmentOffice(id: string): Promise<GovernmentOffice | null> {
  const { data, error } = await supabase
    .from('government_offices')
    .select(OFFICE_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapOffice(data as OfficeRow) : null;
}

export async function getOfficesByCity(
  city: string,
  options: { entityId?: string; limit?: number } = {}
): Promise<GovernmentOffice[]> {
  let q = supabase
    .from('government_offices')
    .select(OFFICE_COLS)
    .eq('city', city)
    .eq('is_active', true);

  if (options.entityId) q = q.eq('entity_id', options.entityId);

  const { data, error } = await q
    .order('office_name', { ascending: true })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as OfficeRow[]).map(mapOffice);
}

export async function searchOffices(
  query: string,
  options: { entityId?: string; limit?: number } = {}
): Promise<GovernmentOffice[]> {
  let q = supabase
    .from('government_offices')
    .select(OFFICE_COLS)
    .or(`office_name.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`)
    .eq('is_active', true);

  if (options.entityId) q = q.eq('entity_id', options.entityId);

  const { data, error } = await q
    .order('office_name', { ascending: true })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as OfficeRow[]).map(mapOffice);
}

// ── Citizen Profile functions ─────────────────────────────────────────────

export async function getMyCitizenProfile(): Promise<CitizenProfile | null> {
  const { data, error } = await supabase
    .from('citizen_profiles')
    .select(CITIZEN_COLS)
    .single();
  if (error) throw error;
  return data ? mapCitizen(data as CitizenRow) : null;
}

export async function getCitizenProfileById(id: string): Promise<CitizenProfile | null> {
  const { data, error } = await supabase
    .from('citizen_profiles')
    .select(CITIZEN_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapCitizen(data as CitizenRow) : null;
}

// ── License functions ─────────────────────────────────────────────────────

export async function getMyLicenses(options: {
  licenseType?: LicenseType;
  status?: LicenseStatus;
  limit?: number;
  before?: string;
} = {}): Promise<License[]> {
  let q = supabase
    .from('licenses')
    .select(LICENSE_COLS);

  if (options.licenseType) q = q.eq('license_type', options.licenseType);
  if (options.status) q = q.eq('status', options.status);
  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('expires_date', { ascending: true })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as LicenseRow[]).map(mapLicense);
}

export async function getLicense(id: string): Promise<License | null> {
  const { data, error } = await supabase
    .from('licenses')
    .select(LICENSE_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapLicense(data as LicenseRow) : null;
}

export async function getLicenseByNumber(licenseNumber: string): Promise<License | null> {
  const { data, error } = await supabase
    .from('licenses')
    .select(LICENSE_COLS)
    .eq('license_number', licenseNumber)
    .single();
  if (error) throw error;
  return data ? mapLicense(data as LicenseRow) : null;
}

export async function getMyActiveLicenses(): Promise<License[]> {
  const { data, error } = await supabase
    .from('licenses')
    .select(LICENSE_COLS)
    .eq('status', 'approved')
    .order('expires_date', { ascending: true });
  if (error) throw error;
  return (data as LicenseRow[]).map(mapLicense);
}

export async function getMyExpiringLicenses(daysAhead = 30): Promise<License[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('licenses')
    .select(LICENSE_COLS)
    .eq('status', 'approved')
    .lte('expires_date', cutoff.toISOString().split('T')[0])
    .gte('expires_date', new Date().toISOString().split('T')[0])
    .order('expires_date', { ascending: true });
  if (error) throw error;
  return (data as LicenseRow[]).map(mapLicense);
}

export async function getLicensesByEntity(
  entityId: string,
  options: { licenseType?: LicenseType; status?: LicenseStatus; limit?: number } = {}
): Promise<License[]> {
  let q = supabase
    .from('licenses')
    .select(LICENSE_COLS)
    .eq('entity_id', entityId);

  if (options.licenseType) q = q.eq('license_type', options.licenseType);
  if (options.status) q = q.eq('status', options.status);

  const { data, error } = await q
    .order('expires_date', { ascending: true })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as LicenseRow[]).map(mapLicense);
}

// ── Part 1.2: Infinite GovOS Foundation Expansion ─────────────────────────
//
// Backend-only tables — zero frontend code:
//   quantum_sovereign_identity_vault       — biometric vectors + quantum encryption key (ABSOLUTE NEVER)
//   government_autonomous_ai_decision_engine — internal AI processing log
//   citizen_quantum_trust_score_ledger     — trust_score_index = internal AI metric (NEVER)

// ── Column constants ──────────────────────────────────────────────────────

const TREATY_COLS =
  'id, source_country_code, destination_country_code, treaty_type, automatic_work_authorization, is_active, created_at';
// treaty_metadata_json excluded — internal diplomatic configuration

const TWIN_COLS =
  'id, entity_id, infrastructure_name, infrastructure_type, operational_health_index, status, updated_at';
// sensor_telemetry_json excluded — raw national infrastructure IoT (security risk)

// ── Row types ─────────────────────────────────────────────────────────────

type TreatyRow = {
  id: string;
  source_country_code: string;
  destination_country_code: string;
  treaty_type: TreatyType;
  automatic_work_authorization: boolean;
  is_active: boolean;
  created_at: string;
};

type TwinRow = {
  id: string;
  entity_id: string;
  infrastructure_name: string;
  infrastructure_type: InfrastructureType;
  operational_health_index: number;
  status: InfrastructureStatus;
  updated_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapTreaty(r: TreatyRow): DiplomaticTreaty {
  return {
    id: r.id,
    sourceCountryCode: r.source_country_code,
    destinationCountryCode: r.destination_country_code,
    treatyType: r.treaty_type,
    automaticWorkAuthorization: r.automatic_work_authorization,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapTwin(r: TwinRow): InfrastructureDigitalTwin {
  return {
    id: r.id,
    entityId: r.entity_id,
    infrastructureName: r.infrastructure_name,
    infrastructureType: r.infrastructure_type,
    operationalHealthIndex: r.operational_health_index,
    status: r.status,
    updatedAt: r.updated_at,
  };
}

// ── Diplomatic Treaty functions ───────────────────────────────────────────

export async function getDiplomaticTreaties(options: {
  treatyType?: TreatyType;
  activeOnly?: boolean;
  limit?: number;
} = {}): Promise<DiplomaticTreaty[]> {
  let q = supabase
    .from('cross_border_diplomatic_treaty_matrix')
    .select(TREATY_COLS);

  if (options.activeOnly !== false) q = q.eq('is_active', true);
  if (options.treatyType) q = q.eq('treaty_type', options.treatyType);

  const { data, error } = await q
    .order('source_country_code', { ascending: true })
    .limit(options.limit ?? 200);
  if (error) throw error;
  return (data as TreatyRow[]).map(mapTreaty);
}

export async function getTreatiesBySourceCountry(
  sourceCountryCode: string,
  options: { treatyType?: TreatyType; limit?: number } = {}
): Promise<DiplomaticTreaty[]> {
  let q = supabase
    .from('cross_border_diplomatic_treaty_matrix')
    .select(TREATY_COLS)
    .eq('source_country_code', sourceCountryCode)
    .eq('is_active', true);

  if (options.treatyType) q = q.eq('treaty_type', options.treatyType);

  const { data, error } = await q
    .order('destination_country_code', { ascending: true })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as TreatyRow[]).map(mapTreaty);
}

export async function getTreatiesByDestinationCountry(
  destinationCountryCode: string,
  options: { treatyType?: TreatyType; limit?: number } = {}
): Promise<DiplomaticTreaty[]> {
  let q = supabase
    .from('cross_border_diplomatic_treaty_matrix')
    .select(TREATY_COLS)
    .eq('destination_country_code', destinationCountryCode)
    .eq('is_active', true);

  if (options.treatyType) q = q.eq('treaty_type', options.treatyType);

  const { data, error } = await q
    .order('source_country_code', { ascending: true })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as TreatyRow[]).map(mapTreaty);
}

export async function getTreatyBetweenCountries(
  sourceCountryCode: string,
  destinationCountryCode: string
): Promise<DiplomaticTreaty[]> {
  const { data, error } = await supabase
    .from('cross_border_diplomatic_treaty_matrix')
    .select(TREATY_COLS)
    .eq('source_country_code', sourceCountryCode)
    .eq('destination_country_code', destinationCountryCode)
    .eq('is_active', true)
    .order('treaty_type', { ascending: true });
  if (error) throw error;
  return (data as TreatyRow[]).map(mapTreaty);
}

export async function getActiveTreatiesByType(
  treatyType: TreatyType,
  options: { limit?: number } = {}
): Promise<DiplomaticTreaty[]> {
  const { data, error } = await supabase
    .from('cross_border_diplomatic_treaty_matrix')
    .select(TREATY_COLS)
    .eq('treaty_type', treatyType)
    .eq('is_active', true)
    .order('source_country_code', { ascending: true })
    .limit(options.limit ?? 200);
  if (error) throw error;
  return (data as TreatyRow[]).map(mapTreaty);
}

// ── Infrastructure Digital Twin functions ─────────────────────────────────

export async function getInfrastructureByEntity(
  entityId: string,
  options: { infrastructureType?: InfrastructureType; status?: InfrastructureStatus; limit?: number } = {}
): Promise<InfrastructureDigitalTwin[]> {
  let q = supabase
    .from('national_infrastructure_digital_twins')
    .select(TWIN_COLS)
    .eq('entity_id', entityId);

  if (options.infrastructureType) q = q.eq('infrastructure_type', options.infrastructureType);
  if (options.status) q = q.eq('status', options.status);

  const { data, error } = await q
    .order('infrastructure_name', { ascending: true })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as TwinRow[]).map(mapTwin);
}

export async function getInfrastructureItem(id: string): Promise<InfrastructureDigitalTwin | null> {
  const { data, error } = await supabase
    .from('national_infrastructure_digital_twins')
    .select(TWIN_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapTwin(data as TwinRow) : null;
}

export async function getInfrastructureByType(
  entityId: string,
  infrastructureType: InfrastructureType
): Promise<InfrastructureDigitalTwin[]> {
  const { data, error } = await supabase
    .from('national_infrastructure_digital_twins')
    .select(TWIN_COLS)
    .eq('entity_id', entityId)
    .eq('infrastructure_type', infrastructureType)
    .order('infrastructure_name', { ascending: true });
  if (error) throw error;
  return (data as TwinRow[]).map(mapTwin);
}

export async function getCriticalInfrastructure(
  entityId: string
): Promise<InfrastructureDigitalTwin[]> {
  const { data, error } = await supabase
    .from('national_infrastructure_digital_twins')
    .select(TWIN_COLS)
    .eq('entity_id', entityId)
    .in('status', ['warning', 'critical_maintenance', 'autonomous_failover'])
    .order('operational_health_index', { ascending: true });
  if (error) throw error;
  return (data as TwinRow[]).map(mapTwin);
}

// ── Part 2: Permits, Certificates & Applications ──────────────────────────

// ── Column constants ──────────────────────────────────────────────────────

const PERMIT_COLS =
  'id, entity_id, applicant_user_id, permit_type, permit_details_json, workflow_status, reviewer_user_id, issued_at, expires_at, created_at';

const CERTIFICATE_COLS =
  'id, entity_id, owner_user_id, certificate_type, certificate_payload, verification_status, qr_code_hash, blockchain_hash, digital_signature_ref, issued_at';

const APPLICATION_COLS =
  'id, entity_id, applicant_user_id, service_category, application_payload_json, current_stage, tracking_reference_code, created_at, updated_at';

// ── Row types ─────────────────────────────────────────────────────────────

type PermitRow = {
  id: string;
  entity_id: string;
  applicant_user_id: string;
  permit_type: PermitType;
  permit_details_json: Record<string, unknown>;
  workflow_status: PermitWorkflowStatus;
  reviewer_user_id: string | null;
  issued_at: string | null;
  expires_at: string | null;
  created_at: string;
};

type CertificateRow = {
  id: string;
  entity_id: string;
  owner_user_id: string;
  certificate_type: CertificateType;
  certificate_payload: Record<string, unknown>;
  verification_status: CertificateVerificationStatus;
  qr_code_hash: string;
  blockchain_hash: string;
  digital_signature_ref: string;
  issued_at: string;
};

type ApplicationRow = {
  id: string;
  entity_id: string;
  applicant_user_id: string;
  service_category: string;
  application_payload_json: Record<string, unknown>;
  current_stage: ApplicationStage;
  tracking_reference_code: string;
  created_at: string;
  updated_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapPermit(r: PermitRow): Permit {
  return {
    id: r.id,
    entityId: r.entity_id,
    applicantUserId: r.applicant_user_id,
    permitType: r.permit_type,
    permitDetailsJson: r.permit_details_json,
    workflowStatus: r.workflow_status,
    reviewerUserId: r.reviewer_user_id,
    issuedAt: r.issued_at,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

function mapCertificate(r: CertificateRow): Certificate {
  return {
    id: r.id,
    entityId: r.entity_id,
    ownerUserId: r.owner_user_id,
    certificateType: r.certificate_type,
    certificatePayload: r.certificate_payload,
    verificationStatus: r.verification_status,
    qrCodeHash: r.qr_code_hash,
    blockchainHash: r.blockchain_hash,
    digitalSignatureRef: r.digital_signature_ref,
    issuedAt: r.issued_at,
  };
}

function mapApplication(r: ApplicationRow): GovernmentApplication {
  return {
    id: r.id,
    entityId: r.entity_id,
    applicantUserId: r.applicant_user_id,
    serviceCategory: r.service_category,
    applicationPayloadJson: r.application_payload_json,
    currentStage: r.current_stage,
    trackingReferenceCode: r.tracking_reference_code,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── Permit functions ──────────────────────────────────────────────────────

export async function getMyPermits(options: {
  permitType?: PermitType;
  workflowStatus?: PermitWorkflowStatus;
  limit?: number;
  before?: string;
} = {}): Promise<Permit[]> {
  let q = supabase
    .from('permits')
    .select(PERMIT_COLS);

  if (options.permitType) q = q.eq('permit_type', options.permitType);
  if (options.workflowStatus) q = q.eq('workflow_status', options.workflowStatus);
  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as PermitRow[]).map(mapPermit);
}

export async function getPermit(id: string): Promise<Permit | null> {
  const { data, error } = await supabase
    .from('permits')
    .select(PERMIT_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapPermit(data as PermitRow) : null;
}

export async function getMyActivePermits(): Promise<Permit[]> {
  const { data, error } = await supabase
    .from('permits')
    .select(PERMIT_COLS)
    .in('workflow_status', ['approved', 'issued'])
    .order('expires_at', { ascending: true });
  if (error) throw error;
  return (data as PermitRow[]).map(mapPermit);
}

export async function getMyPermitsByType(permitType: PermitType): Promise<Permit[]> {
  const { data, error } = await supabase
    .from('permits')
    .select(PERMIT_COLS)
    .eq('permit_type', permitType)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PermitRow[]).map(mapPermit);
}

export async function getMyExpiringPermits(daysAhead = 30): Promise<Permit[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('permits')
    .select(PERMIT_COLS)
    .in('workflow_status', ['approved', 'issued'])
    .lte('expires_at', cutoff.toISOString())
    .gte('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true });
  if (error) throw error;
  return (data as PermitRow[]).map(mapPermit);
}

// ── Certificate functions ─────────────────────────────────────────────────

export async function getMyCertificates(options: {
  certificateType?: CertificateType;
  verificationStatus?: CertificateVerificationStatus;
  limit?: number;
} = {}): Promise<Certificate[]> {
  let q = supabase
    .from('certificates')
    .select(CERTIFICATE_COLS);

  if (options.certificateType) q = q.eq('certificate_type', options.certificateType);
  if (options.verificationStatus) q = q.eq('verification_status', options.verificationStatus);

  const { data, error } = await q
    .order('issued_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as CertificateRow[]).map(mapCertificate);
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('certificates')
    .select(CERTIFICATE_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapCertificate(data as CertificateRow) : null;
}

export async function getCertificateByQrCode(qrCodeHash: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('certificates')
    .select(CERTIFICATE_COLS)
    .eq('qr_code_hash', qrCodeHash)
    .single();
  if (error) throw error;
  return data ? mapCertificate(data as CertificateRow) : null;
}

export async function getCertificateByBlockchainHash(
  blockchainHash: string
): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('certificates')
    .select(CERTIFICATE_COLS)
    .eq('blockchain_hash', blockchainHash)
    .single();
  if (error) throw error;
  return data ? mapCertificate(data as CertificateRow) : null;
}

export async function getMyCertificatesByType(
  certificateType: CertificateType
): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select(CERTIFICATE_COLS)
    .eq('certificate_type', certificateType)
    .order('issued_at', { ascending: false });
  if (error) throw error;
  return (data as CertificateRow[]).map(mapCertificate);
}

// ── Government Application functions ─────────────────────────────────────

export async function getMyApplications(options: {
  currentStage?: ApplicationStage;
  serviceCategory?: string;
  limit?: number;
  before?: string;
} = {}): Promise<GovernmentApplication[]> {
  let q = supabase
    .from('government_applications')
    .select(APPLICATION_COLS);

  if (options.currentStage) q = q.eq('current_stage', options.currentStage);
  if (options.serviceCategory) q = q.eq('service_category', options.serviceCategory);
  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ApplicationRow[]).map(mapApplication);
}

export async function getApplication(id: string): Promise<GovernmentApplication | null> {
  const { data, error } = await supabase
    .from('government_applications')
    .select(APPLICATION_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapApplication(data as ApplicationRow) : null;
}

export async function getApplicationByTrackingCode(
  trackingCode: string
): Promise<GovernmentApplication | null> {
  const { data, error } = await supabase
    .from('government_applications')
    .select(APPLICATION_COLS)
    .eq('tracking_reference_code', trackingCode)
    .single();
  if (error) throw error;
  return data ? mapApplication(data as ApplicationRow) : null;
}

export async function getMyApplicationsByCategory(
  serviceCategory: string,
  options: { limit?: number } = {}
): Promise<GovernmentApplication[]> {
  const { data, error } = await supabase
    .from('government_applications')
    .select(APPLICATION_COLS)
    .eq('service_category', serviceCategory)
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ApplicationRow[]).map(mapApplication);
}

export async function getMyPendingApplications(): Promise<GovernmentApplication[]> {
  const { data, error } = await supabase
    .from('government_applications')
    .select(APPLICATION_COLS)
    .in('current_stage', ['submitted', 'document_review', 'department_approval', 'fee_pending'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ApplicationRow[]).map(mapApplication);
}

// ── Part 2.2: Infinite Permits & Certificates Expansion ───────────────────
//
// Backend-only tables — zero frontend code:
//   sovereign_digital_certificates_vault — post_quantum_encryption_hash (ABSOLUTE NEVER)

// ── Column constants ──────────────────────────────────────────────────────

const SMART_PERMIT_COLS =
  'id, permit_id, ai_spatial_analysis_json, environmental_impact_score, automated_approval_status, executed_at';

const WORKFLOW_PHASE_COLS =
  'id, application_id, current_phase_name, phase_status, updated_at';
// workflow_metadata_json excluded — internal workflow processing configuration

const CREDENTIAL_VERIFY_COLS =
  'id, source_entity_id, requesting_country_code, credential_type, credential_reference_hash, validation_verdict, verified_at';

const VAULT_ACCESS_LOG_COLS =
  'id, citizen_user_id, accessor_entity_or_user_id, document_accessed_type, access_purpose, cryptographic_consent_hash, logged_at';

// ── Row types ─────────────────────────────────────────────────────────────

type SmartPermitRow = {
  id: string;
  permit_id: string;
  ai_spatial_analysis_json: Record<string, unknown>;
  environmental_impact_score: number;
  automated_approval_status: AutomatedApprovalStatus;
  executed_at: string;
};

type WorkflowPhaseRow = {
  id: string;
  application_id: string;
  current_phase_name: string;
  phase_status: PhaseStatus;
  updated_at: string;
};

type CredentialVerifyRow = {
  id: string;
  source_entity_id: string;
  requesting_country_code: string;
  credential_type: string;
  credential_reference_hash: string;
  validation_verdict: ValidationVerdict;
  verified_at: string;
};

type VaultAccessLogRow = {
  id: string;
  citizen_user_id: string;
  accessor_entity_or_user_id: string;
  document_accessed_type: string;
  access_purpose: string;
  cryptographic_consent_hash: string;
  logged_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapSmartPermit(r: SmartPermitRow): SmartPermitAutomation {
  return {
    id: r.id,
    permitId: r.permit_id,
    aiSpatialAnalysisJson: r.ai_spatial_analysis_json,
    environmentalImpactScore: r.environmental_impact_score,
    automatedApprovalStatus: r.automated_approval_status,
    executedAt: r.executed_at,
  };
}

function mapWorkflowPhase(r: WorkflowPhaseRow): WorkflowPhase {
  return {
    id: r.id,
    applicationId: r.application_id,
    currentPhaseName: r.current_phase_name,
    phaseStatus: r.phase_status,
    updatedAt: r.updated_at,
  };
}

function mapCredentialVerify(r: CredentialVerifyRow): CrossBorderCredentialVerification {
  return {
    id: r.id,
    sourceEntityId: r.source_entity_id,
    requestingCountryCode: r.requesting_country_code,
    credentialType: r.credential_type,
    credentialReferenceHash: r.credential_reference_hash,
    validationVerdict: r.validation_verdict,
    verifiedAt: r.verified_at,
  };
}

function mapVaultAccessLog(r: VaultAccessLogRow): VaultAccessLog {
  return {
    id: r.id,
    citizenUserId: r.citizen_user_id,
    accessorEntityOrUserId: r.accessor_entity_or_user_id,
    documentAccessedType: r.document_accessed_type,
    accessPurpose: r.access_purpose,
    cryptographicConsentHash: r.cryptographic_consent_hash,
    loggedAt: r.logged_at,
  };
}

// ── Smart Permit Automation functions ─────────────────────────────────────

export async function getPermitAutomationResult(
  permitId: string
): Promise<SmartPermitAutomation | null> {
  const { data, error } = await supabase
    .from('quantum_smart_permits_automation')
    .select(SMART_PERMIT_COLS)
    .eq('permit_id', permitId)
    .order('executed_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapSmartPermit(data as SmartPermitRow) : null;
}

export async function getPermitAutomationHistory(
  permitId: string
): Promise<SmartPermitAutomation[]> {
  const { data, error } = await supabase
    .from('quantum_smart_permits_automation')
    .select(SMART_PERMIT_COLS)
    .eq('permit_id', permitId)
    .order('executed_at', { ascending: false });
  if (error) throw error;
  return (data as SmartPermitRow[]).map(mapSmartPermit);
}

// ── Workflow Phase functions ───────────────────────────────────────────────

export async function getApplicationWorkflowPhases(
  applicationId: string
): Promise<WorkflowPhase[]> {
  const { data, error } = await supabase
    .from('government_multiphase_workflow_engine')
    .select(WORKFLOW_PHASE_COLS)
    .eq('application_id', applicationId)
    .order('updated_at', { ascending: true });
  if (error) throw error;
  return (data as WorkflowPhaseRow[]).map(mapWorkflowPhase);
}

export async function getActiveWorkflowPhase(
  applicationId: string
): Promise<WorkflowPhase | null> {
  const { data, error } = await supabase
    .from('government_multiphase_workflow_engine')
    .select(WORKFLOW_PHASE_COLS)
    .eq('application_id', applicationId)
    .in('phase_status', ['pending', 'in_progress'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapWorkflowPhase(data as WorkflowPhaseRow) : null;
}

export async function getWorkflowPhasesByStatus(
  applicationId: string,
  phaseStatus: PhaseStatus
): Promise<WorkflowPhase[]> {
  const { data, error } = await supabase
    .from('government_multiphase_workflow_engine')
    .select(WORKFLOW_PHASE_COLS)
    .eq('application_id', applicationId)
    .eq('phase_status', phaseStatus)
    .order('updated_at', { ascending: true });
  if (error) throw error;
  return (data as WorkflowPhaseRow[]).map(mapWorkflowPhase);
}

// ── Cross-Border Credential Verification functions ────────────────────────

export async function getMyCredentialVerifications(options: {
  credentialType?: string;
  validationVerdict?: ValidationVerdict;
  limit?: number;
  before?: string;
} = {}): Promise<CrossBorderCredentialVerification[]> {
  let q = supabase
    .from('cross_border_credential_verification_node')
    .select(CREDENTIAL_VERIFY_COLS);

  if (options.credentialType) q = q.eq('credential_type', options.credentialType);
  if (options.validationVerdict) q = q.eq('validation_verdict', options.validationVerdict);
  if (options.before) q = q.lt('verified_at', options.before);

  const { data, error } = await q
    .order('verified_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as CredentialVerifyRow[]).map(mapCredentialVerify);
}

export async function getVerificationsByCountry(
  requestingCountryCode: string,
  options: { limit?: number } = {}
): Promise<CrossBorderCredentialVerification[]> {
  const { data, error } = await supabase
    .from('cross_border_credential_verification_node')
    .select(CREDENTIAL_VERIFY_COLS)
    .eq('requesting_country_code', requestingCountryCode)
    .order('verified_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as CredentialVerifyRow[]).map(mapCredentialVerify);
}

// ── Vault Access Log functions ────────────────────────────────────────────

export async function getMyVaultAccessLogs(options: {
  documentType?: string;
  limit?: number;
  before?: string;
} = {}): Promise<VaultAccessLog[]> {
  let q = supabase
    .from('citizen_digital_vault_access_logs')
    .select(VAULT_ACCESS_LOG_COLS);

  if (options.documentType) q = q.eq('document_accessed_type', options.documentType);
  if (options.before) q = q.lt('logged_at', options.before);

  const { data, error } = await q
    .order('logged_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as VaultAccessLogRow[]).map(mapVaultAccessLog);
}

// ── Part 3: Tax, Payments & Signatures ───────────────────────────────────

// ── Column constants ──────────────────────────────────────────────────────

const TAX_COLS =
  'id, entity_id, taxpayer_identifier, tax_type, tax_period, declared_amount, paid_amount, currency, filing_status, created_at, updated_at';

const GOV_PAYMENT_COLS =
  'id, entity_id, payer_user_id, service_type, reference_id, amount, currency, payment_method, payment_status, transaction_receipt_hash, created_at';

const DIGITAL_SIG_COLS =
  'id, signer_user_id, target_document_type, target_document_id, public_key_fingerprint, signature_hash, verification_algorithm, signed_at';

// ── Row types ─────────────────────────────────────────────────────────────

type TaxRow = {
  id: string;
  entity_id: string;
  taxpayer_identifier: string;
  tax_type: TaxType;
  tax_period: string;
  declared_amount: number;
  paid_amount: number;
  currency: string;
  filing_status: TaxFilingStatus;
  created_at: string;
  updated_at: string;
};

type GovPaymentRow = {
  id: string;
  entity_id: string;
  payer_user_id: string;
  service_type: GovServiceType;
  reference_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: GovPaymentStatus;
  transaction_receipt_hash: string;
  created_at: string;
};

type DigitalSigRow = {
  id: string;
  signer_user_id: string;
  target_document_type: string;
  target_document_id: string;
  public_key_fingerprint: string;
  signature_hash: string;
  verification_algorithm: string;
  signed_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapTax(r: TaxRow): TaxService {
  return {
    id: r.id,
    entityId: r.entity_id,
    taxpayerIdentifier: r.taxpayer_identifier,
    taxType: r.tax_type,
    taxPeriod: r.tax_period,
    declaredAmount: r.declared_amount,
    paidAmount: r.paid_amount,
    currency: r.currency,
    filingStatus: r.filing_status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapGovPayment(r: GovPaymentRow): GovernmentPayment {
  return {
    id: r.id,
    entityId: r.entity_id,
    payerUserId: r.payer_user_id,
    serviceType: r.service_type,
    referenceId: r.reference_id,
    amount: r.amount,
    currency: r.currency,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    transactionReceiptHash: r.transaction_receipt_hash,
    createdAt: r.created_at,
  };
}

function mapDigitalSig(r: DigitalSigRow): DigitalSignature {
  return {
    id: r.id,
    signerUserId: r.signer_user_id,
    targetDocumentType: r.target_document_type,
    targetDocumentId: r.target_document_id,
    publicKeyFingerprint: r.public_key_fingerprint,
    signatureHash: r.signature_hash,
    verificationAlgorithm: r.verification_algorithm,
    signedAt: r.signed_at,
  };
}

// ── Tax Service functions ─────────────────────────────────────────────────

export async function getMyTaxRecords(options: {
  taxType?: TaxType;
  filingStatus?: TaxFilingStatus;
  limit?: number;
  before?: string;
} = {}): Promise<TaxService[]> {
  let q = supabase
    .from('tax_services')
    .select(TAX_COLS);

  if (options.taxType) q = q.eq('tax_type', options.taxType);
  if (options.filingStatus) q = q.eq('filing_status', options.filingStatus);
  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as TaxRow[]).map(mapTax);
}

export async function getTaxRecord(id: string): Promise<TaxService | null> {
  const { data, error } = await supabase
    .from('tax_services')
    .select(TAX_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapTax(data as TaxRow) : null;
}

export async function getMyTaxRecordsByType(
  taxType: TaxType,
  options: { filingStatus?: TaxFilingStatus; limit?: number } = {}
): Promise<TaxService[]> {
  let q = supabase
    .from('tax_services')
    .select(TAX_COLS)
    .eq('tax_type', taxType);

  if (options.filingStatus) q = q.eq('filing_status', options.filingStatus);

  const { data, error } = await q
    .order('tax_period', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as TaxRow[]).map(mapTax);
}

export async function getMyTaxByPeriod(taxPeriod: string): Promise<TaxService[]> {
  const { data, error } = await supabase
    .from('tax_services')
    .select(TAX_COLS)
    .eq('tax_period', taxPeriod)
    .order('tax_type', { ascending: true });
  if (error) throw error;
  return (data as TaxRow[]).map(mapTax);
}

export async function getMyOutstandingTax(): Promise<TaxService[]> {
  const { data, error } = await supabase
    .from('tax_services')
    .select(TAX_COLS)
    .in('filing_status', ['submitted', 'under_audit', 'approved', 'penalized'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as TaxRow[]).map(mapTax);
}

// ── Government Payment functions ──────────────────────────────────────────

export async function getMyGovernmentPayments(options: {
  serviceType?: GovServiceType;
  paymentStatus?: GovPaymentStatus;
  limit?: number;
  before?: string;
} = {}): Promise<GovernmentPayment[]> {
  let q = supabase
    .from('government_payments')
    .select(GOV_PAYMENT_COLS);

  if (options.serviceType) q = q.eq('service_type', options.serviceType);
  if (options.paymentStatus) q = q.eq('payment_status', options.paymentStatus);
  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as GovPaymentRow[]).map(mapGovPayment);
}

export async function getGovernmentPayment(id: string): Promise<GovernmentPayment | null> {
  const { data, error } = await supabase
    .from('government_payments')
    .select(GOV_PAYMENT_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapGovPayment(data as GovPaymentRow) : null;
}

export async function getPaymentByReceiptHash(
  receiptHash: string
): Promise<GovernmentPayment | null> {
  const { data, error } = await supabase
    .from('government_payments')
    .select(GOV_PAYMENT_COLS)
    .eq('transaction_receipt_hash', receiptHash)
    .single();
  if (error) throw error;
  return data ? mapGovPayment(data as GovPaymentRow) : null;
}

export async function getPaymentsByReference(referenceId: string): Promise<GovernmentPayment[]> {
  const { data, error } = await supabase
    .from('government_payments')
    .select(GOV_PAYMENT_COLS)
    .eq('reference_id', referenceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as GovPaymentRow[]).map(mapGovPayment);
}

// ── Digital Signature functions ───────────────────────────────────────────

export async function getMyDigitalSignatures(options: {
  targetDocumentType?: string;
  limit?: number;
  before?: string;
} = {}): Promise<DigitalSignature[]> {
  let q = supabase
    .from('digital_signatures')
    .select(DIGITAL_SIG_COLS);

  if (options.targetDocumentType) q = q.eq('target_document_type', options.targetDocumentType);
  if (options.before) q = q.lt('signed_at', options.before);

  const { data, error } = await q
    .order('signed_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as DigitalSigRow[]).map(mapDigitalSig);
}

export async function getDigitalSignature(id: string): Promise<DigitalSignature | null> {
  const { data, error } = await supabase
    .from('digital_signatures')
    .select(DIGITAL_SIG_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapDigitalSig(data as DigitalSigRow) : null;
}

export async function getSignaturesByDocument(
  targetDocumentId: string,
  targetDocumentType?: string
): Promise<DigitalSignature[]> {
  let q = supabase
    .from('digital_signatures')
    .select(DIGITAL_SIG_COLS)
    .eq('target_document_id', targetDocumentId);

  if (targetDocumentType) q = q.eq('target_document_type', targetDocumentType);

  const { data, error } = await q.order('signed_at', { ascending: false });
  if (error) throw error;
  return (data as DigitalSigRow[]).map(mapDigitalSig);
}

export async function getSignatureByHash(signatureHash: string): Promise<DigitalSignature | null> {
  const { data, error } = await supabase
    .from('digital_signatures')
    .select(DIGITAL_SIG_COLS)
    .eq('signature_hash', signatureHash)
    .single();
  if (error) throw error;
  return data ? mapDigitalSig(data as DigitalSigRow) : null;
}

// ── Part 3.2: Infinite Tax, Payments & Signatures Expansion ──────────────

// ── Column constants ──────────────────────────────────────────────────────

const TAX_AUDIT_COLS =
  'id, tax_service_id, ai_audit_verdict, audited_at';
// anomaly_risk_score excluded — internal AI scoring metric (NEVER)
// neural_audit_report_json excluded — internal AI neural processing data

const CBDC_COLS =
  'id, government_payment_id, cbdc_token_identifier, settlement_status, settled_at';
// settlement_latency_microseconds excluded — internal performance metric
// blockchain_consensus_node excluded — internal infrastructure identifier

const FISCAL_RECONCILE_COLS =
  'id, origin_entity_id, destination_country_code, declared_goods_value, customs_duty_calculated, reconciliation_status, updated_at';

const CRYPTO_STAMP_COLS =
  'id, digital_signature_id, lattice_public_key_hash, hash_based_signature_proof, resistance_level, stamped_at';

const REVENUE_AI_COLS =
  'id, entity_id, economic_forecast_period, projected_national_revenue, ai_optimization_recommendations_json, generated_at';
// model_confidence_index excluded — internal AI confidence metric (NEVER)

// ── Row types ─────────────────────────────────────────────────────────────

type TaxAuditRow = {
  id: string;
  tax_service_id: string;
  ai_audit_verdict: AiAuditVerdict;
  audited_at: string;
};

type CbdcRow = {
  id: string;
  government_payment_id: string;
  cbdc_token_identifier: string;
  settlement_status: CbdcSettlementStatus;
  settled_at: string;
};

type FiscalReconcileRow = {
  id: string;
  origin_entity_id: string;
  destination_country_code: string;
  declared_goods_value: number;
  customs_duty_calculated: number;
  reconciliation_status: ReconciliationStatus;
  updated_at: string;
};

type CryptoStampRow = {
  id: string;
  digital_signature_id: string;
  lattice_public_key_hash: string;
  hash_based_signature_proof: string;
  resistance_level: ResistanceLevel;
  stamped_at: string;
};

type RevenueAiRow = {
  id: string;
  entity_id: string;
  economic_forecast_period: string;
  projected_national_revenue: number;
  ai_optimization_recommendations_json: Record<string, unknown>;
  generated_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapTaxAudit(r: TaxAuditRow): TaxAuditResult {
  return {
    id: r.id,
    taxServiceId: r.tax_service_id,
    aiAuditVerdict: r.ai_audit_verdict,
    auditedAt: r.audited_at,
  };
}

function mapCbdc(r: CbdcRow): CbdcSettlement {
  return {
    id: r.id,
    governmentPaymentId: r.government_payment_id,
    cbdcTokenIdentifier: r.cbdc_token_identifier,
    settlementStatus: r.settlement_status,
    settledAt: r.settled_at,
  };
}

function mapFiscalReconcile(r: FiscalReconcileRow): FiscalReconciliation {
  return {
    id: r.id,
    originEntityId: r.origin_entity_id,
    destinationCountryCode: r.destination_country_code,
    declaredGoodsValue: r.declared_goods_value,
    customsDutyCalculated: r.customs_duty_calculated,
    reconciliationStatus: r.reconciliation_status,
    updatedAt: r.updated_at,
  };
}

function mapCryptoStamp(r: CryptoStampRow): CryptographicStamp {
  return {
    id: r.id,
    digitalSignatureId: r.digital_signature_id,
    latticePublicKeyHash: r.lattice_public_key_hash,
    hashBasedSignatureProof: r.hash_based_signature_proof,
    resistanceLevel: r.resistance_level,
    stampedAt: r.stamped_at,
  };
}

function mapRevenueAi(r: RevenueAiRow): RevenueOptimizationForecast {
  return {
    id: r.id,
    entityId: r.entity_id,
    economicForecastPeriod: r.economic_forecast_period,
    projectedNationalRevenue: r.projected_national_revenue,
    aiOptimizationRecommendationsJson: r.ai_optimization_recommendations_json,
    generatedAt: r.generated_at,
  };
}

// ── Tax Audit functions ───────────────────────────────────────────────────

export async function getMyTaxAuditResult(
  taxServiceId: string
): Promise<TaxAuditResult | null> {
  const { data, error } = await supabase
    .from('quantum_autonomous_tax_auditing_engine')
    .select(TAX_AUDIT_COLS)
    .eq('tax_service_id', taxServiceId)
    .order('audited_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapTaxAudit(data as TaxAuditRow) : null;
}

export async function getMyTaxAuditHistory(options: {
  auditVerdict?: AiAuditVerdict;
  limit?: number;
  before?: string;
} = {}): Promise<TaxAuditResult[]> {
  let q = supabase
    .from('quantum_autonomous_tax_auditing_engine')
    .select(TAX_AUDIT_COLS);

  if (options.auditVerdict) q = q.eq('ai_audit_verdict', options.auditVerdict);
  if (options.before) q = q.lt('audited_at', options.before);

  const { data, error } = await q
    .order('audited_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as TaxAuditRow[]).map(mapTaxAudit);
}

// ── CBDC Settlement functions ─────────────────────────────────────────────

export async function getPaymentSettlement(
  governmentPaymentId: string
): Promise<CbdcSettlement | null> {
  const { data, error } = await supabase
    .from('sovereign_cbdc_instant_settlement_ledger')
    .select(CBDC_COLS)
    .eq('government_payment_id', governmentPaymentId)
    .single();
  if (error) throw error;
  return data ? mapCbdc(data as CbdcRow) : null;
}

export async function getCbdcSettlementByToken(
  cbdcTokenIdentifier: string
): Promise<CbdcSettlement | null> {
  const { data, error } = await supabase
    .from('sovereign_cbdc_instant_settlement_ledger')
    .select(CBDC_COLS)
    .eq('cbdc_token_identifier', cbdcTokenIdentifier)
    .single();
  if (error) throw error;
  return data ? mapCbdc(data as CbdcRow) : null;
}

// ── Fiscal Reconciliation functions ──────────────────────────────────────

export async function getMyFiscalReconciliations(options: {
  destinationCountryCode?: string;
  reconciliationStatus?: ReconciliationStatus;
  limit?: number;
  before?: string;
} = {}): Promise<FiscalReconciliation[]> {
  let q = supabase
    .from('cross_border_fiscal_reconciliation_hub')
    .select(FISCAL_RECONCILE_COLS);

  if (options.destinationCountryCode) q = q.eq('destination_country_code', options.destinationCountryCode);
  if (options.reconciliationStatus) q = q.eq('reconciliation_status', options.reconciliationStatus);
  if (options.before) q = q.lt('updated_at', options.before);

  const { data, error } = await q
    .order('updated_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as FiscalReconcileRow[]).map(mapFiscalReconcile);
}

export async function getFiscalReconciliation(id: string): Promise<FiscalReconciliation | null> {
  const { data, error } = await supabase
    .from('cross_border_fiscal_reconciliation_hub')
    .select(FISCAL_RECONCILE_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapFiscalReconcile(data as FiscalReconcileRow) : null;
}

export async function getDisputedReconciliations(
  originEntityId: string
): Promise<FiscalReconciliation[]> {
  const { data, error } = await supabase
    .from('cross_border_fiscal_reconciliation_hub')
    .select(FISCAL_RECONCILE_COLS)
    .eq('origin_entity_id', originEntityId)
    .eq('reconciliation_status', 'disputed')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as FiscalReconcileRow[]).map(mapFiscalReconcile);
}

// ── Cryptographic Stamp functions ─────────────────────────────────────────

export async function getSignatureStamp(
  digitalSignatureId: string
): Promise<CryptographicStamp | null> {
  const { data, error } = await supabase
    .from('post_quantum_cryptographic_stamp_vault')
    .select(CRYPTO_STAMP_COLS)
    .eq('digital_signature_id', digitalSignatureId)
    .single();
  if (error) throw error;
  return data ? mapCryptoStamp(data as CryptoStampRow) : null;
}

export async function getCryptographicStamp(id: string): Promise<CryptographicStamp | null> {
  const { data, error } = await supabase
    .from('post_quantum_cryptographic_stamp_vault')
    .select(CRYPTO_STAMP_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapCryptoStamp(data as CryptoStampRow) : null;
}

// ── Revenue Optimization AI functions ─────────────────────────────────────

export async function getRevenueForecastsByEntity(
  entityId: string,
  options: { limit?: number; before?: string } = {}
): Promise<RevenueOptimizationForecast[]> {
  let q = supabase
    .from('government_autonomous_revenue_optimization_ai')
    .select(REVENUE_AI_COLS)
    .eq('entity_id', entityId);

  if (options.before) q = q.lt('generated_at', options.before);

  const { data, error } = await q
    .order('generated_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as RevenueAiRow[]).map(mapRevenueAi);
}

export async function getLatestRevenueForecast(
  entityId: string,
  economicForecastPeriod: string
): Promise<RevenueOptimizationForecast | null> {
  const { data, error } = await supabase
    .from('government_autonomous_revenue_optimization_ai')
    .select(REVENUE_AI_COLS)
    .eq('entity_id', entityId)
    .eq('economic_forecast_period', economicForecastPeriod)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapRevenueAi(data as RevenueAiRow) : null;
}

// ── Part 4: Identity, Blockchain, Audit & AI ──────────────────────────────

// ── Column constants ──────────────────────────────────────────────────────

const IDENTITY_COLS =
  'id, user_id, document_type, document_number, country_of_issue, verification_status, verified_by_entity_id, verified_at';
// confidence_score excluded — internal AI/KYC scoring metric (NEVER)

const BLOCKCHAIN_COLS =
  'id, record_type, record_id, block_hash, previous_block_hash, node_validator_signature, anchored_at';

const PUBLIC_AUDIT_COLS =
  'id, accessor_user_id, target_citizen_or_entity_id, action_performed, access_granted, justification_notes, accessed_at';
// ip_address excluded — PII (NEVER; same pattern as all audit log tables)

const COMPLIANCE_COLS =
  'id, entity_id, target_service_id, compliance_verdict, evaluated_at';
// ai_risk_score excluded — internal AI scoring metric (NEVER)
// neural_analysis_summary excluded — internal AI neural output

// ── Row types ─────────────────────────────────────────────────────────────

type IdentityRow = {
  id: string;
  user_id: string;
  document_type: IdentityDocumentType;
  document_number: string;
  country_of_issue: string;
  verification_status: IdentityVerificationStatus;
  verified_by_entity_id: string | null;
  verified_at: string;
};

type BlockchainRow = {
  id: string;
  record_type: string;
  record_id: string;
  block_hash: string;
  previous_block_hash: string;
  node_validator_signature: string;
  anchored_at: string;
};

type PublicAuditRow = {
  id: string;
  accessor_user_id: string;
  target_citizen_or_entity_id: string;
  action_performed: string;
  access_granted: boolean;
  justification_notes: string | null;
  accessed_at: string;
};

type ComplianceRow = {
  id: string;
  entity_id: string;
  target_service_id: string;
  compliance_verdict: ComplianceVerdict;
  evaluated_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapIdentity(r: IdentityRow): IdentityCheck {
  return {
    id: r.id,
    userId: r.user_id,
    documentType: r.document_type,
    documentNumber: r.document_number,
    countryOfIssue: r.country_of_issue,
    verificationStatus: r.verification_status,
    verifiedByEntityId: r.verified_by_entity_id,
    verifiedAt: r.verified_at,
  };
}

function mapBlockchain(r: BlockchainRow): BlockchainVerificationEntry {
  return {
    id: r.id,
    recordType: r.record_type,
    recordId: r.record_id,
    blockHash: r.block_hash,
    previousBlockHash: r.previous_block_hash,
    nodeValidatorSignature: r.node_validator_signature,
    anchoredAt: r.anchored_at,
  };
}

function mapPublicAudit(r: PublicAuditRow): PublicRecordAudit {
  return {
    id: r.id,
    accessorUserId: r.accessor_user_id,
    targetCitizenOrEntityId: r.target_citizen_or_entity_id,
    actionPerformed: r.action_performed,
    accessGranted: r.access_granted,
    justificationNotes: r.justification_notes,
    accessedAt: r.accessed_at,
  };
}

function mapCompliance(r: ComplianceRow): ComplianceCheckResult {
  return {
    id: r.id,
    entityId: r.entity_id,
    targetServiceId: r.target_service_id,
    complianceVerdict: r.compliance_verdict,
    evaluatedAt: r.evaluated_at,
  };
}

// ── Identity Check functions ──────────────────────────────────────────────

export async function getMyIdentityChecks(options: {
  documentType?: IdentityDocumentType;
  verificationStatus?: IdentityVerificationStatus;
  limit?: number;
} = {}): Promise<IdentityCheck[]> {
  let q = supabase
    .from('identity_checks')
    .select(IDENTITY_COLS);

  if (options.documentType) q = q.eq('document_type', options.documentType);
  if (options.verificationStatus) q = q.eq('verification_status', options.verificationStatus);

  const { data, error } = await q
    .order('verified_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as IdentityRow[]).map(mapIdentity);
}

export async function getIdentityCheck(id: string): Promise<IdentityCheck | null> {
  const { data, error } = await supabase
    .from('identity_checks')
    .select(IDENTITY_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapIdentity(data as IdentityRow) : null;
}

export async function getMyVerifiedIdentities(): Promise<IdentityCheck[]> {
  const { data, error } = await supabase
    .from('identity_checks')
    .select(IDENTITY_COLS)
    .eq('verification_status', 'verified')
    .order('verified_at', { ascending: false });
  if (error) throw error;
  return (data as IdentityRow[]).map(mapIdentity);
}

// ── Blockchain Verification functions ─────────────────────────────────────

export async function getBlockchainRecord(
  recordId: string,
  recordType?: string
): Promise<BlockchainVerificationEntry | null> {
  let q = supabase
    .from('blockchain_verification_ledger')
    .select(BLOCKCHAIN_COLS)
    .eq('record_id', recordId);

  if (recordType) q = q.eq('record_type', recordType);

  const { data, error } = await q
    .order('anchored_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapBlockchain(data as BlockchainRow) : null;
}

export async function getBlockchainRecordsByType(
  recordType: string,
  options: { limit?: number; before?: string } = {}
): Promise<BlockchainVerificationEntry[]> {
  let q = supabase
    .from('blockchain_verification_ledger')
    .select(BLOCKCHAIN_COLS)
    .eq('record_type', recordType);

  if (options.before) q = q.lt('anchored_at', options.before);

  const { data, error } = await q
    .order('anchored_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as BlockchainRow[]).map(mapBlockchain);
}

export async function getBlockchainEntryByHash(
  blockHash: string
): Promise<BlockchainVerificationEntry | null> {
  const { data, error } = await supabase
    .from('blockchain_verification_ledger')
    .select(BLOCKCHAIN_COLS)
    .eq('block_hash', blockHash)
    .single();
  if (error) throw error;
  return data ? mapBlockchain(data as BlockchainRow) : null;
}

// ── Public Records Audit functions ────────────────────────────────────────

export async function getMyPublicRecordsAudit(options: {
  accessGranted?: boolean;
  limit?: number;
  before?: string;
} = {}): Promise<PublicRecordAudit[]> {
  let q = supabase
    .from('public_records_audit')
    .select(PUBLIC_AUDIT_COLS);

  if (options.accessGranted !== undefined) q = q.eq('access_granted', options.accessGranted);
  if (options.before) q = q.lt('accessed_at', options.before);

  const { data, error } = await q
    .order('accessed_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as PublicAuditRow[]).map(mapPublicAudit);
}

export async function getAuditEntriesByTarget(
  targetId: string,
  options: { limit?: number; before?: string } = {}
): Promise<PublicRecordAudit[]> {
  let q = supabase
    .from('public_records_audit')
    .select(PUBLIC_AUDIT_COLS)
    .eq('target_citizen_or_entity_id', targetId);

  if (options.before) q = q.lt('accessed_at', options.before);

  const { data, error } = await q
    .order('accessed_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as PublicAuditRow[]).map(mapPublicAudit);
}

// ── Compliance Engine functions ───────────────────────────────────────────

export async function getMyComplianceChecks(options: {
  complianceVerdict?: ComplianceVerdict;
  limit?: number;
  before?: string;
} = {}): Promise<ComplianceCheckResult[]> {
  let q = supabase
    .from('ai_government_compliance_engine')
    .select(COMPLIANCE_COLS);

  if (options.complianceVerdict) q = q.eq('compliance_verdict', options.complianceVerdict);
  if (options.before) q = q.lt('evaluated_at', options.before);

  const { data, error } = await q
    .order('evaluated_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ComplianceRow[]).map(mapCompliance);
}

export async function getComplianceCheck(id: string): Promise<ComplianceCheckResult | null> {
  const { data, error } = await supabase
    .from('ai_government_compliance_engine')
    .select(COMPLIANCE_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapCompliance(data as ComplianceRow) : null;
}

export async function getComplianceByService(
  targetServiceId: string
): Promise<ComplianceCheckResult | null> {
  const { data, error } = await supabase
    .from('ai_government_compliance_engine')
    .select(COMPLIANCE_COLS)
    .eq('target_service_id', targetServiceId)
    .order('evaluated_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapCompliance(data as ComplianceRow) : null;
}

export async function getFlaggedComplianceChecks(
  entityId: string,
  options: { limit?: number } = {}
): Promise<ComplianceCheckResult[]> {
  const { data, error } = await supabase
    .from('ai_government_compliance_engine')
    .select(COMPLIANCE_COLS)
    .eq('entity_id', entityId)
    .in('compliance_verdict', ['flagged_anomaly', 'investigation_required', 'fraud_blocked'])
    .order('evaluated_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ComplianceRow[]).map(mapCompliance);
}

// ── Part 4.2: Infinite Identity, Blockchain, Audit & AI Expansion ─────────
//
// Backend-only tables — zero frontend code:
//   citizen_sovereignty_quantum_failover_vault — encrypted_biometric_backup_hash (ABSOLUTE NEVER)

// ── Column constants ──────────────────────────────────────────────────────

const ZKP_COLS =
  'id, identity_check_id, zkp_proof_payload_hash, zero_knowledge_algorithm, zkp_status, verified_at';
// verification_latency_microseconds excluded — internal performance metric

const HYPER_LEDGER_COLS =
  'id, ledger_block_index, blockchain_verification_id, validator_node_signature_hash, consensus_algorithm, block_immutability_status, committed_at';

const ZERO_TRUST_AUDIT_COLS =
  'id, public_records_audit_id, behavioral_anomaly_flag, ai_mitigation_action, analyzed_at';
// zero_trust_risk_assessment_score excluded — internal AI scoring metric (NEVER)

const SENTINEL_COLS =
  'id, ai_compliance_engine_id, autonomous_sanction_triggered, sentinel_verdict, processed_at';
// neural_network_weight_hash excluded — internal AI model infrastructure
// regulatory_adaptation_summary excluded — internal AI neural output

// ── Row types ─────────────────────────────────────────────────────────────

type ZkpRow = {
  id: string;
  identity_check_id: string;
  zkp_proof_payload_hash: string;
  zero_knowledge_algorithm: string;
  zkp_status: ZkpStatus;
  verified_at: string;
};

type HyperLedgerRow = {
  id: string;
  ledger_block_index: number;
  blockchain_verification_id: string;
  validator_node_signature_hash: string;
  consensus_algorithm: string;
  block_immutability_status: BlockImmutabilityStatus;
  committed_at: string;
};

type ZeroTrustAuditRow = {
  id: string;
  public_records_audit_id: string;
  behavioral_anomaly_flag: boolean;
  ai_mitigation_action: MitigationAction;
  analyzed_at: string;
};

type SentinelRow = {
  id: string;
  ai_compliance_engine_id: string;
  autonomous_sanction_triggered: boolean;
  sentinel_verdict: SentinelVerdict;
  processed_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapZkp(r: ZkpRow): ZkpIdentityVerification {
  return {
    id: r.id,
    identityCheckId: r.identity_check_id,
    zkpProofPayloadHash: r.zkp_proof_payload_hash,
    zeroKnowledgeAlgorithm: r.zero_knowledge_algorithm,
    zkpStatus: r.zkp_status,
    verifiedAt: r.verified_at,
  };
}

function mapHyperLedger(r: HyperLedgerRow): HyperLedgerConsensusNode {
  return {
    id: r.id,
    ledgerBlockIndex: r.ledger_block_index,
    blockchainVerificationId: r.blockchain_verification_id,
    validatorNodeSignatureHash: r.validator_node_signature_hash,
    consensusAlgorithm: r.consensus_algorithm,
    blockImmutabilityStatus: r.block_immutability_status,
    committedAt: r.committed_at,
  };
}

function mapZeroTrustAudit(r: ZeroTrustAuditRow): ZeroTrustAccessAudit {
  return {
    id: r.id,
    publicRecordsAuditId: r.public_records_audit_id,
    behavioralAnomalyFlag: r.behavioral_anomaly_flag,
    aiMitigationAction: r.ai_mitigation_action,
    analyzedAt: r.analyzed_at,
  };
}

function mapSentinel(r: SentinelRow): ComplianceSentinelResult {
  return {
    id: r.id,
    aiComplianceEngineId: r.ai_compliance_engine_id,
    autonomousSanctionTriggered: r.autonomous_sanction_triggered,
    sentinelVerdict: r.sentinel_verdict,
    processedAt: r.processed_at,
  };
}

// ── ZKP Identity functions ────────────────────────────────────────────────

export async function getMyZkpVerifications(options: {
  zkpStatus?: ZkpStatus;
  limit?: number;
  before?: string;
} = {}): Promise<ZkpIdentityVerification[]> {
  let q = supabase
    .from('quantum_zero_knowledge_identity_matrix')
    .select(ZKP_COLS);

  if (options.zkpStatus) q = q.eq('zkp_status', options.zkpStatus);
  if (options.before) q = q.lt('verified_at', options.before);

  const { data, error } = await q
    .order('verified_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ZkpRow[]).map(mapZkp);
}

export async function getZkpVerificationByIdentityCheck(
  identityCheckId: string
): Promise<ZkpIdentityVerification | null> {
  const { data, error } = await supabase
    .from('quantum_zero_knowledge_identity_matrix')
    .select(ZKP_COLS)
    .eq('identity_check_id', identityCheckId)
    .order('verified_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapZkp(data as ZkpRow) : null;
}

// ── Hyper-Ledger Consensus functions ──────────────────────────────────────

export async function getHyperLedgerNode(
  blockchainVerificationId: string
): Promise<HyperLedgerConsensusNode | null> {
  const { data, error } = await supabase
    .from('sovereign_hyper_ledger_consensus_nodes')
    .select(HYPER_LEDGER_COLS)
    .eq('blockchain_verification_id', blockchainVerificationId)
    .single();
  if (error) throw error;
  return data ? mapHyperLedger(data as HyperLedgerRow) : null;
}

export async function getHyperLedgerByBlockIndex(
  ledgerBlockIndex: number
): Promise<HyperLedgerConsensusNode | null> {
  const { data, error } = await supabase
    .from('sovereign_hyper_ledger_consensus_nodes')
    .select(HYPER_LEDGER_COLS)
    .eq('ledger_block_index', ledgerBlockIndex)
    .single();
  if (error) throw error;
  return data ? mapHyperLedger(data as HyperLedgerRow) : null;
}

export async function getAnchoredBlocks(options: {
  status?: BlockImmutabilityStatus;
  limit?: number;
  before?: string;
} = {}): Promise<HyperLedgerConsensusNode[]> {
  let q = supabase
    .from('sovereign_hyper_ledger_consensus_nodes')
    .select(HYPER_LEDGER_COLS);

  if (options.status) {
    q = q.eq('block_immutability_status', options.status);
  } else {
    q = q.in('block_immutability_status', ['anchored', 'quantum_sealed']);
  }
  if (options.before) q = q.lt('committed_at', options.before);

  const { data, error } = await q
    .order('ledger_block_index', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as HyperLedgerRow[]).map(mapHyperLedger);
}

// ── Zero-Trust Access Audit functions ─────────────────────────────────────

export async function getZeroTrustAudit(
  publicRecordsAuditId: string
): Promise<ZeroTrustAccessAudit | null> {
  const { data, error } = await supabase
    .from('omnipresent_zero_trust_access_audit_core')
    .select(ZERO_TRUST_AUDIT_COLS)
    .eq('public_records_audit_id', publicRecordsAuditId)
    .single();
  if (error) throw error;
  return data ? mapZeroTrustAudit(data as ZeroTrustAuditRow) : null;
}

export async function getMyAnomalousAccessEvents(options: {
  mitigationAction?: MitigationAction;
  limit?: number;
  before?: string;
} = {}): Promise<ZeroTrustAccessAudit[]> {
  let q = supabase
    .from('omnipresent_zero_trust_access_audit_core')
    .select(ZERO_TRUST_AUDIT_COLS)
    .eq('behavioral_anomaly_flag', true);

  if (options.mitigationAction) q = q.eq('ai_mitigation_action', options.mitigationAction);
  if (options.before) q = q.lt('analyzed_at', options.before);

  const { data, error } = await q
    .order('analyzed_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ZeroTrustAuditRow[]).map(mapZeroTrustAudit);
}

// ── Compliance Sentinel functions ─────────────────────────────────────────

export async function getComplianceSentinelResult(
  aiComplianceEngineId: string
): Promise<ComplianceSentinelResult | null> {
  const { data, error } = await supabase
    .from('neural_autonomous_compliance_sentinel')
    .select(SENTINEL_COLS)
    .eq('ai_compliance_engine_id', aiComplianceEngineId)
    .order('processed_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapSentinel(data as SentinelRow) : null;
}

export async function getMyActiveSanctions(options: {
  limit?: number;
  before?: string;
} = {}): Promise<ComplianceSentinelResult[]> {
  let q = supabase
    .from('neural_autonomous_compliance_sentinel')
    .select(SENTINEL_COLS)
    .eq('autonomous_sanction_triggered', true);

  if (options.before) q = q.lt('processed_at', options.before);

  const { data, error } = await q
    .order('processed_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as SentinelRow[]).map(mapSentinel);
}

export async function getSentinelResultsByVerdict(
  sentinelVerdict: SentinelVerdict,
  options: { limit?: number } = {}
): Promise<ComplianceSentinelResult[]> {
  const { data, error } = await supabase
    .from('neural_autonomous_compliance_sentinel')
    .select(SENTINEL_COLS)
    .eq('sentinel_verdict', sentinelVerdict)
    .order('processed_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as SentinelRow[]).map(mapSentinel);
}
