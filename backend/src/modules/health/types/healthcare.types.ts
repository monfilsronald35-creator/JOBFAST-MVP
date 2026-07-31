// ── Provider / Facility ───────────────────────────────────────────────────────
export type FacilityType =
  | 'hospital' | 'clinic' | 'medical_center' | 'laboratory' | 'pharmacy'
  | 'dentist' | 'eye_clinic' | 'mental_health' | 'home_care'
  | 'ambulance' | 'telemedicine' | 'insurance' | 'government';

export interface HealthFacility {
  id:           string;
  ownerId:      string;
  name:         string;
  type:         FacilityType;
  country:      string;
  city:         string;
  address:      string;
  lat?:         number | undefined;
  lng?:         number | undefined;
  phone:        string;
  email?:       string | undefined;
  website?:     string | undefined;
  isVerified:   boolean;
  isActive:     boolean;
  currency:     string;
  rating:       number;
  createdAt:    string;
}

// ── Patient ───────────────────────────────────────────────────────────────────
export interface Patient {
  id:                 string;
  userId:             string;
  patientId:          string;
  firstName:          string;
  lastName:           string;
  dateOfBirth:        string;
  gender:             'male' | 'female' | 'other';
  bloodType?:         BloodType | undefined;
  country:            string;
  city:               string;
  phone:              string;
  email?:             string | undefined;
  allergies:          string[];
  conditions:         string[];
  medications:        string[];
  vaccinations:       string[];
  emergencyContacts:  EmergencyContact[];
  insuranceId?:       string | undefined;
  preferredLanguage:  string;
  primaryDoctorId?:   string | undefined;
  consentAt:          string;
  createdAt:          string;
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface EmergencyContact {
  name:         string;
  relationship: string;
  phone:        string;
}

// ── Doctor ────────────────────────────────────────────────────────────────────
export interface Doctor {
  id:                   string;
  userId:               string;
  facilityId?:          string | undefined;
  firstName:            string;
  lastName:             string;
  specialty:            string;
  licenseNumber:        string;
  country:              string;
  city:                 string;
  phone:                string;
  email?:               string | undefined;
  languages:            string[];
  experience:           number;
  consultationFee:      number;
  currency:             string;
  telemedicineAvailable: boolean;
  rating:               number;
  reviewCount:          number;
  isVerified:           boolean;
  isActive:             boolean;
  createdAt:            string;
}

export interface DoctorSchedule {
  id:          string;
  doctorId:    string;
  dayOfWeek:   number;
  startTime:   string;
  endTime:     string;
  slotMinutes: number;
  isActive:    boolean;
}

// ── Appointment ───────────────────────────────────────────────────────────────
export type AppointmentType = 'online' | 'walk_in' | 'follow_up' | 'recurring' | 'emergency' | 'telemedicine';
export type AppointmentStatus = 'pending' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id:            string;
  patientId:     string;
  doctorId:      string;
  facilityId?:   string | undefined;
  type:          AppointmentType;
  status:        AppointmentStatus;
  scheduledAt:   string;
  duration:      number;
  reason:        string;
  notes?:        string | undefined;
  fee:           number;
  currency:      string;
  isPaid:        boolean;
  queueNumber?:  number | undefined;
  reminderSent:  boolean;
  createdAt:     string;
}

// ── Medical Records ───────────────────────────────────────────────────────────
export type RecordType = 'consultation' | 'diagnosis' | 'treatment' | 'lab_result' | 'imaging' | 'vaccine' | 'operation' | 'discharge' | 'referral' | 'follow_up';

export interface MedicalRecord {
  id:              string;
  patientId:       string;
  doctorId:        string;
  facilityId?:     string | undefined;
  type:            RecordType;
  title:           string;
  content:         string;
  attachments:     string[];
  isConfidential:  boolean;
  createdAt:       string;
}

// ── Prescription ──────────────────────────────────────────────────────────────
export interface Prescription {
  id:          string;
  patientId:   string;
  doctorId:    string;
  medications: PrescriptionItem[];
  diagnosis:   string;
  notes?:      string | undefined;
  qrCode:      string;
  validUntil:  string;
  pharmacyId?: string | undefined;
  status:      'active' | 'dispensed' | 'expired' | 'cancelled';
  renewalCount: number;
  createdAt:   string;
}

