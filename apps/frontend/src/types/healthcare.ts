// ── Healthcare Platform ───────────────────────────────────────────────────
//
// NOTE: Migration 018 Part 1.1 (base tables) received. Types below cover
// Part 1: healthcare_providers, hospitals, clinics, doctors, hospital_departments.
// Subsequent parts will be appended as received.

// ── Healthcare Providers ──────────────────────────────────────────────────

export const PROVIDER_TYPES = [
  'hospital_group', 'private_clinic', 'laboratory', 'pharmacy',
  'telemedicine', 'ngo', 'government_system', 'quantum_health_node',
] as const;
export type ProviderType = typeof PROVIDER_TYPES[number];

export const HEALTHCARE_VERIFICATION_STATUSES = [
  'pending', 'verified', 'suspended', 'quantum_certified',
] as const;
export type HealthcareVerificationStatus = typeof HEALTHCARE_VERIFICATION_STATUSES[number];

export interface HealthcareProvider {
  id: string;
  organizationId: string | null;
  providerName: string;
  providerType: ProviderType;
  country: string;
  currency: string;
  licensingDetails: Record<string, unknown>;
  verificationStatus: HealthcareVerificationStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // ai_health_config excluded — internal AI system configuration
}

// ── Hospitals ─────────────────────────────────────────────────────────────

