import { supabase } from '../../lib/supabase';
import type {
  HealthcareProvider,
  ProviderType,
  HealthcareVerificationStatus,
  Hospital,
  Clinic,
  SpecialtyFocus,
  Doctor,
  DoctorVerificationStatus,
  HospitalDepartment,
  Patient,
  BloodType,
  Appointment,
  AppointmentType,
  AppointmentStatus,
  HealthcareStaff,
  StaffRole,
  MedicalRecord,
  Prescription,
  PharmacyFulfillmentStatus,
  Laboratory,
  LabResult,
  Pharmacy,
  InsurancePlan,
  InsuranceClaim,
  InsuranceClaimStatus,
  MedicalBill,
  BillingPaymentStatus,
  MedicalImagingRecord,
  ModalityType,
  PharmacyDispensingUnit,
  DispensingStatus,
  DrugInteractionLevel,
  FhirInteroperabilityRecord,
  FhirSyncStatus,
  InsuranceSmartContractSettlement,
  PatientConsentEntry,
  HospitalRoboticSurgicalUnit,
  SurgicalUnitStatus,
  DoctorNeuralReputation,
  DoctorStatusTier,
  ClinicalTrial,
  PhaseLevel,
  ProviderSupplyChainItem,
  SupplyItemCategory,
  SupplyItemStatus,
  Ambulance,
  EmergencyRequest,
  EmergencyType,
  ResponseStatus,
  AiDiagnosisAssistance,
  HealthcareAuditLog,
  HealthcareAnalyticsSingularity,
  DroneDispatch,
  DronePayloadType,
  DroneFlightStatus,
  EpidemicForecast,
  ForecastStatus,
  QuantumAuditTrailEntry,
  AuditTrailVerificationStatus,
} from '../../types/healthcare';

// Backend-only fields (never queried from frontend):
//   healthcare_providers: ai_health_config — internal AI system configuration

// ── Column constants ───────────────────────────────────────────────────────

const PROVIDER_COLS =
  'id, organization_id, provider_name, provider_type, country, currency, licensing_details, verification_status, is_active, created_at, updated_at';
// ai_health_config excluded — internal AI system configuration

const HOSPITAL_COLS =
  'id, provider_id, hospital_name, city, address, gps_latitude, gps_longitude, total_beds, emergency_department_available, icu_beds_count, surgery_rooms_count, equipment_metadata, is_active, created_at, updated_at';

const CLINIC_COLS =
  'id, provider_id, clinic_name, specialty_focus, city, address, gps_latitude, gps_longitude, operating_hours, is_active, created_at, updated_at';

const DOCTOR_COLS =
  'id, user_id, provider_id, hospital_id, clinic_id, full_name, license_number, specialty, languages_spoken, years_experience, availability_schedule, consultation_fee, currency, verification_status, is_active, created_at, updated_at';

const DEPARTMENT_COLS =
  'id, hospital_id, department_name, head_doctor_id, department_capacity, created_at';

// ── Row types (snake_case) ─────────────────────────────────────────────────

type ProviderRow = {
  id: string; organization_id: string | null; provider_name: string; provider_type: string;
  country: string; currency: string; licensing_details: Record<string, unknown>;
  verification_status: string; is_active: boolean; created_at: string; updated_at: string;
};

type HospitalRow = {
  id: string; provider_id: string; hospital_name: string; city: string; address: string;
  gps_latitude: number; gps_longitude: number; total_beds: number;
  emergency_department_available: boolean; icu_beds_count: number; surgery_rooms_count: number;
  equipment_metadata: Record<string, unknown>[]; is_active: boolean;
  created_at: string; updated_at: string;
};

type ClinicRow = {
  id: string; provider_id: string; clinic_name: string; specialty_focus: string;
  city: string; address: string; gps_latitude: number; gps_longitude: number;
  operating_hours: Record<string, unknown>; is_active: boolean;
  created_at: string; updated_at: string;
};

type DoctorRow = {
  id: string; user_id: string; provider_id: string | null; hospital_id: string | null;
  clinic_id: string | null; full_name: string; license_number: string; specialty: string;
  languages_spoken: string[]; years_experience: number; availability_schedule: Record<string, unknown>;
  consultation_fee: number; currency: string; verification_status: string;
  is_active: boolean; created_at: string; updated_at: string;
};

type DepartmentRow = {
  id: string; hospital_id: string; department_name: string;
  head_doctor_id: string | null; department_capacity: number; created_at: string;
};

// ── Part 2 column constants ────────────────────────────────────────────────

const PATIENT_COLS =
  'id, user_id, blood_type, allergies, chronic_conditions, emergency_contacts, consent_settings, created_at, updated_at';

const APPOINTMENT_COLS =
  'id, patient_id, doctor_id, hospital_id, clinic_id, appointment_type, scheduled_time, appointment_status, consultation_notes, fee_charged, currency, created_at, updated_at';

const STAFF_COLS =
  'id, hospital_id, clinic_id, user_id, full_name, staff_role, shift_schedule, is_active, created_at';

// ── Part 2 row types ───────────────────────────────────────────────────────

type PatientRow = {
  id: string; user_id: string; blood_type: string; allergies: string[];
  chronic_conditions: string[]; emergency_contacts: Record<string, unknown>[];
  consent_settings: Record<string, unknown>; created_at: string; updated_at: string;
};

type AppointmentRow = {
  id: string; patient_id: string; doctor_id: string; hospital_id: string | null;
  clinic_id: string | null; appointment_type: string; scheduled_time: string;
  appointment_status: string; consultation_notes: string | null; fee_charged: number;
  currency: string; created_at: string; updated_at: string;
};

