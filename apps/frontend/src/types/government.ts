// ── Migration 019: Global Government Platform ─────────────────────────────
//
// Security rules for this domain:
//   - biometric_hash → ABSOLUTE NEVER (same as all biometric fields)
//   - licensing_metadata → EXCLUDE (internal government config)
//   - citizen_profiles fields → READ ONLY, own record (RLS-protected)
//   - All write operations → backend-only (official gov record changes)

// ── Part 1: Government Foundation ────────────────────────────────────────

// ── Government Entities ───────────────────────────────────────────────────

export const ENTITY_TYPES = [
  'government_ministry', 'municipality', 'tax_authority', 'immigration',
  'labor_department', 'licensing_office', 'courts', 'police_services', 'public_agency',
] as const;
export type EntityType = typeof ENTITY_TYPES[number];

export const ENTITY_VERIFICATION_STATUSES = [
  'pending', 'active', 'suspended', 'sovereign_certified',
] as const;
export type EntityVerificationStatus = typeof ENTITY_VERIFICATION_STATUSES[number];

export interface GovernmentEntity {
  id: string;
  organizationId: string | null;
  entityName: string;
  country: string;
  entityType: EntityType;
  currency: string;
  verificationStatus: EntityVerificationStatus;
  createdAt: string;
  updatedAt: string;
  // licensing_metadata excluded — internal government configuration
}

// ── Government Offices ────────────────────────────────────────────────────

export interface GovernmentOffice {
  id: string;
  entityId: string;
  officeName: string;
  city: string;
  address: string;
  gpsLatitude: number;
  gpsLongitude: number;
  workingHours: Record<string, unknown>;
  departmentsHoused: string[];
  isActive: boolean;
  createdAt: string;
}

// ── Citizen Profiles ──────────────────────────────────────────────────────

export const RESIDENCY_STATUSES = [
  'citizen', 'permanent_resident', 'temporary_worker', 'diplomat', 'refugee',
] as const;
export type ResidencyStatus = typeof RESIDENCY_STATUSES[number];

export interface CitizenProfile {
  id: string;
  userId: string;
  nationalIdNumber: string;
  countryOfCitizenship: string;
  residentialAddress: string;
  familyMembersJson: Record<string, unknown>[];
  residencyStatus: ResidencyStatus;
  createdAt: string;
  updatedAt: string;
  // biometric_hash excluded — ABSOLUTE NEVER
}

// ── Licenses ──────────────────────────────────────────────────────────────

export const LICENSE_TYPES = [
  'business_license', 'professional_license', 'driver_license',
  'construction_permit', 'medical_license', 'import_export_license',
] as const;
export type LicenseType = typeof LICENSE_TYPES[number];

export const LICENSE_STATUSES = [
  'pending', 'approved', 'suspended', 'expired', 'revoked',
] as const;
export type LicenseStatus = typeof LICENSE_STATUSES[number];

export interface License {
  id: string;
  entityId: string;
  citizenId: string | null;
  licenseType: LicenseType;
  holderName: string;
  licenseNumber: string;
  qrValidationCode: string;
  status: LicenseStatus;
  issuedDate: string;
  expiresDate: string;
  createdAt: string;
  updatedAt: string;
}

// ── Part 2: Permits, Certificates & Applications ─────────────────────────

// ── Permits ───────────────────────────────────────────────────────────────

export const PERMIT_TYPES = [
  'building_permit', 'import_permit', 'event_permit', 'work_permit',
  'environmental_permit', 'transit_permit',
] as const;
export type PermitType = typeof PERMIT_TYPES[number];

export const PERMIT_WORKFLOW_STATUSES = [
  'submitted', 'under_review', 'approved', 'rejected', 'issued',
] as const;
export type PermitWorkflowStatus = typeof PERMIT_WORKFLOW_STATUSES[number];