export interface Hospital {
  id: string;
  providerId: string;
  hospitalName: string;
  city: string;
  address: string;
  gpsLatitude: number;
  gpsLongitude: number;
  totalBeds: number;
  emergencyDepartmentAvailable: boolean;
  icuBedsCount: number;
  surgeryRoomsCount: number;
  equipmentMetadata: Record<string, unknown>[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Clinics ───────────────────────────────────────────────────────────────

export const SPECIALTY_FOCUSES = [
  'General Practice', 'Dentistry', 'Cardiology', 'Pediatrics',
  'Dermatology', 'Diagnostics', 'Orthopedics', 'Quantum Holistic',
] as const;
export type SpecialtyFocus = typeof SPECIALTY_FOCUSES[number];

export interface Clinic {
  id: string;
  providerId: string;
  clinicName: string;
  specialtyFocus: SpecialtyFocus;
  city: string;
  address: string;
  gpsLatitude: number;
  gpsLongitude: number;
  operatingHours: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Doctors ───────────────────────────────────────────────────────────────

export const DOCTOR_VERIFICATION_STATUSES = [
  'pending', 'verified', 'quantum_certified',
] as const;
export type DoctorVerificationStatus = typeof DOCTOR_VERIFICATION_STATUSES[number];

export interface Doctor {
  id: string;
  userId: string;
  providerId: string | null;
  hospitalId: string | null;
  clinicId: string | null;
  fullName: string;
  licenseNumber: string; // publicly verifiable credential
  specialty: string;
  languagesSpoken: string[];
  yearsExperience: number;
  availabilitySchedule: Record<string, unknown>;
  consultationFee: number;
  currency: string;
  verificationStatus: DoctorVerificationStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Hospital Departments ──────────────────────────────────────────────────

export interface HospitalDepartment {
  id: string;
  hospitalId: string;
  departmentName: string;
  headDoctorId: string | null;
  departmentCapacity: number;
  createdAt: string;
}

// ── Part 2: Patient & Medical Core ───────────────────────────────────────

// ── Patients ──────────────────────────────────────────────────────────────

export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown',
] as const;
export type BloodType = typeof BLOOD_TYPES[number];

export interface Patient {
  id: string;
  userId: string;
  bloodType: BloodType;
  allergies: string[];
  chronicConditions: string[];
  emergencyContacts: Record<string, unknown>[];
  consentSettings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── Appointments ──────────────────────────────────────────────────────────

export const APPOINTMENT_TYPES = [
  'in_person', 'video_consultation', 'emergency', 'follow_up',
] as const;
export type AppointmentType = typeof APPOINTMENT_TYPES[number];

export const APPOINTMENT_STATUSES = [
  'pending', 'confirmed', 'completed', 'cancelled', 'emergency_routed',
] as const;
export type AppointmentStatus = typeof APPOINTMENT_STATUSES[number];

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string | null;
  clinicId: string | null;
  appointmentType: AppointmentType;
  scheduledTime: string;
  appointmentStatus: AppointmentStatus;
  consultationNotes: string | null; // patient has legal right to own notes (RLS-protected)
  feeCharged: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// ── Healthcare Staff ──────────────────────────────────────────────────────

export const STAFF_ROLES = [
  'nurse', 'technician', 'pharmacist', 'administrator', 'radiologist', 'paramedic',
] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export interface HealthcareStaff {
  id: string;
  hospitalId: string | null;
  clinicId: string | null;
  userId: string;
  fullName: string;
  staffRole: StaffRole;
  shiftSchedule: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

// ── Part 3: Records, Labs, Pharmacy & Insurance ───────────────────────────

// ── Medical Records ───────────────────────────────────────────────────────

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  labResultsJson: Record<string, unknown>;
  imagingAttachments: string[];
  doctorNotes: string;
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
  // access_permissions_json excluded — internal access control config (confused deputy risk)
}

// ── Prescriptions ─────────────────────────────────────────────────────────

export const PHARMACY_FULFILLMENT_STATUSES = [
  'pending', 'processing', 'ready', 'dispensed',
] as const;
export type PharmacyFulfillmentStatus = typeof PHARMACY_FULFILLMENT_STATUSES[number];

export interface Prescription {
  id: string;
  medicalRecordId: string;
  patientId: string;
  doctorId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  pharmacyFulfillmentStatus: PharmacyFulfillmentStatus;
  createdAt: string;
}

// ── Laboratories ──────────────────────────────────────────────────────────

export interface Laboratory {
  id: string;
  providerId: string;
  labName: string;
  city: string;
  address: string;
  supportedTests: Record<string, unknown>[];
  isActive: boolean;
  createdAt: string;
}

// ── Lab Results ───────────────────────────────────────────────────────────

export interface LabResult {
  id: string;
  laboratoryId: string;
  patientId: string;
  testName: string;
  testParametersJson: Record<string, unknown>;
  findingsSummary: string;
  certifiedByDoctorId: string | null;
  testedAt: string;
}

// ── Pharmacies ────────────────────────────────────────────────────────────

export interface Pharmacy {
  id: string;
  providerId: string;
  pharmacyName: string;
  city: string;
  address: string;
  inventoryMedicationsJson: Record<string, unknown>[];
  isOpen247: boolean;
  isActive: boolean;
  createdAt: string;
}

// ── Insurance Plans ───────────────────────────────────────────────────────

export interface InsurancePlan {
  id: string;
  insuranceCompanyName: string;
  planName: string;
  coveragePercentage: number;
  country: string;
  isActive: boolean;
  createdAt: string;
}

// ── Insurance Claims ──────────────────────────────────────────────────────

export const INSURANCE_CLAIM_STATUSES = [
  'submitted', 'under_review', 'approved', 'rejected', 'auto_settled',
] as const;
export type InsuranceClaimStatus = typeof INSURANCE_CLAIM_STATUSES[number];

export interface InsuranceClaim {
  id: string;
  insuranceId: string;
  patientId: string;
  medicalRecordId: string | null;
  claimAmount: number;
  approvedAmount: number;
  currency: string;
  claimStatus: InsuranceClaimStatus;
  createdAt: string;
}

// ── Medical Billing ───────────────────────────────────────────────────────

export const BILLING_PAYMENT_STATUSES = [
  'pending', 'paid', 'insurance_processing', 'refunded',
] as const;
export type BillingPaymentStatus = typeof BILLING_PAYMENT_STATUSES[number];

export interface MedicalBill {
  id: string;
  patientId: string;
  providerId: string | null;
  totalBillAmount: number;
  insuranceCoveredAmount: number;
  patientOutOfPocket: number;
  currency: string;
  paymentStatus: BillingPaymentStatus;
  createdAt: string;
}

// ── Part 3.2: Records & Pharmacy Expansion ───────────────────────────────

// ── Medical Imaging DICOM Vault ───────────────────────────────────────────

export const MODALITY_TYPES = [
  'MRI', 'CT_SCAN', 'X_RAY', 'ULTRASOUND', 'PET_SCAN', 'QUANTUM_SCAN',
] as const;
export type ModalityType = typeof MODALITY_TYPES[number];

export interface MedicalImagingRecord {
  id: string;
  medicalRecordId: string;
  patientId: string;
  modalityType: ModalityType;
  dicomFileUrl: string;
  aiPathologyFindingsJson: Record<string, unknown>;
  anomalyDetected: boolean;
  createdAt: string;
  // encryption_quantum_hash excluded — cryptographic reference (NEVER)
}

// ── Pharmacy Autonomous Dispensing Units ──────────────────────────────────

export const DISPENSING_STATUSES = [
  'dispensing', 'safety_verified', 'ready_for_pickup', 'drone_dispatched',
] as const;
export type DispensingStatus = typeof DISPENSING_STATUSES[number];

export const DRUG_INTERACTION_LEVELS = [
  'safe', 'moderate_caution', 'severe_alert', 'blocked_by_ai',
] as const;
export type DrugInteractionLevel = typeof DRUG_INTERACTION_LEVELS[number];

export interface PharmacyDispensingUnit {
  id: string;
  pharmacyId: string;
  prescriptionId: string;
  dispensingRobotStatus: DispensingStatus;
  drugInteractionWarningLevel: DrugInteractionLevel;
  dispensedAt: string;
}

// ── FHIR/HL7 Interoperability Hub ────────────────────────────────────────

export const FHIR_SYNC_STATUSES = [
  'pending', 'synchronized', 'failed', 'quantum_routed',
] as const;
export type FhirSyncStatus = typeof FHIR_SYNC_STATUSES[number];

export interface FhirInteroperabilityRecord {
  id: string;
  patientId: string;
  externalSystemDestination: string;
  syncStatus: FhirSyncStatus;
  transmittedAt: string;
  // fhir_resource_payload_json excluded — raw internal FHIR interchange format
}

// ── Insurance Smart Contract Settlement ──────────────────────────────────

export interface InsuranceSmartContractSettlement {
  id: string;
  insuranceClaimId: string;
  payoutExecuted: boolean;
  executedAt: string;
  // smart_contract_hash excluded — cryptographic reference (NEVER)
  // settlement_speed_milliseconds excluded — internal technical metric
  // blockchain_network_node excluded — internal infrastructure detail
}

// ── Patient Biometric Consent Ledger ──────────────────────────────────────

export interface PatientConsentEntry {
  id: string;
  patientId: string;
  authorizedDoctorId: string | null;
  accessScopeJson: Record<string, unknown>;
  isRevoked: boolean;
  expiresAt: string;
  createdAt: string;
  // biometric_signature_hash excluded — biometric data hash (NEVER)
}

// ── Part 4: AI, Emergency & Analytics ────────────────────────────────────

// ── Ambulances ────────────────────────────────────────────────────────────

export interface Ambulance {
  id: string;
  providerId: string;
  vehicleLicensePlate: string;
  currentGpsLatitude: number;
  currentGpsLongitude: number;
  isAvailable: boolean;
  createdAt: string;
}

// ── Emergency Requests ────────────────────────────────────────────────────

export const EMERGENCY_TYPES = [
  'accident', 'cardiac_arrest', 'pregnancy', 'trauma', 'quantum_sos',
] as const;
export type EmergencyType = typeof EMERGENCY_TYPES[number];

export const RESPONSE_STATUSES = [
  'dispatched', 'en_route', 'hospital_arrived', 'resolved',
] as const;
export type ResponseStatus = typeof RESPONSE_STATUSES[number];

export interface EmergencyRequest {
  id: string;
  patientId: string | null;
  nearestHospitalId: string | null;
  ambulanceId: string | null;
  incidentLocationText: string;
  gpsLatitude: number;
  gpsLongitude: number;
  emergencyType: EmergencyType;
  distanceToNearestHospitalKm: number;
  responseStatus: ResponseStatus;
  createdAt: string;
}

// ── AI Diagnosis Assistance ───────────────────────────────────────────────

export interface AiDiagnosisAssistance {
  id: string;
  patientId: string;
  symptomsPayloadJson: Record<string, unknown>;
  aiSuggestedDiagnoses: Record<string, unknown>[];
  reviewedByDoctorId: string | null;
  createdAt: string;
  // confidence_score excluded — internal AI metric (NEVER)
}

// ── Healthcare Audit Logs ─────────────────────────────────────────────────

export interface HealthcareAuditLog {
  id: string;
  userId: string;
  actionPerformed: string;
  targetResourceId: string;
  accessGranted: boolean;
  loggedAt: string;
  // ip_address excluded — PII (NEVER; same pattern as all audit log tables)
}

// ── Healthcare Analytics Singularity ──────────────────────────────────────

export interface HealthcareAnalyticsSingularity {
  id: string;
  metricCategory: string;
  metricsPayload: Record<string, unknown>;
  recordedAt: string;
  // neural_trend_summary excluded — internal AI-generated trend text
}

// ── Part 1.2: Foundation Expansion ───────────────────────────────────────
//
// quantum_genomic_profiles → ENTIRE TABLE BACKEND ONLY
//   dna_mutation_markers_json    — raw genetic code, highest PHI category (ABSOLUTE NEVER)
//   pharmacogenomics_profile_json — drug-gene interaction data (ABSOLUTE NEVER)
//   ai_longevity_score           — insurance/employment discrimination risk (NEVER)
//   encryption_key_reference     — cryptographic key material (ABSOLUTE NEVER)
//   genomic_data_hash            — unique biometric identifier (NEVER)

// ── Hospital Robotic Surgical Units ──────────────────────────────────────

export const SURGICAL_UNIT_STATUSES = [
  'standby', 'active_surgery', 'calibrating', 'maintenance', 'quantum_locked',
] as const;
export type SurgicalUnitStatus = typeof SURGICAL_UNIT_STATUSES[number];

export interface HospitalRoboticSurgicalUnit {
  id: string;
  hospitalId: string;
  unitModelName: string;
  operationalStatus: SurgicalUnitStatus;
  precisionLevelMicrons: number;
  remoteSurgeonLinkedId: string | null;
  lastDiagnosticAt: string;
}

// ── Doctor Neural Reputation Matrix ──────────────────────────────────────

export const DOCTOR_STATUS_TIERS = [
  'verified', 'expert', 'master', 'quantum_elite',
] as const;
export type DoctorStatusTier = typeof DOCTOR_STATUS_TIERS[number];

export interface DoctorNeuralReputation {
  id: string;
  doctorId: string;
  totalSurgeriesPerformed: number;
  successRatePercentage: number;
  patientSatisfactionIndex: number;
  statusTier: DoctorStatusTier;
  updatedAt: string;
  // ai_peer_review_score excluded — internal AI algorithm output (NEVER)
}

// ── Clinical Trial Global Registry ───────────────────────────────────────

export const PHASE_LEVELS = [
  'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Quantum Trial',
] as const;
export type PhaseLevel = typeof PHASE_LEVELS[number];

export interface ClinicalTrial {
  id: string;
  sponsorProviderId: string;
  trialTitle: string;
  medicalConditionTarget: string;
  phaseLevel: PhaseLevel;
  eligibilityCriteriaJson: Record<string, unknown>;
  slotsAvailable: number;
  isRecruiting: boolean;
  createdAt: string;
}

// ── Provider Quantum Supply Chain ─────────────────────────────────────────

export const SUPPLY_ITEM_CATEGORIES = [
  'blood_bank', 'organ_transplant', 'rare_medication', 'surgical_kits', 'quantum_serum',
] as const;
export type SupplyItemCategory = typeof SUPPLY_ITEM_CATEGORIES[number];

export const SUPPLY_ITEM_STATUSES = [
  'optimal', 'low_stock', 'critical_replenishment', 'expired',
] as const;
export type SupplyItemStatus = typeof SUPPLY_ITEM_STATUSES[number];

export interface ProviderSupplyChainItem {
  id: string;
  providerId: string;
  itemCategory: SupplyItemCategory;
  itemName: string;
  stockQuantity: number;
  storageTemperatureCelsius: number;
  itemStatus: SupplyItemStatus;
  updatedAt: string;
  // auto_reorder_threshold excluded — internal logistics parameter
}

// ── Part 4.2: Quantum Singularity Security & Emergency Expansion ──────────
//
// Backend-only tables (no frontend types or functions):
//   zero_day_threat_immunity_shield  — security operations; node_source_ip = attacker IP
//   sovereign_health_singularity_matrix — internal system registry; no user-facing data

// ── Quantum Drone Ambulance Dispatch ──────────────────────────────────────

export const DRONE_PAYLOAD_TYPES = [
  'emergency_medical_kit', 'blood_bag', 'defibrillator', 'antivenom', 'quantum_serum',
] as const;
export type DronePayloadType = typeof DRONE_PAYLOAD_TYPES[number];

export const DRONE_FLIGHT_STATUSES = [
  'standby', 'airborne', 'delivered', 'returning', 'quantum_docked',
] as const;
export type DroneFlightStatus = typeof DRONE_FLIGHT_STATUSES[number];

export interface DroneDispatch {
  id: string;
  emergencyRequestId: string | null;
  droneUnitCode: string;
  payloadType: DronePayloadType;
  flightPathGpsJson: unknown[];
  flightStatus: DroneFlightStatus;
  etaSeconds: number;
  launchedAt: string;
}

// ── Neural Disaster Epidemic Predictor ────────────────────────────────────

export const FORECAST_STATUSES = [
  'active_monitoring', 'warning_issued', 'lockdown_suggested', 'neutralized',
] as const;
export type ForecastStatus = typeof FORECAST_STATUSES[number];

export interface EpidemicForecast {
  id: string;
  regionCountryCode: string;
  predictedPathogenType: string;
  riskProbabilityIndex: number;
  recommendedHospitalPreparations: Record<string, unknown>;
  forecastStatus: ForecastStatus;
  calculatedAt: string;
}

// ── Quantum Cryptographic Audit Trail ─────────────────────────────────────

export const AUDIT_TRAIL_VERIFICATION_STATUSES = [
  'pending', 'verified_immutable', 'flagged_tampered',
] as const;
export type AuditTrailVerificationStatus = typeof AUDIT_TRAIL_VERIFICATION_STATUSES[number];

export interface QuantumAuditTrailEntry {
  id: string;
  actorUserId: string;
  actionSignatureHash: string;
  targetTableName: string;
  verificationStatus: AuditTrailVerificationStatus;
  recordedAt: string;
  // cryptographic_proof_key excluded — cryptographic material (ABSOLUTE NEVER)
}