type StaffRow = {
  id: string; hospital_id: string | null; clinic_id: string | null; user_id: string;
  full_name: string; staff_role: string; shift_schedule: Record<string, unknown>;
  is_active: boolean; created_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapProvider(r: ProviderRow): HealthcareProvider {
  return {
    id: r.id, organizationId: r.organization_id, providerName: r.provider_name,
    providerType: r.provider_type as ProviderType, country: r.country, currency: r.currency,
    licensingDetails: r.licensing_details,
    verificationStatus: r.verification_status as HealthcareVerificationStatus,
    isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapHospital(r: HospitalRow): Hospital {
  return {
    id: r.id, providerId: r.provider_id, hospitalName: r.hospital_name, city: r.city,
    address: r.address, gpsLatitude: r.gps_latitude, gpsLongitude: r.gps_longitude,
    totalBeds: r.total_beds, emergencyDepartmentAvailable: r.emergency_department_available,
    icuBedsCount: r.icu_beds_count, surgeryRoomsCount: r.surgery_rooms_count,
    equipmentMetadata: r.equipment_metadata, isActive: r.is_active,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapClinic(r: ClinicRow): Clinic {
  return {
    id: r.id, providerId: r.provider_id, clinicName: r.clinic_name,
    specialtyFocus: r.specialty_focus as SpecialtyFocus, city: r.city, address: r.address,
    gpsLatitude: r.gps_latitude, gpsLongitude: r.gps_longitude,
    operatingHours: r.operating_hours, isActive: r.is_active,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapDoctor(r: DoctorRow): Doctor {
  return {
    id: r.id, userId: r.user_id, providerId: r.provider_id, hospitalId: r.hospital_id,
    clinicId: r.clinic_id, fullName: r.full_name, licenseNumber: r.license_number,
    specialty: r.specialty, languagesSpoken: r.languages_spoken,
    yearsExperience: r.years_experience, availabilitySchedule: r.availability_schedule,
    consultationFee: r.consultation_fee, currency: r.currency,
    verificationStatus: r.verification_status as DoctorVerificationStatus,
    isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapDepartment(r: DepartmentRow): HospitalDepartment {
  return {
    id: r.id, hospitalId: r.hospital_id, departmentName: r.department_name,
    headDoctorId: r.head_doctor_id, departmentCapacity: r.department_capacity,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Healthcare Providers
// ================================================================

export async function getHealthcareProviders(
  country: string,
  options: {
    providerType?: ProviderType;
    verificationStatus?: HealthcareVerificationStatus;
  } = {}
): Promise<HealthcareProvider[]> {
  let q = supabase
    .from('healthcare_providers')
    .select(PROVIDER_COLS)
    .eq('country', country)
    .eq('is_active', true);

  if (options.providerType) q = q.eq('provider_type', options.providerType);
  if (options.verificationStatus) q = q.eq('verification_status', options.verificationStatus);

  const { data, error } = await q.order('provider_name', { ascending: true });
  if (error) throw error;
  return (data as ProviderRow[]).map(mapProvider);
}

export async function getHealthcareProvider(id: string): Promise<HealthcareProvider | null> {
  const { data, error } = await supabase
    .from('healthcare_providers')
    .select(PROVIDER_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProvider(data as ProviderRow) : null;
}

export async function getProvidersByType(
  providerType: ProviderType,
  country: string
): Promise<HealthcareProvider[]> {
  const { data, error } = await supabase
    .from('healthcare_providers')
    .select(PROVIDER_COLS)
    .eq('provider_type', providerType)
    .eq('country', country)
    .eq('is_active', true)
    .order('provider_name', { ascending: true });
  if (error) throw error;
  return (data as ProviderRow[]).map(mapProvider);
}

export async function getOrganizationProviders(
  organizationId: string
): Promise<HealthcareProvider[]> {
  const { data, error } = await supabase
    .from('healthcare_providers')
    .select(PROVIDER_COLS)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('provider_name', { ascending: true });
  if (error) throw error;
  return (data as ProviderRow[]).map(mapProvider);
}

// ================================================================
// === Hospitals
// ================================================================

export async function getHospitals(
  city: string,
  options: { emergencyOnly?: boolean; minBeds?: number } = {}
): Promise<Hospital[]> {
  let q = supabase
    .from('hospitals')
    .select(HOSPITAL_COLS)
    .ilike('city', `%${city}%`)
    .eq('is_active', true);

  if (options.emergencyOnly) q = q.eq('emergency_department_available', true);
  if (options.minBeds !== undefined) q = q.gte('total_beds', options.minBeds);

  const { data, error } = await q.order('hospital_name', { ascending: true });
  if (error) throw error;
  return (data as HospitalRow[]).map(mapHospital);
}

export async function getHospital(id: string): Promise<Hospital | null> {
  const { data, error } = await supabase
    .from('hospitals')
    .select(HOSPITAL_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapHospital(data as HospitalRow) : null;
}

export async function getProviderHospitals(providerId: string): Promise<Hospital[]> {
  const { data, error } = await supabase
    .from('hospitals')
    .select(HOSPITAL_COLS)
    .eq('provider_id', providerId)
    .eq('is_active', true)
    .order('hospital_name', { ascending: true });
  if (error) throw error;
  return (data as HospitalRow[]).map(mapHospital);
}

export async function getHospitalsWithEmergency(city: string): Promise<Hospital[]> {
  const { data, error } = await supabase
    .from('hospitals')
    .select(HOSPITAL_COLS)
    .ilike('city', `%${city}%`)
    .eq('emergency_department_available', true)
    .eq('is_active', true)
    .order('hospital_name', { ascending: true });
  if (error) throw error;
  return (data as HospitalRow[]).map(mapHospital);
}

// ================================================================
// === Clinics
// ================================================================

export async function getClinics(
  city: string,
  options: { specialty?: SpecialtyFocus } = {}
): Promise<Clinic[]> {
  let q = supabase
    .from('clinics')
    .select(CLINIC_COLS)
    .ilike('city', `%${city}%`)
    .eq('is_active', true);

  if (options.specialty) q = q.eq('specialty_focus', options.specialty);

  const { data, error } = await q.order('clinic_name', { ascending: true });
  if (error) throw error;
  return (data as ClinicRow[]).map(mapClinic);
}

export async function getClinic(id: string): Promise<Clinic | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select(CLINIC_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapClinic(data as ClinicRow) : null;
}

export async function getProviderClinics(providerId: string): Promise<Clinic[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select(CLINIC_COLS)
    .eq('provider_id', providerId)
    .eq('is_active', true)
    .order('clinic_name', { ascending: true });
  if (error) throw error;
  return (data as ClinicRow[]).map(mapClinic);
}

export async function getClinicsBySpecialty(
  specialty: SpecialtyFocus,
  city?: string
): Promise<Clinic[]> {
  let q = supabase
    .from('clinics')
    .select(CLINIC_COLS)
    .eq('specialty_focus', specialty)
    .eq('is_active', true);

  if (city) q = q.ilike('city', `%${city}%`);

  const { data, error } = await q.order('clinic_name', { ascending: true });
  if (error) throw error;
  return (data as ClinicRow[]).map(mapClinic);
}

// ================================================================
// === Doctors
// ================================================================

export async function getDoctors(
  options: {
    specialty?: string;
    verificationStatus?: DoctorVerificationStatus;
    language?: string;
    maxFee?: number;
  } = {}
): Promise<Doctor[]> {
  let q = supabase
    .from('doctors')
    .select(DOCTOR_COLS)
    .eq('is_active', true);

  if (options.specialty) q = q.ilike('specialty', `%${options.specialty}%`);
  if (options.verificationStatus) q = q.eq('verification_status', options.verificationStatus);
  if (options.language) q = q.contains('languages_spoken', [options.language]);
  if (options.maxFee !== undefined) q = q.lte('consultation_fee', options.maxFee);

  const { data, error } = await q.order('full_name', { ascending: true });
  if (error) throw error;
  return (data as DoctorRow[]).map(mapDoctor);
}

export async function getDoctor(id: string): Promise<Doctor | null> {
  const { data, error } = await supabase
    .from('doctors')
    .select(DOCTOR_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDoctor(data as DoctorRow) : null;
}

export async function getDoctorsBySpecialty(
  specialty: string,
  options: { verificationStatus?: DoctorVerificationStatus } = {}
): Promise<Doctor[]> {
  let q = supabase
    .from('doctors')
    .select(DOCTOR_COLS)
    .ilike('specialty', `%${specialty}%`)
    .eq('is_active', true);

  if (options.verificationStatus) q = q.eq('verification_status', options.verificationStatus);

  const { data, error } = await q
    .order('years_experience', { ascending: false });
  if (error) throw error;
  return (data as DoctorRow[]).map(mapDoctor);
}

export async function getHospitalDoctors(
  hospitalId: string,
  options: { specialty?: string } = {}
): Promise<Doctor[]> {
  let q = supabase
    .from('doctors')
    .select(DOCTOR_COLS)
    .eq('hospital_id', hospitalId)
    .eq('is_active', true);

  if (options.specialty) q = q.ilike('specialty', `%${options.specialty}%`);

  const { data, error } = await q.order('full_name', { ascending: true });
  if (error) throw error;
  return (data as DoctorRow[]).map(mapDoctor);
}

export async function getClinicDoctors(clinicId: string): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select(DOCTOR_COLS)
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .order('full_name', { ascending: true });
  if (error) throw error;
  return (data as DoctorRow[]).map(mapDoctor);
}

// ================================================================
// === Hospital Departments
// ================================================================

export async function getHospitalDepartments(hospitalId: string): Promise<HospitalDepartment[]> {
  const { data, error } = await supabase
    .from('hospital_departments')
    .select(DEPARTMENT_COLS)
    .eq('hospital_id', hospitalId)
    .order('department_name', { ascending: true });
  if (error) throw error;
  return (data as DepartmentRow[]).map(mapDepartment);
}

export async function getDepartment(id: string): Promise<HospitalDepartment | null> {
  const { data, error } = await supabase
    .from('hospital_departments')
    .select(DEPARTMENT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDepartment(data as DepartmentRow) : null;
}

// ── Part 2 mappers ────────────────────────────────────────────────────────

function mapPatient(r: PatientRow): Patient {
  return {
    id: r.id, userId: r.user_id, bloodType: r.blood_type as BloodType,
    allergies: r.allergies, chronicConditions: r.chronic_conditions,
    emergencyContacts: r.emergency_contacts, consentSettings: r.consent_settings,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapAppointment(r: AppointmentRow): Appointment {
  return {
    id: r.id, patientId: r.patient_id, doctorId: r.doctor_id,
    hospitalId: r.hospital_id, clinicId: r.clinic_id,
    appointmentType: r.appointment_type as AppointmentType,
    scheduledTime: r.scheduled_time, appointmentStatus: r.appointment_status as AppointmentStatus,
    consultationNotes: r.consultation_notes, feeCharged: r.fee_charged, currency: r.currency,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapStaff(r: StaffRow): HealthcareStaff {
  return {
    id: r.id, hospitalId: r.hospital_id, clinicId: r.clinic_id, userId: r.user_id,
    fullName: r.full_name, staffRole: r.staff_role as StaffRole,
    shiftSchedule: r.shift_schedule, isActive: r.is_active, createdAt: r.created_at,
  };
}

// ================================================================
// === Patients (READ — own record only via RLS;
// medical data updates go through backend for integrity validation)
// ================================================================

export async function getMyPatientProfile(): Promise<Patient | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('patients')
    .select(PATIENT_COLS)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPatient(data as PatientRow) : null;
}

export async function getPatient(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select(PATIENT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPatient(data as PatientRow) : null;
}

// Consent settings are the patient's own preference — allowed as a user write
export async function updateConsentSettings(
  patientId: string,
  settings: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({ consent_settings: settings, updated_at: new Date().toISOString() })
    .eq('id', patientId);
  if (error) throw error;
}

// ================================================================
// === Appointments
// ================================================================

export async function getMyAppointments(
  options: {
    status?: AppointmentStatus;
    type?: AppointmentType;
    from?: string;
    limit?: number;
    cursor?: string;
  } = {}
): Promise<Appointment[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Requires patient_id from own profile — RLS enforces ownership
  let q = supabase
    .from('appointments')
    .select(APPOINTMENT_COLS);

  if (options.status) q = q.eq('appointment_status', options.status);
  if (options.type) q = q.eq('appointment_type', options.type);
  if (options.from) q = q.gte('scheduled_time', options.from);
  if (options.cursor) q = q.lt('scheduled_time', options.cursor);

  const { data, error } = await q
    .order('scheduled_time', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as AppointmentRow[]).map(mapAppointment);
}

export async function getDoctorAppointments(
  doctorId: string,
  options: { status?: AppointmentStatus; from?: string; to?: string } = {}
): Promise<Appointment[]> {
  let q = supabase
    .from('appointments')
    .select(APPOINTMENT_COLS)
    .eq('doctor_id', doctorId);

  if (options.status) q = q.eq('appointment_status', options.status);
  if (options.from) q = q.gte('scheduled_time', options.from);
  if (options.to) q = q.lte('scheduled_time', options.to);

  const { data, error } = await q.order('scheduled_time', { ascending: true });
  if (error) throw error;
  return (data as AppointmentRow[]).map(mapAppointment);
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAppointment(data as AppointmentRow) : null;
}

// Non-financial user write — patient cancels their own appointment (RLS-protected)
export async function cancelAppointment(id: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ appointment_status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('appointment_status', 'confirmed'); // only cancel confirmed appointments
  if (error) throw error;
}

// ================================================================
// === Healthcare Staff (READ ONLY)
// ================================================================

export async function getHospitalHealthcareStaff(
  hospitalId: string,
  options: { role?: StaffRole; activeOnly?: boolean } = {}
): Promise<HealthcareStaff[]> {
  let q = supabase
    .from('healthcare_staff')
    .select(STAFF_COLS)
    .eq('hospital_id', hospitalId);

  if (options.role) q = q.eq('staff_role', options.role);
  if (options.activeOnly !== false) q = q.eq('is_active', true);

  const { data, error } = await q.order('full_name', { ascending: true });
  if (error) throw error;
  return (data as StaffRow[]).map(mapStaff);
}

export async function getClinicHealthcareStaff(
  clinicId: string,
  options: { role?: StaffRole } = {}
): Promise<HealthcareStaff[]> {
  let q = supabase
    .from('healthcare_staff')
    .select(STAFF_COLS)
    .eq('clinic_id', clinicId)
    .eq('is_active', true);

  if (options.role) q = q.eq('staff_role', options.role);

  const { data, error } = await q.order('full_name', { ascending: true });
  if (error) throw error;
  return (data as StaffRow[]).map(mapStaff);
}

export async function getStaffMember(id: string): Promise<HealthcareStaff | null> {
  const { data, error } = await supabase
    .from('healthcare_staff')
    .select(STAFF_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapStaff(data as StaffRow) : null;
}

// ================================================================
// === Part 3: Records, Labs, Pharmacy & Insurance
// ================================================================

// ── Column constants ───────────────────────────────────────────────────────

const MEDICAL_RECORD_COLS =
  'id, patient_id, doctor_id, diagnosis, lab_results_json, imaging_attachments, doctor_notes, is_encrypted, created_at, updated_at';
// access_permissions_json excluded — internal access control configuration

const PRESCRIPTION_COLS =
  'id, medical_record_id, patient_id, doctor_id, medicine_name, dosage, frequency, duration_days, pharmacy_fulfillment_status, created_at';

const LABORATORY_COLS =
  'id, provider_id, lab_name, city, address, supported_tests, is_active, created_at';

const LAB_RESULT_COLS =
  'id, laboratory_id, patient_id, test_name, test_parameters_json, findings_summary, certified_by_doctor_id, tested_at';

const PHARMACY_COLS =
  'id, provider_id, pharmacy_name, city, address, inventory_medications_json, is_open_24_7, is_active, created_at';

const INSURANCE_PLAN_COLS =
  'id, insurance_company_name, plan_name, coverage_percentage, country, is_active, created_at';

const INSURANCE_CLAIM_COLS =
  'id, insurance_id, patient_id, medical_record_id, claim_amount, approved_amount, currency, claim_status, created_at';

const MEDICAL_BILL_COLS =
  'id, patient_id, provider_id, total_bill_amount, insurance_covered_amount, patient_out_of_pocket, currency, payment_status, created_at';

// ── Row types ──────────────────────────────────────────────────────────────

type MedicalRecordRow = {
  id: string; patient_id: string; doctor_id: string; diagnosis: string;
  lab_results_json: Record<string, unknown>; imaging_attachments: string[];
  doctor_notes: string; is_encrypted: boolean; created_at: string; updated_at: string;
};

type PrescriptionRow = {
  id: string; medical_record_id: string; patient_id: string; doctor_id: string;
  medicine_name: string; dosage: string; frequency: string; duration_days: number;
  pharmacy_fulfillment_status: string; created_at: string;
};

type LaboratoryRow = {
  id: string; provider_id: string; lab_name: string; city: string; address: string;
  supported_tests: Record<string, unknown>[]; is_active: boolean; created_at: string;
};

type LabResultRow = {
  id: string; laboratory_id: string; patient_id: string; test_name: string;
  test_parameters_json: Record<string, unknown>; findings_summary: string;
  certified_by_doctor_id: string | null; tested_at: string;
};

type PharmacyRow = {
  id: string; provider_id: string; pharmacy_name: string; city: string; address: string;
  inventory_medications_json: Record<string, unknown>[]; is_open_24_7: boolean;
  is_active: boolean; created_at: string;
};

type InsurancePlanRow = {
  id: string; insurance_company_name: string; plan_name: string;
  coverage_percentage: number; country: string; is_active: boolean; created_at: string;
};

type InsuranceClaimRow = {
  id: string; insurance_id: string; patient_id: string; medical_record_id: string | null;
  claim_amount: number; approved_amount: number; currency: string;
  claim_status: string; created_at: string;
};

type MedicalBillRow = {
  id: string; patient_id: string; provider_id: string | null; total_bill_amount: number;
  insurance_covered_amount: number; patient_out_of_pocket: number; currency: string;
  payment_status: string; created_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapMedicalRecord(r: MedicalRecordRow): MedicalRecord {
  return {
    id: r.id, patientId: r.patient_id, doctorId: r.doctor_id, diagnosis: r.diagnosis,
    labResultsJson: r.lab_results_json, imagingAttachments: r.imaging_attachments,
    doctorNotes: r.doctor_notes, isEncrypted: r.is_encrypted,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapPrescription(r: PrescriptionRow): Prescription {
  return {
    id: r.id, medicalRecordId: r.medical_record_id, patientId: r.patient_id,
    doctorId: r.doctor_id, medicineName: r.medicine_name, dosage: r.dosage,
    frequency: r.frequency, durationDays: r.duration_days,
    pharmacyFulfillmentStatus: r.pharmacy_fulfillment_status as PharmacyFulfillmentStatus,
    createdAt: r.created_at,
  };
}

function mapLaboratory(r: LaboratoryRow): Laboratory {
  return {
    id: r.id, providerId: r.provider_id, labName: r.lab_name, city: r.city,
    address: r.address, supportedTests: r.supported_tests,
    isActive: r.is_active, createdAt: r.created_at,
  };
}

function mapLabResult(r: LabResultRow): LabResult {
  return {
    id: r.id, laboratoryId: r.laboratory_id, patientId: r.patient_id,
    testName: r.test_name, testParametersJson: r.test_parameters_json,
    findingsSummary: r.findings_summary, certifiedByDoctorId: r.certified_by_doctor_id,
    testedAt: r.tested_at,
  };
}

function mapPharmacy(r: PharmacyRow): Pharmacy {
  return {
    id: r.id, providerId: r.provider_id, pharmacyName: r.pharmacy_name, city: r.city,
    address: r.address, inventoryMedicationsJson: r.inventory_medications_json,
    isOpen247: r.is_open_24_7, isActive: r.is_active, createdAt: r.created_at,
  };
}

function mapInsurancePlan(r: InsurancePlanRow): InsurancePlan {
  return {
    id: r.id, insuranceCompanyName: r.insurance_company_name, planName: r.plan_name,
    coveragePercentage: r.coverage_percentage, country: r.country,
    isActive: r.is_active, createdAt: r.created_at,
  };
}

function mapInsuranceClaim(r: InsuranceClaimRow): InsuranceClaim {
  return {
    id: r.id, insuranceId: r.insurance_id, patientId: r.patient_id,
    medicalRecordId: r.medical_record_id, claimAmount: r.claim_amount,
    approvedAmount: r.approved_amount, currency: r.currency,
    claimStatus: r.claim_status as InsuranceClaimStatus, createdAt: r.created_at,
  };
}

function mapMedicalBill(r: MedicalBillRow): MedicalBill {
  return {
    id: r.id, patientId: r.patient_id, providerId: r.provider_id,
    totalBillAmount: r.total_bill_amount, insuranceCoveredAmount: r.insurance_covered_amount,
    patientOutOfPocket: r.patient_out_of_pocket, currency: r.currency,
    paymentStatus: r.payment_status as BillingPaymentStatus, createdAt: r.created_at,
  };
}

// ================================================================
// === Medical Records (READ ONLY — records written by doctors via
// backend; patients access their own records via RLS)
// ================================================================

export async function getMyMedicalRecords(
  options: { limit?: number; cursor?: string } = {}
): Promise<MedicalRecord[]> {
  let q = supabase
    .from('medical_records')
    .select(MEDICAL_RECORD_COLS);

  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as MedicalRecordRow[]).map(mapMedicalRecord);
}

export async function getMedicalRecord(id: string): Promise<MedicalRecord | null> {
  const { data, error } = await supabase
    .from('medical_records')
    .select(MEDICAL_RECORD_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMedicalRecord(data as MedicalRecordRow) : null;
}

// ================================================================
// === Prescriptions (READ ONLY — written by doctors via backend)
// ================================================================

export async function getMyPrescriptions(
  options: { status?: PharmacyFulfillmentStatus; limit?: number; cursor?: string } = {}
): Promise<Prescription[]> {
  let q = supabase
    .from('prescriptions')
    .select(PRESCRIPTION_COLS);

  if (options.status) q = q.eq('pharmacy_fulfillment_status', options.status);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as PrescriptionRow[]).map(mapPrescription);
}

export async function getPrescription(id: string): Promise<Prescription | null> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select(PRESCRIPTION_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPrescription(data as PrescriptionRow) : null;
}

export async function getRecordPrescriptions(
  medicalRecordId: string
): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select(PRESCRIPTION_COLS)
    .eq('medical_record_id', medicalRecordId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as PrescriptionRow[]).map(mapPrescription);
}

// ================================================================
// === Laboratories
// ================================================================

export async function getLaboratories(
  city: string,
  options: { activeOnly?: boolean } = {}
): Promise<Laboratory[]> {
  let q = supabase
    .from('laboratories')
    .select(LABORATORY_COLS)
    .ilike('city', `%${city}%`);

  if (options.activeOnly !== false) q = q.eq('is_active', true);

  const { data, error } = await q.order('lab_name', { ascending: true });
  if (error) throw error;
  return (data as LaboratoryRow[]).map(mapLaboratory);
}

export async function getLaboratory(id: string): Promise<Laboratory | null> {
  const { data, error } = await supabase
    .from('laboratories')
    .select(LABORATORY_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapLaboratory(data as LaboratoryRow) : null;
}

export async function getProviderLabs(providerId: string): Promise<Laboratory[]> {
  const { data, error } = await supabase
    .from('laboratories')
    .select(LABORATORY_COLS)
    .eq('provider_id', providerId)
    .eq('is_active', true)
    .order('lab_name', { ascending: true });
  if (error) throw error;
  return (data as LaboratoryRow[]).map(mapLaboratory);
}

// ================================================================
// === Lab Results (READ ONLY — patient's own results via RLS)
// ================================================================

export async function getMyLabResults(
  options: { laboratoryId?: string; from?: string; limit?: number } = {}
): Promise<LabResult[]> {
  let q = supabase
    .from('lab_results')
    .select(LAB_RESULT_COLS);

  if (options.laboratoryId) q = q.eq('laboratory_id', options.laboratoryId);
  if (options.from) q = q.gte('tested_at', options.from);

  const { data, error } = await q
    .order('tested_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as LabResultRow[]).map(mapLabResult);
}

export async function getLabResult(id: string): Promise<LabResult | null> {
  const { data, error } = await supabase
    .from('lab_results')
    .select(LAB_RESULT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapLabResult(data as LabResultRow) : null;
}

// ================================================================
// === Pharmacies
// ================================================================

export async function getPharmacies(
  city: string,
  options: { open247Only?: boolean } = {}
): Promise<Pharmacy[]> {
  let q = supabase
    .from('pharmacies')
    .select(PHARMACY_COLS)
    .ilike('city', `%${city}%`)
    .eq('is_active', true);

  if (options.open247Only) q = q.eq('is_open_24_7', true);

  const { data, error } = await q.order('pharmacy_name', { ascending: true });
  if (error) throw error;
  return (data as PharmacyRow[]).map(mapPharmacy);
}

export async function getPharmacy(id: string): Promise<Pharmacy | null> {
  const { data, error } = await supabase
    .from('pharmacies')
    .select(PHARMACY_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPharmacy(data as PharmacyRow) : null;
}

export async function get247Pharmacies(city: string): Promise<Pharmacy[]> {
  const { data, error } = await supabase
    .from('pharmacies')
    .select(PHARMACY_COLS)
    .ilike('city', `%${city}%`)
    .eq('is_open_24_7', true)
    .eq('is_active', true)
    .order('pharmacy_name', { ascending: true });
  if (error) throw error;
  return (data as PharmacyRow[]).map(mapPharmacy);
}

// ================================================================
// === Insurance Plans
// ================================================================

export async function getInsurancePlans(country: string): Promise<InsurancePlan[]> {
  const { data, error } = await supabase
    .from('insurance')
    .select(INSURANCE_PLAN_COLS)
    .eq('country', country)
    .eq('is_active', true)
    .order('insurance_company_name', { ascending: true });
  if (error) throw error;
  return (data as InsurancePlanRow[]).map(mapInsurancePlan);
}

export async function getInsurancePlan(id: string): Promise<InsurancePlan | null> {
  const { data, error } = await supabase
    .from('insurance')
    .select(INSURANCE_PLAN_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapInsurancePlan(data as InsurancePlanRow) : null;
}

// ================================================================
// === Insurance Claims (READ ONLY — submission goes through backend
// for financial processing and document validation)
// ================================================================

export async function getMyInsuranceClaims(
  options: { status?: InsuranceClaimStatus; limit?: number; cursor?: string } = {}
): Promise<InsuranceClaim[]> {
  let q = supabase
    .from('insurance_claims')
    .select(INSURANCE_CLAIM_COLS);

  if (options.status) q = q.eq('claim_status', options.status);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as InsuranceClaimRow[]).map(mapInsuranceClaim);
}

export async function getInsuranceClaim(id: string): Promise<InsuranceClaim | null> {
  const { data, error } = await supabase
    .from('insurance_claims')
    .select(INSURANCE_CLAIM_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapInsuranceClaim(data as InsuranceClaimRow) : null;
}

// ================================================================
// === Medical Billing (READ ONLY — payment processing is a backend
// financial operation; patients track their own bills via RLS)
// ================================================================

export async function getMyBills(
  options: { status?: BillingPaymentStatus; limit?: number; cursor?: string } = {}
): Promise<MedicalBill[]> {
  let q = supabase
    .from('medical_billing')
    .select(MEDICAL_BILL_COLS);

  if (options.status) q = q.eq('payment_status', options.status);
  if (options.cursor) q = q.lt('created_at', options.cursor);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as MedicalBillRow[]).map(mapMedicalBill);
}

export async function getMedicalBill(id: string): Promise<MedicalBill | null> {
  const { data, error } = await supabase
    .from('medical_billing')
    .select(MEDICAL_BILL_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMedicalBill(data as MedicalBillRow) : null;
}

// ================================================================
// === Part 3.2: Records & Pharmacy Expansion
// ================================================================

// ── Column constants ───────────────────────────────────────────────────────

const DICOM_COLS =
  'id, medical_record_id, patient_id, modality_type, dicom_file_url, ai_pathology_findings_json, anomaly_detected, created_at';
// encryption_quantum_hash excluded — NEVER (cryptographic reference)

const DISPENSING_COLS =
  'id, pharmacy_id, prescription_id, dispensing_robot_status, drug_interaction_warning_level, dispensed_at';

const FHIR_COLS =
  'id, patient_id, external_system_destination, sync_status, transmitted_at';
// fhir_resource_payload_json excluded — raw internal FHIR interchange format

const SMART_CONTRACT_COLS =
  'id, insurance_claim_id, payout_executed, executed_at';
// smart_contract_hash excluded — NEVER (cryptographic reference)
// settlement_speed_milliseconds excluded — internal technical metric
// blockchain_network_node excluded — internal infrastructure detail

const CONSENT_COLS =
  'id, patient_id, authorized_doctor_id, access_scope_json, is_revoked, expires_at, created_at';
// biometric_signature_hash excluded — NEVER (biometric data hash)

// ── Row types ──────────────────────────────────────────────────────────────

type DicomRow = {
  id: string; medical_record_id: string; patient_id: string; modality_type: string;
  dicom_file_url: string; ai_pathology_findings_json: Record<string, unknown>;
  anomaly_detected: boolean; created_at: string;
};

type DispensingRow = {
  id: string; pharmacy_id: string; prescription_id: string;
  dispensing_robot_status: string; drug_interaction_warning_level: string; dispensed_at: string;
};

type FhirRow = {
  id: string; patient_id: string; external_system_destination: string;
  sync_status: string; transmitted_at: string;
};

type SmartContractRow = {
  id: string; insurance_claim_id: string; payout_executed: boolean; executed_at: string;
};

type ConsentRow = {
  id: string; patient_id: string; authorized_doctor_id: string | null;
  access_scope_json: Record<string, unknown>; is_revoked: boolean;
  expires_at: string; created_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapDicom(r: DicomRow): MedicalImagingRecord {
  return {
    id: r.id, medicalRecordId: r.medical_record_id, patientId: r.patient_id,
    modalityType: r.modality_type as ModalityType, dicomFileUrl: r.dicom_file_url,
    aiPathologyFindingsJson: r.ai_pathology_findings_json,
    anomalyDetected: r.anomaly_detected, createdAt: r.created_at,
  };
}

function mapDispensing(r: DispensingRow): PharmacyDispensingUnit {
  return {
    id: r.id, pharmacyId: r.pharmacy_id, prescriptionId: r.prescription_id,
    dispensingRobotStatus: r.dispensing_robot_status as DispensingStatus,
    drugInteractionWarningLevel: r.drug_interaction_warning_level as DrugInteractionLevel,
    dispensedAt: r.dispensed_at,
  };
}

function mapFhir(r: FhirRow): FhirInteroperabilityRecord {
  return {
    id: r.id, patientId: r.patient_id,
    externalSystemDestination: r.external_system_destination,
    syncStatus: r.sync_status as import('../../types/healthcare').FhirSyncStatus,
    transmittedAt: r.transmitted_at,
  };
}

function mapSmartContract(r: SmartContractRow): InsuranceSmartContractSettlement {
  return {
    id: r.id, insuranceClaimId: r.insurance_claim_id,
    payoutExecuted: r.payout_executed, executedAt: r.executed_at,
  };
}

function mapConsent(r: ConsentRow): PatientConsentEntry {
  return {
    id: r.id, patientId: r.patient_id, authorizedDoctorId: r.authorized_doctor_id,
    accessScopeJson: r.access_scope_json, isRevoked: r.is_revoked,
    expiresAt: r.expires_at, createdAt: r.created_at,
  };
}

// ================================================================
// === Medical Imaging DICOM Vault (READ ONLY — images written by
// radiology systems via backend; patients access own records via RLS)
// ================================================================

export async function getMyImagingRecords(
  options: { modality?: ModalityType; anomalyOnly?: boolean } = {}
): Promise<MedicalImagingRecord[]> {
  let q = supabase
    .from('medical_imaging_dicom_vault')
    .select(DICOM_COLS);

  if (options.modality) q = q.eq('modality_type', options.modality);
  if (options.anomalyOnly) q = q.eq('anomaly_detected', true);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DicomRow[]).map(mapDicom);
}

export async function getImagingRecord(id: string): Promise<MedicalImagingRecord | null> {
  const { data, error } = await supabase
    .from('medical_imaging_dicom_vault')
    .select(DICOM_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDicom(data as DicomRow) : null;
}

export async function getMedicalRecordImaging(
  medicalRecordId: string
): Promise<MedicalImagingRecord[]> {
  const { data, error } = await supabase
    .from('medical_imaging_dicom_vault')
    .select(DICOM_COLS)
    .eq('medical_record_id', medicalRecordId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as DicomRow[]).map(mapDicom);
}

// ================================================================
// === Pharmacy Autonomous Dispensing Units
// ================================================================

export async function getPrescriptionDispensingStatus(
  prescriptionId: string
): Promise<PharmacyDispensingUnit | null> {
  const { data, error } = await supabase
    .from('pharmacy_autonomous_dispensing_units')
    .select(DISPENSING_COLS)
    .eq('prescription_id', prescriptionId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDispensing(data as DispensingRow) : null;
}

export async function getPharmacyDispensingQueue(
  pharmacyId: string
): Promise<PharmacyDispensingUnit[]> {
  const { data, error } = await supabase
    .from('pharmacy_autonomous_dispensing_units')
    .select(DISPENSING_COLS)
    .eq('pharmacy_id', pharmacyId)
    .order('dispensed_at', { ascending: true });
  if (error) throw error;
  return (data as DispensingRow[]).map(mapDispensing);
}

// ================================================================
// === FHIR Interoperability Hub (READ ONLY — syncs initiated by
// backend data exchange pipeline; patients see where data was shared)
// ================================================================

export async function getMyFhirExchangeHistory(
  options: { syncStatus?: import('../../types/healthcare').FhirSyncStatus; limit?: number } = {}
): Promise<FhirInteroperabilityRecord[]> {
  let q = supabase
    .from('quantum_fhir_hl7_interoperability_hub')
    .select(FHIR_COLS);

  if (options.syncStatus) q = q.eq('sync_status', options.syncStatus);

  const { data, error } = await q
    .order('transmitted_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as FhirRow[]).map(mapFhir);
}

export async function getFhirRecord(id: string): Promise<FhirInteroperabilityRecord | null> {
  const { data, error } = await supabase
    .from('quantum_fhir_hl7_interoperability_hub')
    .select(FHIR_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapFhir(data as FhirRow) : null;
}

// ================================================================
// === Insurance Smart Contract Settlements (READ ONLY — contract
// execution is fully automated on the backend settlement engine)
// ================================================================

export async function getClaimSettlement(
  insuranceClaimId: string
): Promise<InsuranceSmartContractSettlement | null> {
  const { data, error } = await supabase
    .from('insurance_smart_contracts_settlement')
    .select(SMART_CONTRACT_COLS)
    .eq('insurance_claim_id', insuranceClaimId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSmartContract(data as SmartContractRow) : null;
}

// ================================================================
// === Patient Biometric Consent Ledger
// revokeConsent is an allowed write — patient's GDPR/HIPAA right
// to withdraw data access consent for a specific doctor
// ================================================================

export async function getMyConsentEntries(
  options: { activeOnly?: boolean; doctorId?: string } = {}
): Promise<PatientConsentEntry[]> {
  let q = supabase
    .from('patient_biometric_consent_ledger')
    .select(CONSENT_COLS);

  if (options.activeOnly) q = q.eq('is_revoked', false);
  if (options.doctorId) q = q.eq('authorized_doctor_id', options.doctorId);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ConsentRow[]).map(mapConsent);
}

export async function getConsentEntry(id: string): Promise<PatientConsentEntry | null> {
  const { data, error } = await supabase
    .from('patient_biometric_consent_ledger')
    .select(CONSENT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapConsent(data as ConsentRow) : null;
}

// Patient's GDPR/HIPAA right — allowed write (RLS ensures own records only)
export async function revokeConsent(id: string): Promise<void> {
  const { error } = await supabase
    .from('patient_biometric_consent_ledger')
    .update({ is_revoked: true })
    .eq('id', id)
    .eq('is_revoked', false); // idempotent — only revoke if currently active
  if (error) throw error;
}

// ================================================================
// === Part 1.2: Foundation Expansion
// ================================================================
// quantum_genomic_profiles → ENTIRE TABLE BACKEND ONLY
//   Genomic data is the highest PHI category. encryption_key_reference
//   present. No field is appropriate for direct frontend query.

// ── Column constants ───────────────────────────────────────────────────────

const SURGICAL_UNIT_COLS =
  'id, hospital_id, unit_model_name, operational_status, precision_level_microns, remote_surgeon_linked_id, last_diagnostic_at';

const REPUTATION_COLS =
  'id, doctor_id, total_surgeries_performed, success_rate_percentage, patient_satisfaction_index, status_tier, updated_at';
// ai_peer_review_score excluded — internal AI algorithm output (NEVER)

const TRIAL_COLS =
  'id, sponsor_provider_id, trial_title, medical_condition_target, phase_level, eligibility_criteria_json, slots_available, is_recruiting, created_at';

const SUPPLY_COLS =
  'id, provider_id, item_category, item_name, stock_quantity, storage_temperature_celsius, item_status, updated_at';
// auto_reorder_threshold excluded — internal logistics parameter

// ── Row types ──────────────────────────────────────────────────────────────

type SurgicalUnitRow = {
  id: string; hospital_id: string; unit_model_name: string; operational_status: string;
  precision_level_microns: number; remote_surgeon_linked_id: string | null;
  last_diagnostic_at: string;
};

type ReputationRow = {
  id: string; doctor_id: string; total_surgeries_performed: number;
  success_rate_percentage: number; patient_satisfaction_index: number;
  status_tier: string; updated_at: string;
};

type TrialRow = {
  id: string; sponsor_provider_id: string; trial_title: string;
  medical_condition_target: string; phase_level: string;
  eligibility_criteria_json: Record<string, unknown>; slots_available: number;
  is_recruiting: boolean; created_at: string;
};

type SupplyRow = {
  id: string; provider_id: string; item_category: string; item_name: string;
  stock_quantity: number; storage_temperature_celsius: number;
  item_status: string; updated_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapSurgicalUnit(r: SurgicalUnitRow): HospitalRoboticSurgicalUnit {
  return {
    id: r.id, hospitalId: r.hospital_id, unitModelName: r.unit_model_name,
    operationalStatus: r.operational_status as SurgicalUnitStatus,
    precisionLevelMicrons: r.precision_level_microns,
    remoteSurgeonLinkedId: r.remote_surgeon_linked_id, lastDiagnosticAt: r.last_diagnostic_at,
  };
}

function mapReputation(r: ReputationRow): DoctorNeuralReputation {
  return {
    id: r.id, doctorId: r.doctor_id, totalSurgeriesPerformed: r.total_surgeries_performed,
    successRatePercentage: r.success_rate_percentage,
    patientSatisfactionIndex: r.patient_satisfaction_index,
    statusTier: r.status_tier as DoctorStatusTier, updatedAt: r.updated_at,
  };
}

function mapTrial(r: TrialRow): ClinicalTrial {
  return {
    id: r.id, sponsorProviderId: r.sponsor_provider_id, trialTitle: r.trial_title,
    medicalConditionTarget: r.medical_condition_target, phaseLevel: r.phase_level as PhaseLevel,
    eligibilityCriteriaJson: r.eligibility_criteria_json, slotsAvailable: r.slots_available,
    isRecruiting: r.is_recruiting, createdAt: r.created_at,
  };
}

function mapSupply(r: SupplyRow): ProviderSupplyChainItem {
  return {
    id: r.id, providerId: r.provider_id, itemCategory: r.item_category as SupplyItemCategory,
    itemName: r.item_name, stockQuantity: r.stock_quantity,
    storageTemperatureCelsius: r.storage_temperature_celsius,
    itemStatus: r.item_status as SupplyItemStatus, updatedAt: r.updated_at,
  };
}

// ================================================================
// === Hospital Robotic Surgical Units
// ================================================================

export async function getHospitalSurgicalUnits(
  hospitalId: string,
  options: { status?: SurgicalUnitStatus } = {}
): Promise<HospitalRoboticSurgicalUnit[]> {
  let q = supabase
    .from('hospital_robotic_surgical_units')
    .select(SURGICAL_UNIT_COLS)
    .eq('hospital_id', hospitalId);

  if (options.status) q = q.eq('operational_status', options.status);

  const { data, error } = await q.order('unit_model_name', { ascending: true });
  if (error) throw error;
  return (data as SurgicalUnitRow[]).map(mapSurgicalUnit);
}

export async function getSurgicalUnit(id: string): Promise<HospitalRoboticSurgicalUnit | null> {
  const { data, error } = await supabase
    .from('hospital_robotic_surgical_units')
    .select(SURGICAL_UNIT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSurgicalUnit(data as SurgicalUnitRow) : null;
}

export async function getActiveSurgeries(hospitalId: string): Promise<HospitalRoboticSurgicalUnit[]> {
  const { data, error } = await supabase
    .from('hospital_robotic_surgical_units')
    .select(SURGICAL_UNIT_COLS)
    .eq('hospital_id', hospitalId)
    .eq('operational_status', 'active_surgery')
    .order('last_diagnostic_at', { ascending: false });
  if (error) throw error;
  return (data as SurgicalUnitRow[]).map(mapSurgicalUnit);
}

// ================================================================
// === Doctor Neural Reputation Matrix
// ================================================================

export async function getDoctorReputation(
  doctorId: string
): Promise<DoctorNeuralReputation | null> {
  const { data, error } = await supabase
    .from('doctor_neural_reputation_matrix')
    .select(REPUTATION_COLS)
    .eq('doctor_id', doctorId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapReputation(data as ReputationRow) : null;
}

export async function getTopRatedDoctors(
  options: { statusTier?: DoctorStatusTier; limit?: number } = {}
): Promise<DoctorNeuralReputation[]> {
  let q = supabase
    .from('doctor_neural_reputation_matrix')
    .select(REPUTATION_COLS);

  if (options.statusTier) q = q.eq('status_tier', options.statusTier);

  const { data, error } = await q
    .order('patient_satisfaction_index', { ascending: false })
    .limit(options.limit ?? 20);
  if (error) throw error;
  return (data as ReputationRow[]).map(mapReputation);
}

// ================================================================
// === Clinical Trial Global Registry
// ================================================================

export async function getClinicalTrials(
  options: {
    condition?: string;
    phase?: PhaseLevel;
    recruitingOnly?: boolean;
  } = {}
): Promise<ClinicalTrial[]> {
  let q = supabase
    .from('clinical_trial_global_registry')
    .select(TRIAL_COLS);

  if (options.condition) q = q.ilike('medical_condition_target', `%${options.condition}%`);
  if (options.phase) q = q.eq('phase_level', options.phase);
  if (options.recruitingOnly !== false) q = q.eq('is_recruiting', true);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as TrialRow[]).map(mapTrial);
}

export async function getClinicalTrial(id: string): Promise<ClinicalTrial | null> {
  const { data, error } = await supabase
    .from('clinical_trial_global_registry')
    .select(TRIAL_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTrial(data as TrialRow) : null;
}

export async function getRecruitingTrials(condition?: string): Promise<ClinicalTrial[]> {
  let q = supabase
    .from('clinical_trial_global_registry')
    .select(TRIAL_COLS)
    .eq('is_recruiting', true)
    .gt('slots_available', 0);

  if (condition) q = q.ilike('medical_condition_target', `%${condition}%`);

  const { data, error } = await q
    .order('slots_available', { ascending: false });
  if (error) throw error;
  return (data as TrialRow[]).map(mapTrial);
}

export async function getProviderTrials(sponsorProviderId: string): Promise<ClinicalTrial[]> {
  const { data, error } = await supabase
    .from('clinical_trial_global_registry')
    .select(TRIAL_COLS)
    .eq('sponsor_provider_id', sponsorProviderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as TrialRow[]).map(mapTrial);
}

// ================================================================
// === Provider Quantum Supply Chain
// ================================================================

export async function getProviderSupply(
  providerId: string,
  options: { category?: SupplyItemCategory; status?: SupplyItemStatus } = {}
): Promise<ProviderSupplyChainItem[]> {
  let q = supabase
    .from('provider_quantum_supply_chain')
    .select(SUPPLY_COLS)
    .eq('provider_id', providerId);

  if (options.category) q = q.eq('item_category', options.category);
  if (options.status) q = q.eq('item_status', options.status);

  const { data, error } = await q.order('item_name', { ascending: true });
  if (error) throw error;
  return (data as SupplyRow[]).map(mapSupply);
}

export async function getSupplyByCategory(
  providerId: string,
  category: SupplyItemCategory
): Promise<ProviderSupplyChainItem[]> {
  const { data, error } = await supabase
    .from('provider_quantum_supply_chain')
    .select(SUPPLY_COLS)
    .eq('provider_id', providerId)
    .eq('item_category', category)
    .order('stock_quantity', { ascending: true });
  if (error) throw error;
  return (data as SupplyRow[]).map(mapSupply);
}

export async function getCriticalSupplyItems(
  providerId: string
): Promise<ProviderSupplyChainItem[]> {
  const { data, error } = await supabase
    .from('provider_quantum_supply_chain')
    .select(SUPPLY_COLS)
    .eq('provider_id', providerId)
    .in('item_status', ['low_stock', 'critical_replenishment'])
    .order('stock_quantity', { ascending: true });
  if (error) throw error;
  return (data as SupplyRow[]).map(mapSupply);
}

// ── Part 4: AI, Emergency & Analytics ────────────────────────────────────

// ── Column constants ──────────────────────────────────────────────────────

const AMBULANCE_COLS =
  'id, provider_id, vehicle_license_plate, current_gps_latitude, current_gps_longitude, is_available, created_at';

const EMERGENCY_COLS =
  'id, patient_id, nearest_hospital_id, ambulance_id, incident_location_text, gps_latitude, gps_longitude, emergency_type, distance_to_nearest_hospital_km, response_status, created_at';

const AI_DIAGNOSIS_COLS =
  'id, patient_id, symptoms_payload_json, ai_suggested_diagnoses, reviewed_by_doctor_id, created_at';
// confidence_score excluded — internal AI metric (NEVER)

const AUDIT_HEALTHCARE_COLS =
  'id, user_id, action_performed, target_resource_id, access_granted, logged_at';
// ip_address excluded — PII (NEVER; same pattern as all audit log tables)

const ANALYTICS_HEALTHCARE_COLS =
  'id, metric_category, metrics_payload, recorded_at';
// neural_trend_summary excluded — internal AI-generated trend text

// ── Row types ─────────────────────────────────────────────────────────────

type AmbulanceRow = {
  id: string;
  provider_id: string;
  vehicle_license_plate: string;
  current_gps_latitude: number;
  current_gps_longitude: number;
  is_available: boolean;
  created_at: string;
};

type EmergencyRow = {
  id: string;
  patient_id: string | null;
  nearest_hospital_id: string | null;
  ambulance_id: string | null;
  incident_location_text: string;
  gps_latitude: number;
  gps_longitude: number;
  emergency_type: EmergencyType;
  distance_to_nearest_hospital_km: number;
  response_status: ResponseStatus;
  created_at: string;
};

type DiagnosisRow = {
  id: string;
  patient_id: string;
  symptoms_payload_json: Record<string, unknown>;
  ai_suggested_diagnoses: Record<string, unknown>[];
  reviewed_by_doctor_id: string | null;
  created_at: string;
};

type AuditHealthcareRow = {
  id: string;
  user_id: string;
  action_performed: string;
  target_resource_id: string;
  access_granted: boolean;
  logged_at: string;
};

type AnalyticsHealthcareRow = {
  id: string;
  metric_category: string;
  metrics_payload: Record<string, unknown>;
  recorded_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapAmbulance(r: AmbulanceRow): Ambulance {
  return {
    id: r.id,
    providerId: r.provider_id,
    vehicleLicensePlate: r.vehicle_license_plate,
    currentGpsLatitude: r.current_gps_latitude,
    currentGpsLongitude: r.current_gps_longitude,
    isAvailable: r.is_available,
    createdAt: r.created_at,
  };
}

function mapEmergency(r: EmergencyRow): EmergencyRequest {
  return {
    id: r.id,
    patientId: r.patient_id,
    nearestHospitalId: r.nearest_hospital_id,
    ambulanceId: r.ambulance_id,
    incidentLocationText: r.incident_location_text,
    gpsLatitude: r.gps_latitude,
    gpsLongitude: r.gps_longitude,
    emergencyType: r.emergency_type,
    distanceToNearestHospitalKm: r.distance_to_nearest_hospital_km,
    responseStatus: r.response_status,
    createdAt: r.created_at,
  };
}

function mapDiagnosis(r: DiagnosisRow): AiDiagnosisAssistance {
  return {
    id: r.id,
    patientId: r.patient_id,
    symptomsPayloadJson: r.symptoms_payload_json,
    aiSuggestedDiagnoses: r.ai_suggested_diagnoses,
    reviewedByDoctorId: r.reviewed_by_doctor_id,
    createdAt: r.created_at,
  };
}

function mapAuditHealthcare(r: AuditHealthcareRow): HealthcareAuditLog {
  return {
    id: r.id,
    userId: r.user_id,
    actionPerformed: r.action_performed,
    targetResourceId: r.target_resource_id,
    accessGranted: r.access_granted,
    loggedAt: r.logged_at,
  };
}

function mapAnalyticsHealthcare(r: AnalyticsHealthcareRow): HealthcareAnalyticsSingularity {
  return {
    id: r.id,
    metricCategory: r.metric_category,
    metricsPayload: r.metrics_payload,
    recordedAt: r.recorded_at,
  };
}

// ── Ambulance functions ───────────────────────────────────────────────────

export async function getAvailableAmbulances(
  providerId: string
): Promise<Ambulance[]> {
  const { data, error } = await supabase
    .from('ambulances')
    .select(AMBULANCE_COLS)
    .eq('provider_id', providerId)
    .eq('is_available', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as AmbulanceRow[]).map(mapAmbulance);
}

export async function getAmbulance(id: string): Promise<Ambulance | null> {
  const { data, error } = await supabase
    .from('ambulances')
    .select(AMBULANCE_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapAmbulance(data as AmbulanceRow) : null;
}

// ── Emergency Request functions ───────────────────────────────────────────

export async function getMyEmergencyHistory(options: {
  status?: ResponseStatus;
  limit?: number;
  before?: string;
} = {}): Promise<EmergencyRequest[]> {
  let q = supabase
    .from('emergency_requests')
    .select(EMERGENCY_COLS);

  if (options.status) q = q.eq('response_status', options.status);
  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as EmergencyRow[]).map(mapEmergency);
}

export async function getEmergencyRequest(id: string): Promise<EmergencyRequest | null> {
  const { data, error } = await supabase
    .from('emergency_requests')
    .select(EMERGENCY_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapEmergency(data as EmergencyRow) : null;
}

// ── AI Diagnosis functions ────────────────────────────────────────────────

export async function getMyAiDiagnoses(options: {
  limit?: number;
  before?: string;
} = {}): Promise<AiDiagnosisAssistance[]> {
  let q = supabase
    .from('ai_diagnosis_assistance')
    .select(AI_DIAGNOSIS_COLS);

  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as DiagnosisRow[]).map(mapDiagnosis);
}

export async function getAiDiagnosis(id: string): Promise<AiDiagnosisAssistance | null> {
  const { data, error } = await supabase
    .from('ai_diagnosis_assistance')
    .select(AI_DIAGNOSIS_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapDiagnosis(data as DiagnosisRow) : null;
}

export async function getReviewedDiagnoses(options: {
  limit?: number;
  before?: string;
} = {}): Promise<AiDiagnosisAssistance[]> {
  let q = supabase
    .from('ai_diagnosis_assistance')
    .select(AI_DIAGNOSIS_COLS)
    .not('reviewed_by_doctor_id', 'is', null);

  if (options.before) q = q.lt('created_at', options.before);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as DiagnosisRow[]).map(mapDiagnosis);
}

// ── Healthcare Audit Log functions ────────────────────────────────────────

export async function getMyAuditLog(options: {
  limit?: number;
  before?: string;
} = {}): Promise<HealthcareAuditLog[]> {
  let q = supabase
    .from('healthcare_audit_logs')
    .select(AUDIT_HEALTHCARE_COLS);

  if (options.before) q = q.lt('logged_at', options.before);

  const { data, error } = await q
    .order('logged_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as AuditHealthcareRow[]).map(mapAuditHealthcare);
}

// ── Healthcare Analytics functions ────────────────────────────────────────

export async function getHealthcareAnalytics(options: {
  metricCategory?: string;
  limit?: number;
  before?: string;
} = {}): Promise<HealthcareAnalyticsSingularity[]> {
  let q = supabase
    .from('global_healthcare_analytics_singularity')
    .select(ANALYTICS_HEALTHCARE_COLS);

  if (options.metricCategory) q = q.eq('metric_category', options.metricCategory);
  if (options.before) q = q.lt('recorded_at', options.before);

  const { data, error } = await q
    .order('recorded_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as AnalyticsHealthcareRow[]).map(mapAnalyticsHealthcare);
}

export async function getLatestHealthMetric(
  metricCategory: string
): Promise<HealthcareAnalyticsSingularity | null> {
  const { data, error } = await supabase
    .from('global_healthcare_analytics_singularity')
    .select(ANALYTICS_HEALTHCARE_COLS)
    .eq('metric_category', metricCategory)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapAnalyticsHealthcare(data as AnalyticsHealthcareRow) : null;
}

// ── Part 4.2: Quantum Singularity Security & Emergency Expansion ──────────
//
// Backend-only tables — zero frontend code:
//   zero_day_threat_immunity_shield  — security ops; node_source_ip = attacker IP
//   sovereign_health_singularity_matrix — internal system registry

// ── Column constants ──────────────────────────────────────────────────────

const DRONE_COLS =
  'id, emergency_request_id, drone_unit_code, payload_type, flight_path_gps_json, flight_status, eta_seconds, launched_at';

const EPIDEMIC_COLS =
  'id, region_country_code, predicted_pathogen_type, risk_probability_index, recommended_hospital_preparations, forecast_status, calculated_at';

const CRYPTO_AUDIT_COLS =
  'id, actor_user_id, action_signature_hash, target_table_name, verification_status, recorded_at';
// cryptographic_proof_key excluded — cryptographic material (ABSOLUTE NEVER)

// ── Row types ─────────────────────────────────────────────────────────────

type DroneRow = {
  id: string;
  emergency_request_id: string | null;
  drone_unit_code: string;
  payload_type: DronePayloadType;
  flight_path_gps_json: unknown[];
  flight_status: DroneFlightStatus;
  eta_seconds: number;
  launched_at: string;
};

type EpidemicRow = {
  id: string;
  region_country_code: string;
  predicted_pathogen_type: string;
  risk_probability_index: number;
  recommended_hospital_preparations: Record<string, unknown>;
  forecast_status: ForecastStatus;
  calculated_at: string;
};

type CryptoAuditRow = {
  id: string;
  actor_user_id: string;
  action_signature_hash: string;
  target_table_name: string;
  verification_status: AuditTrailVerificationStatus;
  recorded_at: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────

function mapDrone(r: DroneRow): DroneDispatch {
  return {
    id: r.id,
    emergencyRequestId: r.emergency_request_id,
    droneUnitCode: r.drone_unit_code,
    payloadType: r.payload_type,
    flightPathGpsJson: r.flight_path_gps_json,
    flightStatus: r.flight_status,
    etaSeconds: r.eta_seconds,
    launchedAt: r.launched_at,
  };
}

function mapEpidemic(r: EpidemicRow): EpidemicForecast {
  return {
    id: r.id,
    regionCountryCode: r.region_country_code,
    predictedPathogenType: r.predicted_pathogen_type,
    riskProbabilityIndex: r.risk_probability_index,
    recommendedHospitalPreparations: r.recommended_hospital_preparations,
    forecastStatus: r.forecast_status,
    calculatedAt: r.calculated_at,
  };
}

function mapCryptoAudit(r: CryptoAuditRow): QuantumAuditTrailEntry {
  return {
    id: r.id,
    actorUserId: r.actor_user_id,
    actionSignatureHash: r.action_signature_hash,
    targetTableName: r.target_table_name,
    verificationStatus: r.verification_status,
    recordedAt: r.recorded_at,
  };
}

// ── Drone Dispatch functions ──────────────────────────────────────────────

export async function getDroneDispatch(
  emergencyRequestId: string
): Promise<DroneDispatch | null> {
  const { data, error } = await supabase
    .from('quantum_drone_ambulance_dispatch')
    .select(DRONE_COLS)
    .eq('emergency_request_id', emergencyRequestId)
    .order('launched_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data ? mapDrone(data as DroneRow) : null;
}

export async function getDroneById(id: string): Promise<DroneDispatch | null> {
  const { data, error } = await supabase
    .from('quantum_drone_ambulance_dispatch')
    .select(DRONE_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapDrone(data as DroneRow) : null;
}

export async function getActiveDrones(options: {
  status?: DroneFlightStatus;
  limit?: number;
} = {}): Promise<DroneDispatch[]> {
  let q = supabase
    .from('quantum_drone_ambulance_dispatch')
    .select(DRONE_COLS);

  if (options.status) {
    q = q.eq('flight_status', options.status);
  } else {
    q = q.in('flight_status', ['standby', 'airborne', 'returning']);
  }

  const { data, error } = await q
    .order('launched_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as DroneRow[]).map(mapDrone);
}

// ── Epidemic Predictor functions ──────────────────────────────────────────

export async function getEpidemicForecasts(options: {
  forecastStatus?: ForecastStatus;
  limit?: number;
  before?: string;
} = {}): Promise<EpidemicForecast[]> {
  let q = supabase
    .from('neural_disaster_epidemic_predictor')
    .select(EPIDEMIC_COLS);

  if (options.forecastStatus) q = q.eq('forecast_status', options.forecastStatus);
  if (options.before) q = q.lt('calculated_at', options.before);

  const { data, error } = await q
    .order('calculated_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as EpidemicRow[]).map(mapEpidemic);
}

export async function getEpidemicForecastsByCountry(
  countryCode: string,
  options: { limit?: number } = {}
): Promise<EpidemicForecast[]> {
  const { data, error } = await supabase
    .from('neural_disaster_epidemic_predictor')
    .select(EPIDEMIC_COLS)
    .eq('region_country_code', countryCode)
    .order('calculated_at', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as EpidemicRow[]).map(mapEpidemic);
}

export async function getActiveEpidemicWarnings(
  options: { limit?: number } = {}
): Promise<EpidemicForecast[]> {
  const { data, error } = await supabase
    .from('neural_disaster_epidemic_predictor')
    .select(EPIDEMIC_COLS)
    .in('forecast_status', ['active_monitoring', 'warning_issued', 'lockdown_suggested'])
    .order('risk_probability_index', { ascending: false })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as EpidemicRow[]).map(mapEpidemic);
}

// ── Quantum Audit Trail functions ─────────────────────────────────────────

export async function getMyQuantumAuditTrail(options: {
  verificationStatus?: AuditTrailVerificationStatus;
  limit?: number;
  before?: string;
} = {}): Promise<QuantumAuditTrailEntry[]> {
  let q = supabase
    .from('quantum_cryptographic_audit_trail')
    .select(CRYPTO_AUDIT_COLS);

  if (options.verificationStatus) q = q.eq('verification_status', options.verificationStatus);
  if (options.before) q = q.lt('recorded_at', options.before);

  const { data, error } = await q
    .order('recorded_at', { ascending: false })
    .limit(options.limit ?? 100);
  if (error) throw error;
  return (data as CryptoAuditRow[]).map(mapCryptoAudit);
}

export async function getQuantumAuditEntry(id: string): Promise<QuantumAuditTrailEntry | null> {
  const { data, error } = await supabase
    .from('quantum_cryptographic_audit_trail')
    .select(CRYPTO_AUDIT_COLS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? mapCryptoAudit(data as CryptoAuditRow) : null;
}
