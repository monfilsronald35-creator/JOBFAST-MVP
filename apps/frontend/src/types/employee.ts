// ── Employees ─────────────────────────────────────────────────────────────

export const EMPLOYMENT_TYPES = [
  'full_time', 'part_time', 'contractor', 'intern', 'consultant',
  'gig_worker', 'seasonal', 'temporary',
] as const;
export type EmploymentType = typeof EMPLOYMENT_TYPES[number];

export const EMPLOYMENT_STATUSES = [
  'active', 'suspended', 'terminated', 'resigned', 'on_leave', 'probation', 'retired',
] as const;
export type EmploymentStatus = typeof EMPLOYMENT_STATUSES[number];

export const PAY_TYPES = ['salary', 'hourly', 'commission', 'contract_fee', 'piece_rate'] as const;
export type PayType = typeof PAY_TYPES[number];

export const PAYROLL_STATUSES = ['eligible', 'paused', 'processing', 'exempt', 'audited'] as const;
export type PayrollStatus = typeof PAYROLL_STATUSES[number];

export interface Employee {
  id: string;
  organizationId: string;
  branchId: string | null;
  departmentId: string | null;
  managerId: string | null;
  userId: string | null;
  employeeNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  preferredName: string | null;
  email: string;
  workEmail: string | null;
  phoneNumber: string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  payType: PayType;
  currency: string;
  skills: string[];
  languagesSpoken: string[];
  certifications: string[];
  availabilitySchedule: Record<string, unknown>;
  performanceScore: number;
  payrollStatus: PayrollStatus;
  hiredAt: string;
  probationEndsAt: string | null;
  terminatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // tax_file_number, national_id_number — government IDs, backend only
  // date_of_birth, gender, marital_status — GDPR special category, backend only
  // residential_address, mailing_address — home address PII, backend only
  // personal_profile — sensitive personal data JSONB, backend only
  // base_salary, hourly_rate — financial, payroll service only
  // tax_withholding_config — tax processing, backend only
  // benefits_config — benefits processing, backend only
  // emergency_contacts — third-party PII, backend only
  // bank_accounts — NEVER (bank routing / account numbers)
  // biometric_profile_hash — NEVER (biometric data)
  // ai_trust_score, risk_score — internal AI assessments, backend only
}

// ── Employee Contracts ─────────────────────────────────────────────────────

export const CONTRACT_TYPES = [
  'permanent', 'fixed_term', 'freelance', 'nda', 'probation', 'internship', 'consultancy',
] as const;
export type ContractType = typeof CONTRACT_TYPES[number];

export interface EmployeeContract {
  id: string;
  employeeId: string;
  organizationId: string;
  contractTitle: string;
  contractType: ContractType;
  versionNumber: number;
  startDate: string;
  endDate: string | null;
  salaryAmount: number;
  currency: string;
  allowances: Record<string, unknown>;
  documentUrl: string;
  isSigned: boolean;
  signedAt: string | null;
  createdAt: string;
  // digital_signature_hash excluded — cryptographic hash, backend verification only
  // terms_and_conditions excluded — full legal JSON, use documentUrl for PDF
}

// ── Employee Documents ─────────────────────────────────────────────────────

export const EMPLOYEE_DOCUMENT_TYPES = [
  'passport', 'national_id', 'visa', 'work_permit', 'cv', 'resume',
  'diploma', 'license', 'tax_form', 'background_check', 'medical_clearance', 'nda_doc',
] as const;
export type EmployeeDocumentType = typeof EMPLOYEE_DOCUMENT_TYPES[number];

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: EmployeeDocumentType;
  documentName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string | null;
  isVerified: boolean;
  verifiedBy: string | null;
  verificationNotes: string | null;
  issuedDate: string | null;
  expiresAt: string | null;
  createdAt: string;
  // encryption_algorithm excluded — internal security detail
}

// ── Employee Attendance ────────────────────────────────────────────────────

export const ATTENDANCE_STATUSES = [
  'present', 'absent', 'late', 'half_day', 'remote', 'on_leave', 'business_trip',
] as const;
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

export const FACE_VERIFICATION_STATUSES = [
  'verified', 'failed', 'pending', 'bypassed', 'ai_flagged',
] as const;
export type FaceVerificationStatus = typeof FACE_VERIFICATION_STATUSES[number];

export interface EmployeeAttendance {
  id: string;
  employeeId: string;
  branchId: string | null;
  workDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInGps: string | null; // PostgreSQL POINT serialized as "(x,y)" by PostgREST
  checkOutGps: string | null;
  isWithinGeofence: boolean;
  faceVerificationStatus: FaceVerificationStatus;
  regularHoursWorked: number;
  overtimeHoursWorked: number;
  breakDurationMinutes: number;
  attendanceStatus: AttendanceStatus;
  supervisorNotes: string | null;
  createdAt: string;
  // face_match_confidence excluded — biometric confidence score (never expose)
}

// ── Employee Leaves ────────────────────────────────────────────────────────

export const LEAVE_TYPES = [
  'vacation', 'sick', 'emergency', 'maternity', 'paternity',
  'unpaid', 'study', 'compassionate', 'sabbatical',
] as const;
export type LeaveType = typeof LEAVE_TYPES[number];

export const LEAVE_APPROVAL_STATUSES = [
  'draft', 'pending_manager', 'pending_hr', 'approved', 'rejected', 'cancelled',
] as const;
export type LeaveApprovalStatus = typeof LEAVE_APPROVAL_STATUSES[number];

export interface EmployeeLeave {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  handoverNotes: string | null;
  attachmentUrl: string | null;
  approvalStatus: LeaveApprovalStatus;
  approvedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

// ── Employee Performance ───────────────────────────────────────────────────

export const PERFORMANCE_REVIEW_TYPES = [
  'weekly', 'monthly', 'quarterly', 'biannual', 'annual', 'probation_end', '360_peer',
] as const;
export type PerformanceReviewType = typeof PERFORMANCE_REVIEW_TYPES[number];

export interface EmployeePerformance {
  id: string;
  employeeId: string;
  reviewerId: string | null;
  reviewPeriod: string;
  reviewType: PerformanceReviewType;
  kpiMetrics: Record<string, unknown>;
  okrsObjectives: Record<string, unknown>;
  peerFeedback: unknown[];
  overallRating: number;
  competencyScores: Record<string, unknown>;
  developmentGoals: string | null;
  aiNeuralEvaluationSummary: string | null;
  createdAt: string;
}

// ── Employee Benefits ─────────────────────────────────────────────────────

export const BENEFIT_TYPES = [
  'health_insurance', 'life_insurance', 'pension_plan', 'transport_allowance',
  'meal_voucher', 'housing_allowance', 'gym_membership', 'childcare',
] as const;
export type BenefitType = typeof BENEFIT_TYPES[number];

export interface EmployeeBenefit {
  id: string;
  employeeId: string;
  benefitName: string;
  benefitType: BenefitType;
  providerName: string | null;
  policyNumber: string | null;
  coverageAmount: number;
  employeeContribution: number;
  employerContribution: number;
  currency: string;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}