export interface Permit {
  id: string;
  entityId: string;
  applicantUserId: string;
  permitType: PermitType;
  permitDetailsJson: Record<string, unknown>;
  workflowStatus: PermitWorkflowStatus;
  reviewerUserId: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// ── Certificates ──────────────────────────────────────────────────────────

export const CERTIFICATE_TYPES = [
  'birth_certificate', 'marriage_certificate', 'business_certificate',
  'criminal_record', 'residency_certificate', 'export_certificate',
] as const;
export type CertificateType = typeof CERTIFICATE_TYPES[number];

export const CERTIFICATE_VERIFICATION_STATUSES = [
  'pending', 'verified', 'revoked', 'quantum_certified',
] as const;
export type CertificateVerificationStatus = typeof CERTIFICATE_VERIFICATION_STATUSES[number];

export interface Certificate {
  id: string;
  entityId: string;
  ownerUserId: string;
  certificateType: CertificateType;
  certificatePayload: Record<string, unknown>;
  verificationStatus: CertificateVerificationStatus;
  qrCodeHash: string;
  blockchainHash: string;
  digitalSignatureRef: string;
  issuedAt: string;
}

// ── Government Applications ───────────────────────────────────────────────

export const APPLICATION_STAGES = [
  'submitted', 'document_review', 'department_approval', 'fee_pending', 'issued', 'rejected',
] as const;
export type ApplicationStage = typeof APPLICATION_STAGES[number];

export interface GovernmentApplication {
  id: string;
  entityId: string;
  applicantUserId: string;
  serviceCategory: string;
  applicationPayloadJson: Record<string, unknown>;
  currentStage: ApplicationStage;
  trackingReferenceCode: string;
  createdAt: string;
  updatedAt: string;
}

// ── Part 3: Tax, Payments & Signatures ───────────────────────────────────

// ── Tax Services ──────────────────────────────────────────────────────────

export const TAX_TYPES = [
  'VAT', 'corporate_income_tax', 'personal_income_tax', 'property_tax', 'customs_duty',
] as const;
export type TaxType = typeof TAX_TYPES[number];

export const TAX_FILING_STATUSES = [
  'draft', 'submitted', 'under_audit', 'approved', 'paid', 'penalized',
] as const;
export type TaxFilingStatus = typeof TAX_FILING_STATUSES[number];

export interface TaxService {
  id: string;
  entityId: string;
  taxpayerIdentifier: string;
  taxType: TaxType;
  taxPeriod: string;
  declaredAmount: number;
  paidAmount: number;
  currency: string;
  filingStatus: TaxFilingStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Government Payments ───────────────────────────────────────────────────

export const GOV_SERVICE_TYPES = [
  'tax', 'business_license', 'permit', 'certificate', 'fine', 'identity_fee',
] as const;
export type GovServiceType = typeof GOV_SERVICE_TYPES[number];

export const GOV_PAYMENT_METHODS = [
  'wallet', 'bank_transfer', 'credit_card', 'crypto_sovereign', 'government_credit',
] as const;
export type GovPaymentMethod = typeof GOV_PAYMENT_METHODS[number];

export const GOV_PAYMENT_STATUSES = [
  'pending', 'completed', 'failed', 'refunded',
] as const;
export type GovPaymentStatus = typeof GOV_PAYMENT_STATUSES[number];

export interface GovernmentPayment {
  id: string;
  entityId: string;
  payerUserId: string;
  serviceType: GovServiceType;
  referenceId: string;
  amount: number;
  currency: string;
  paymentMethod: GovPaymentMethod;
  paymentStatus: GovPaymentStatus;
  transactionReceiptHash: string;
  createdAt: string;
}

// ── Digital Signatures ────────────────────────────────────────────────────

export interface DigitalSignature {
  id: string;
  signerUserId: string;
  targetDocumentType: string;
  targetDocumentId: string;
  publicKeyFingerprint: string;
  signatureHash: string;
  verificationAlgorithm: string;
  signedAt: string;
}

// ── Part 4: Identity, Blockchain, Audit & AI ─────────────────────────────

// ── Identity Checks ───────────────────────────────────────────────────────

export const IDENTITY_DOCUMENT_TYPES = [
  'passport', 'national_id', 'drivers_license', 'face_biometric', 'residency_card',
] as const;
export type IdentityDocumentType = typeof IDENTITY_DOCUMENT_TYPES[number];

export const IDENTITY_VERIFICATION_STATUSES = [
  'pending', 'verified', 'rejected', 'fraud_flagged',
] as const;
export type IdentityVerificationStatus = typeof IDENTITY_VERIFICATION_STATUSES[number];

export interface IdentityCheck {
  id: string;
  userId: string;
  documentType: IdentityDocumentType;
  documentNumber: string;
  countryOfIssue: string;
  verificationStatus: IdentityVerificationStatus;
  verifiedByEntityId: string | null;
  verifiedAt: string;
  // confidence_score excluded — internal AI/KYC scoring metric (NEVER)
}

// ── Blockchain Verification Ledger ────────────────────────────────────────

export interface BlockchainVerificationEntry {
  id: string;
  recordType: string;
  recordId: string;
  blockHash: string;
  previousBlockHash: string;
  nodeValidatorSignature: string;
  anchoredAt: string;
}

// ── Public Records Audit ──────────────────────────────────────────────────

export interface PublicRecordAudit {
  id: string;
  accessorUserId: string;
  targetCitizenOrEntityId: string;
  actionPerformed: string;
  accessGranted: boolean;
  justificationNotes: string | null;
  accessedAt: string;
  // ip_address excluded — PII (NEVER; same pattern as all audit log tables)
}

// ── AI Government Compliance Engine ──────────────────────────────────────

export const COMPLIANCE_VERDICTS = [
  'compliant', 'flagged_anomaly', 'investigation_required', 'fraud_blocked',
] as const;
export type ComplianceVerdict = typeof COMPLIANCE_VERDICTS[number];

export interface ComplianceCheckResult {
  id: string;
  entityId: string;
  targetServiceId: string;
  complianceVerdict: ComplianceVerdict;
  evaluatedAt: string;
  // ai_risk_score excluded — internal AI scoring metric (NEVER)
  // neural_analysis_summary excluded — internal AI neural output
}

// ── Part 4.2: Infinite Identity, Blockchain, Audit & AI Expansion ─────────
//
// Backend-only tables (no frontend types or functions):
//   citizen_sovereignty_quantum_failover_vault — encrypted_biometric_backup_hash (ABSOLUTE NEVER:
//     biometric data + encryption material); decentralized_shard_locations (internal infrastructure)

// ── ZK Identity Matrix ────────────────────────────────────────────────────

export const ZKP_STATUSES = [
  'pending', 'verified_anonymous', 'proof_invalid', 'quantum_secured',
] as const;
export type ZkpStatus = typeof ZKP_STATUSES[number];

export interface ZkpIdentityVerification {
  id: string;
  identityCheckId: string;
  zkpProofPayloadHash: string;
  zeroKnowledgeAlgorithm: string;
  zkpStatus: ZkpStatus;
  verifiedAt: string;
  // verification_latency_microseconds excluded — internal performance metric
}

// ── Sovereign Hyper-Ledger Consensus Nodes ────────────────────────────────

export const BLOCK_IMMUTABILITY_STATUSES = [
  'pending_consensus', 'anchored', 'quantum_sealed', 'disputed',
] as const;
export type BlockImmutabilityStatus = typeof BLOCK_IMMUTABILITY_STATUSES[number];

export interface HyperLedgerConsensusNode {
  id: string;
  ledgerBlockIndex: number;
  blockchainVerificationId: string;
  validatorNodeSignatureHash: string;
  consensusAlgorithm: string;
  blockImmutabilityStatus: BlockImmutabilityStatus;
  committedAt: string;
}

// ── Zero-Trust Access Audit Core ──────────────────────────────────────────

export const MITIGATION_ACTIONS = [
  'allow_instant', 'step_up_biometric_auth', 'session_terminated', 'quantum_lockdown',
] as const;
export type MitigationAction = typeof MITIGATION_ACTIONS[number];

export interface ZeroTrustAccessAudit {
  id: string;
  publicRecordsAuditId: string;
  behavioralAnomalyFlag: boolean;
  aiMitigationAction: MitigationAction;
  analyzedAt: string;
  // zero_trust_risk_assessment_score excluded — internal AI scoring metric (NEVER)
}

// ── Neural Compliance Sentinel ────────────────────────────────────────────

export const SENTINEL_VERDICTS = [
  'fully_compliant', 'auto_corrected', 'escalated_sovereign', 'blocked_malicious',
] as const;
export type SentinelVerdict = typeof SENTINEL_VERDICTS[number];

export interface ComplianceSentinelResult {
  id: string;
  aiComplianceEngineId: string;
  autonomousSanctionTriggered: boolean;
  sentinelVerdict: SentinelVerdict;
  processedAt: string;
  // neural_network_weight_hash excluded — internal AI model infrastructure
  // regulatory_adaptation_summary excluded — internal AI neural output
}

// ── Part 3.2: Infinite Tax, Payments & Signatures Expansion ──────────────

// ── Tax Audit Engine ──────────────────────────────────────────────────────

export const AI_AUDIT_VERDICTS = [
  'cleared_optimal', 'anomaly_flagged', 'evasion_detected', 'quantum_fast_approved',
] as const;
export type AiAuditVerdict = typeof AI_AUDIT_VERDICTS[number];

export interface TaxAuditResult {
  id: string;
  taxServiceId: string;
  aiAuditVerdict: AiAuditVerdict;
  auditedAt: string;
  // anomaly_risk_score excluded — internal AI scoring metric (NEVER)
  // neural_audit_report_json excluded — internal AI neural processing data
}

// ── CBDC Instant Settlement Ledger ────────────────────────────────────────

export const CBDC_SETTLEMENT_STATUSES = [
  'pending', 'settled_instantly', 'failed_rollback', 'quantum_escrow',
] as const;
export type CbdcSettlementStatus = typeof CBDC_SETTLEMENT_STATUSES[number];

export interface CbdcSettlement {
  id: string;
  governmentPaymentId: string;
  cbdcTokenIdentifier: string;
  settlementStatus: CbdcSettlementStatus;
  settledAt: string;
  // settlement_latency_microseconds excluded — internal performance metric
  // blockchain_consensus_node excluded — internal infrastructure identifier
}

// ── Cross-Border Fiscal Reconciliation ───────────────────────────────────

export const RECONCILIATION_STATUSES = [
  'pending', 'synchronized', 'disputed', 'exempt_treaty',
] as const;
export type ReconciliationStatus = typeof RECONCILIATION_STATUSES[number];

export interface FiscalReconciliation {
  id: string;
  originEntityId: string;
  destinationCountryCode: string;
  declaredGoodsValue: number;
  customsDutyCalculated: number;
  reconciliationStatus: ReconciliationStatus;
  updatedAt: string;
}

// ── Post-Quantum Cryptographic Stamp Vault ────────────────────────────────

export const RESISTANCE_LEVELS = [
  'standard', 'quantum_grade_1', 'quantum_grade_3', 'post_quantum_grade_5',
] as const;
export type ResistanceLevel = typeof RESISTANCE_LEVELS[number];

export interface CryptographicStamp {
  id: string;
  digitalSignatureId: string;
  latticePublicKeyHash: string;
  hashBasedSignatureProof: string;
  resistanceLevel: ResistanceLevel;
  stampedAt: string;
}

// ── Government Revenue Optimization AI ───────────────────────────────────

export interface RevenueOptimizationForecast {
  id: string;
  entityId: string;
  economicForecastPeriod: string;
  projectedNationalRevenue: number;
  aiOptimizationRecommendationsJson: Record<string, unknown>;
  generatedAt: string;
  // model_confidence_index excluded — internal AI confidence metric (NEVER)
}

// ── Part 2.2: Infinite Permits & Certificates Expansion ──────────────────
//
// Backend-only tables (no frontend types or functions):
//   sovereign_digital_certificates_vault — post_quantum_encryption_hash (ABSOLUTE NEVER);
//                                          remaining fields redundant or internal infrastructure

// ── Smart Permits Automation ──────────────────────────────────────────────

export const AUTOMATED_APPROVAL_STATUSES = [
  'ai_approved', 'manual_override_required', 'environmental_flagged', 'quantum_cleared',
] as const;
export type AutomatedApprovalStatus = typeof AUTOMATED_APPROVAL_STATUSES[number];

export interface SmartPermitAutomation {
  id: string;
  permitId: string;
  aiSpatialAnalysisJson: Record<string, unknown>;
  environmentalImpactScore: number;
  automatedApprovalStatus: AutomatedApprovalStatus;
  executedAt: string;
}

// ── Government Multiphase Workflow Engine ─────────────────────────────────

export const PHASE_STATUSES = [
  'pending', 'in_progress', 'passed', 'failed', 'quantum_fast_tracked',
] as const;
export type PhaseStatus = typeof PHASE_STATUSES[number];

export interface WorkflowPhase {
  id: string;
  applicationId: string;
  currentPhaseName: string;
  phaseStatus: PhaseStatus;
  updatedAt: string;
  // workflow_metadata_json excluded — internal workflow processing configuration
}

// ── Cross-Border Credential Verification Node ─────────────────────────────

export const VALIDATION_VERDICTS = [
  'valid_authentic', 'expired', 'revoked', 'forgery_detected',
] as const;
export type ValidationVerdict = typeof VALIDATION_VERDICTS[number];

export interface CrossBorderCredentialVerification {
  id: string;
  sourceEntityId: string;
  requestingCountryCode: string;
  credentialType: string;
  credentialReferenceHash: string;
  validationVerdict: ValidationVerdict;
  verifiedAt: string;
}

// ── Citizen Digital Vault Access Logs ─────────────────────────────────────

export interface VaultAccessLog {
  id: string;
  citizenUserId: string;
  accessorEntityOrUserId: string;
  documentAccessedType: string;
  accessPurpose: string;
  cryptographicConsentHash: string;
  loggedAt: string;
}

// ── Part 1.2: Infinite GovOS Foundation Expansion ─────────────────────────
//
// Backend-only tables (no frontend types or functions):
//   quantum_sovereign_identity_vault       — biometric vectors + quantum encryption key (ABSOLUTE NEVER)
//   government_autonomous_ai_decision_engine — internal AI processing log; outcomes surfaced via licenses
//   citizen_quantum_trust_score_ledger     — trust_score_index = internal AI metric (NEVER)

// ── Cross-Border Diplomatic Treaty Matrix ─────────────────────────────────

export const TREATY_TYPES = [
  'free_movement', 'visa_exempt', 'digital_nomad_accord', 'trade_partnership', 'quantum_border_pact',
] as const;
export type TreatyType = typeof TREATY_TYPES[number];

export interface DiplomaticTreaty {
  id: string;
  sourceCountryCode: string;
  destinationCountryCode: string;
  treatyType: TreatyType;
  automaticWorkAuthorization: boolean;
  isActive: boolean;
  createdAt: string;
  // treaty_metadata_json excluded — internal diplomatic configuration
}

// ── National Infrastructure Digital Twins ────────────────────────────────

export const INFRASTRUCTURE_TYPES = [
  'smart_grid', 'transport_network', 'water_management', 'telecom_backbone', 'quantum_node',
] as const;
export type InfrastructureType = typeof INFRASTRUCTURE_TYPES[number];

export const INFRASTRUCTURE_STATUSES = [
  'optimal', 'warning', 'critical_maintenance', 'autonomous_failover',
] as const;
export type InfrastructureStatus = typeof INFRASTRUCTURE_STATUSES[number];

export interface InfrastructureDigitalTwin {
  id: string;
  entityId: string;
  infrastructureName: string;
  infrastructureType: InfrastructureType;
  operationalHealthIndex: number;
  status: InfrastructureStatus;
  updatedAt: string;
  // sensor_telemetry_json excluded — raw national infrastructure IoT (security risk)
}