export interface PrescriptionItem {
  name:      string;
  dosage:    string;
  frequency: string;
  duration:  string;
  quantity:  number;
  notes?:    string;
}

// ── Laboratory ────────────────────────────────────────────────────────────────
export type LabTestType = 'blood' | 'urine' | 'covid' | 'imaging' | 'biopsy' | 'genetic' | 'culture' | 'other';
export type LabStatus = 'ordered' | 'collected' | 'processing' | 'ready' | 'delivered';

export interface LabOrder {
  id:          string;
  patientId:   string;
  doctorId:    string;
  facilityId:  string;
  testType:    LabTestType;
  testName:    string;
  status:      LabStatus;
  priority:    'routine' | 'urgent' | 'stat';
  results?:    string | undefined;
  resultUrl?:  string | undefined;
  aiAnalysis?: string | undefined;
  orderedAt:   string;
  readyAt?:    string | undefined;
}

// ── Pharmacy ──────────────────────────────────────────────────────────────────
export type PharmacyOrderStatus = 'received' | 'verifying' | 'preparing' | 'ready' | 'dispensed' | 'delivered';

export interface PharmacyOrder {
  id:             string;
  prescriptionId: string;
  pharmacyId:     string;
  patientId:      string;
  items:          PrescriptionItem[];
  status:         PharmacyOrderStatus;
  totalAmount:    number;
  currency:       string;
  deliveryType:   'pickup' | 'delivery';
  deliveryAddress?: string | undefined;
  createdAt:      string;
}

// ── Insurance ─────────────────────────────────────────────────────────────────
export type ClaimStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';

export interface InsuranceClaim {
  id:              string;
  patientId:       string;
  insurerId:       string;
  facilityId?:     string | undefined;
  appointmentId?:  string | undefined;
  type:            'consultation' | 'lab' | 'medication' | 'hospitalization' | 'surgery' | 'emergency';
  totalAmount:     number;
  coveredAmount:   number;
  copayment:       number;
  deductible:      number;
  currency:        string;
  status:          ClaimStatus;
  documents:       string[];
  notes?:          string | undefined;
  createdAt:       string;
}

export interface InsurancePolicy {
  id:          string;
  patientId:   string;
  insurerId:   string;
  policyNumber: string;
  coverageTypes: string[];
  maxAnnual:   number;
  currency:    string;
  startDate:   string;
  endDate:     string;
  isActive:    boolean;
  createdAt:   string;
}

// ── Emergency ─────────────────────────────────────────────────────────────────
export type EmergencyStatus = 'requesting' | 'dispatched' | 'on_way' | 'arrived' | 'at_hospital' | 'resolved';

export interface EmergencyRequest {
  id:            string;
  userId:        string;
  patientId?:    string | undefined;
  lat:           number;
  lng:           number;
  address?:      string | undefined;
  description:   string;
  severity:      'critical' | 'high' | 'medium' | 'low';
  status:        EmergencyStatus;
  ambulanceId?:  string | undefined;
  hospitalId?:   string | undefined;
  dispatchedAt?: string | undefined;
  resolvedAt?:   string | undefined;
  createdAt:     string;
}

// ── Telemedicine ──────────────────────────────────────────────────────────────
export type SessionStatus = 'scheduled' | 'waiting' | 'active' | 'completed' | 'cancelled';
export type SessionMode  = 'video' | 'voice' | 'chat';

export interface TelemedicineSession {
  id:            string;
  appointmentId: string;
  patientId:     string;
  doctorId:      string;
  mode:          SessionMode;
  status:        SessionStatus;
  startedAt?:    string | undefined;
  endedAt?:      string | undefined;
  duration?:     number | undefined;
  roomToken?:    string | undefined;
  notes?:        string | undefined;
  followUpAt?:   string | undefined;
  createdAt:     string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface HealthcareAnalytics {
  facilityId:          string;
  period:              string;
  totalPatients:       number;
  admissions:          number;
  discharges:          number;
  appointments:        number;
  revenue:             number;
  currency:            string;
  avgWaitMinutes:      number;
  occupancyRate:       number;
  insuranceClaims:     number;
  claimsApproved:      number;
  satisfactionScore:   number;
  topSpecialties:      Array<{ specialty: string; count: number }>;
  generatedAt:         string;
}