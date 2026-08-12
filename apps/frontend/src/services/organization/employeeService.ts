import { supabase } from '../../lib/supabase';
import type {
  Employee,
  EmploymentStatus,
  EmployeeContract,
  EmployeeDocument,
  EmployeeDocumentType,
  EmployeeAttendance,
  AttendanceStatus,
  EmployeeLeave,
  LeaveType,
  LeaveApprovalStatus,
  EmployeePerformance,
  EmployeeBenefit,
} from '../../types/employee';

// Backend-only fields (never queried from frontend):
//   employees:            tax_file_number, national_id_number — government IDs
//                         date_of_birth, gender, marital_status — GDPR special category
//                         residential_address, mailing_address — home address PII
//                         personal_profile — sensitive personal data JSONB
//                         base_salary, hourly_rate — financial (payroll service only)
//                         tax_withholding_config — tax processing backend
//                         benefits_config — benefits processing backend
//                         emergency_contacts — third-party PII
//                         bank_accounts — NEVER (bank routing / account numbers)
//                         biometric_profile_hash — NEVER (biometric data)
//                         ai_trust_score, risk_score — internal AI assessments
//   employee_contracts:   digital_signature_hash — cryptographic hash, backend only
//                         terms_and_conditions — full legal JSON, use document_url
//   employee_documents:   encryption_algorithm — internal security detail
//   employee_attendance:  face_match_confidence — biometric confidence score (never expose)
//   check_in / check_out: GPS geofence verification and face verification are backend ops —
//                         frontend never writes attendance records directly

// ── Column constants ───────────────────────────────────────────────────────

const EMPLOYEE_COLS =
  'id, organization_id, branch_id, department_id, manager_id, user_id, employee_number, first_name, middle_name, last_name, preferred_name, email, work_email, phone_number, employment_type, employment_status, pay_type, currency, skills, languages_spoken, certifications, availability_schedule, performance_score, payroll_status, hired_at, probation_ends_at, terminated_at, created_at, updated_at';

const CONTRACT_COLS =
  'id, employee_id, organization_id, contract_title, contract_type, version_number, start_date, end_date, salary_amount, currency, allowances, document_url, is_signed, signed_at, created_at';

const DOCUMENT_COLS =
  'id, employee_id, document_type, document_name, file_url, file_size_bytes, mime_type, is_verified, verified_by, verification_notes, issued_date, expires_at, created_at';

const ATTENDANCE_COLS =
  'id, employee_id, branch_id, work_date, check_in_time, check_out_time, check_in_gps, check_out_gps, is_within_geofence, face_verification_status, regular_hours_worked, overtime_hours_worked, break_duration_minutes, attendance_status, supervisor_notes, created_at';

// ── Row types (snake_case) ─────────────────────────────────────────────────

type EmployeeRow = {
  id: string; organization_id: string; branch_id: string | null;
  department_id: string | null; manager_id: string | null; user_id: string | null;
  employee_number: string; first_name: string; middle_name: string | null;
  last_name: string; preferred_name: string | null; email: string;
  work_email: string | null; phone_number: string;
  employment_type: string; employment_status: string; pay_type: string; currency: string;
  skills: string[]; languages_spoken: string[]; certifications: string[];
  availability_schedule: Record<string, unknown>; performance_score: number;
  payroll_status: string; hired_at: string; probation_ends_at: string | null;
  terminated_at: string | null; created_at: string; updated_at: string;
};

type ContractRow = {
  id: string; employee_id: string; organization_id: string; contract_title: string;
  contract_type: string; version_number: number; start_date: string;
  end_date: string | null; salary_amount: number; currency: string;
  allowances: Record<string, unknown>; document_url: string;
  is_signed: boolean; signed_at: string | null; created_at: string;
};

type DocumentRow = {
  id: string; employee_id: string; document_type: string; document_name: string;
  file_url: string; file_size_bytes: number; mime_type: string | null;
  is_verified: boolean; verified_by: string | null; verification_notes: string | null;
  issued_date: string | null; expires_at: string | null; created_at: string;
};

type AttendanceRow = {
  id: string; employee_id: string; branch_id: string | null; work_date: string;
  check_in_time: string | null; check_out_time: string | null;
  check_in_gps: string | null; check_out_gps: string | null;
  is_within_geofence: boolean; face_verification_status: string;
  regular_hours_worked: number; overtime_hours_worked: number;
  break_duration_minutes: number; attendance_status: string;
  supervisor_notes: string | null; created_at: string;
};

type LeaveRow = {
  id: string; employee_id: string; leave_type: string; start_date: string;
  end_date: string; total_days: number; reason: string;
  handover_notes: string | null; attachment_url: string | null;
  approval_status: string; approved_by: string | null;
  rejection_reason: string | null; created_at: string;
};

type PerformanceRow = {
  id: string; employee_id: string; reviewer_id: string | null; review_period: string;
  review_type: string; kpi_metrics: Record<string, unknown>;
  okrs_objectives: Record<string, unknown>; peer_feedback: unknown[];
  overall_rating: number; competency_scores: Record<string, unknown>;
  development_goals: string | null; ai_neural_evaluation_summary: string | null;
  created_at: string;
};

type BenefitRow = {
  id: string; employee_id: string; benefit_name: string; benefit_type: string;
  provider_name: string | null; policy_number: string | null;
  coverage_amount: number; employee_contribution: number; employer_contribution: number;
  currency: string; is_active: boolean; start_date: string;
  end_date: string | null; created_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────

function mapEmployee(r: EmployeeRow): Employee {
  return {
    id: r.id, organizationId: r.organization_id, branchId: r.branch_id,
    departmentId: r.department_id, managerId: r.manager_id, userId: r.user_id,
    employeeNumber: r.employee_number, firstName: r.first_name, middleName: r.middle_name,
    lastName: r.last_name, preferredName: r.preferred_name, email: r.email,
    workEmail: r.work_email, phoneNumber: r.phone_number,
    employmentType: r.employment_type as Employee['employmentType'],
    employmentStatus: r.employment_status as EmploymentStatus,
    payType: r.pay_type as Employee['payType'], currency: r.currency,
    skills: r.skills, languagesSpoken: r.languages_spoken, certifications: r.certifications,
    availabilitySchedule: r.availability_schedule, performanceScore: r.performance_score,
    payrollStatus: r.payroll_status as Employee['payrollStatus'],
    hiredAt: r.hired_at, probationEndsAt: r.probation_ends_at,
    terminatedAt: r.terminated_at, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapContract(r: ContractRow): EmployeeContract {
  return {
    id: r.id, employeeId: r.employee_id, organizationId: r.organization_id,
    contractTitle: r.contract_title, contractType: r.contract_type as EmployeeContract['contractType'],
    versionNumber: r.version_number, startDate: r.start_date, endDate: r.end_date,
    salaryAmount: r.salary_amount, currency: r.currency, allowances: r.allowances,
    documentUrl: r.document_url, isSigned: r.is_signed, signedAt: r.signed_at,
    createdAt: r.created_at,
  };
}

function mapDocument(r: DocumentRow): EmployeeDocument {
  return {
    id: r.id, employeeId: r.employee_id,
    documentType: r.document_type as EmployeeDocumentType,
    documentName: r.document_name, fileUrl: r.file_url, fileSizeBytes: r.file_size_bytes,
    mimeType: r.mime_type, isVerified: r.is_verified, verifiedBy: r.verified_by,
    verificationNotes: r.verification_notes, issuedDate: r.issued_date,
    expiresAt: r.expires_at, createdAt: r.created_at,
  };
}

function mapAttendance(r: AttendanceRow): EmployeeAttendance {
  return {
    id: r.id, employeeId: r.employee_id, branchId: r.branch_id, workDate: r.work_date,
    checkInTime: r.check_in_time, checkOutTime: r.check_out_time,
    checkInGps: r.check_in_gps, checkOutGps: r.check_out_gps,
    isWithinGeofence: r.is_within_geofence,
    faceVerificationStatus: r.face_verification_status as EmployeeAttendance['faceVerificationStatus'],
    regularHoursWorked: r.regular_hours_worked, overtimeHoursWorked: r.overtime_hours_worked,
    breakDurationMinutes: r.break_duration_minutes,
    attendanceStatus: r.attendance_status as AttendanceStatus,
    supervisorNotes: r.supervisor_notes, createdAt: r.created_at,
  };
}

function mapLeave(r: LeaveRow): EmployeeLeave {
  return {
    id: r.id, employeeId: r.employee_id, leaveType: r.leave_type as LeaveType,
    startDate: r.start_date, endDate: r.end_date, totalDays: r.total_days,
    reason: r.reason, handoverNotes: r.handover_notes, attachmentUrl: r.attachment_url,
    approvalStatus: r.approval_status as LeaveApprovalStatus,
    approvedBy: r.approved_by, rejectionReason: r.rejection_reason,
    createdAt: r.created_at,
  };
}

function mapPerformance(r: PerformanceRow): EmployeePerformance {
  return {
    id: r.id, employeeId: r.employee_id, reviewerId: r.reviewer_id,
    reviewPeriod: r.review_period,
    reviewType: r.review_type as EmployeePerformance['reviewType'],
    kpiMetrics: r.kpi_metrics, okrsObjectives: r.okrs_objectives,
    peerFeedback: r.peer_feedback, overallRating: r.overall_rating,
    competencyScores: r.competency_scores, developmentGoals: r.development_goals,
    aiNeuralEvaluationSummary: r.ai_neural_evaluation_summary, createdAt: r.created_at,
  };
}

function mapBenefit(r: BenefitRow): EmployeeBenefit {
  return {
    id: r.id, employeeId: r.employee_id, benefitName: r.benefit_name,
    benefitType: r.benefit_type as EmployeeBenefit['benefitType'],
    providerName: r.provider_name, policyNumber: r.policy_number,
    coverageAmount: r.coverage_amount, employeeContribution: r.employee_contribution,
    employerContribution: r.employer_contribution, currency: r.currency,
    isActive: r.is_active, startDate: r.start_date, endDate: r.end_date,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Employees
// ================================================================

export async function getMyEmployeeProfile(): Promise<Employee | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_COLS)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEmployee(data as EmployeeRow) : null;
}

export async function getEmployee(employeeId: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_COLS)
    .eq('id', employeeId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEmployee(data as EmployeeRow) : null;
}

export async function getOrgDirectory(
  orgId: string,
  options: { status?: EmploymentStatus; departmentId?: string; branchId?: string; limit?: number; cursor?: string } = {}
): Promise<Employee[]> {
  let q = supabase
    .from('employees')
    .select(EMPLOYEE_COLS)
    .eq('organization_id', orgId);

  if (options.status) q = q.eq('employment_status', options.status);
  if (options.departmentId) q = q.eq('department_id', options.departmentId);
  if (options.branchId) q = q.eq('branch_id', options.branchId);
  if (options.cursor) q = q.gt('id', options.cursor);

  const { data, error } = await q
    .order('last_name', { ascending: true })
    .limit(options.limit ?? 50);
  if (error) throw error;
  return (data as EmployeeRow[]).map(mapEmployee);
}

export async function getTeamMembers(managerId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_COLS)
    .eq('manager_id', managerId)
    .eq('employment_status', 'active')
    .order('last_name', { ascending: true });
  if (error) throw error;
  return (data as EmployeeRow[]).map(mapEmployee);
}

// ================================================================
// === Employee Contracts
// ================================================================

export async function getMyContracts(): Promise<EmployeeContract[]> {
  const profile = await getMyEmployeeProfile();
  if (!profile) return [];

  const { data, error } = await supabase
    .from('employee_contracts')
    .select(CONTRACT_COLS)
    .eq('employee_id', profile.id)
    .order('version_number', { ascending: false });
  if (error) throw error;
  return (data as ContractRow[]).map(mapContract);
}

export async function getContract(contractId: string): Promise<EmployeeContract | null> {
  const { data, error } = await supabase
    .from('employee_contracts')
    .select(CONTRACT_COLS)
    .eq('id', contractId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapContract(data as ContractRow) : null;
}

export async function getEmployeeContracts(employeeId: string): Promise<EmployeeContract[]> {
  const { data, error } = await supabase
    .from('employee_contracts')
    .select(CONTRACT_COLS)
    .eq('employee_id', employeeId)
    .order('version_number', { ascending: false });
  if (error) throw error;
  return (data as ContractRow[]).map(mapContract);
}

// ================================================================
// === Employee Documents
// ================================================================

export async function getMyDocuments(
  type?: EmployeeDocumentType
): Promise<EmployeeDocument[]> {
  const profile = await getMyEmployeeProfile();
  if (!profile) return [];

  let q = supabase
    .from('employee_documents')
    .select(DOCUMENT_COLS)
    .eq('employee_id', profile.id);

  if (type) q = q.eq('document_type', type);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DocumentRow[]).map(mapDocument);
}

export async function getEmployeeDocuments(
  employeeId: string,
  type?: EmployeeDocumentType
): Promise<EmployeeDocument[]> {
  let q = supabase
    .from('employee_documents')
    .select(DOCUMENT_COLS)
    .eq('employee_id', employeeId);

  if (type) q = q.eq('document_type', type);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DocumentRow[]).map(mapDocument);
}

export async function getExpiringDocuments(
  employeeId: string,
  withinDays: number = 30
): Promise<EmployeeDocument[]> {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + withinDays);

  const { data, error } = await supabase
    .from('employee_documents')
    .select(DOCUMENT_COLS)
    .eq('employee_id', employeeId)
    .not('expires_at', 'is', null)
    .lte('expires_at', threshold.toISOString())
    .order('expires_at', { ascending: true });
  if (error) throw error;
  return (data as DocumentRow[]).map(mapDocument);
}

// ================================================================
// === Employee Attendance (READ ONLY — writes go through backend)
// ================================================================
//
// check_in and check_out are backend-only operations. GPS geofence
// validation and face verification must run server-side — the frontend
// cannot be trusted to compute or attest these values.

export async function getMyAttendance(
  options: { from: string; to?: string; status?: AttendanceStatus } = { from: '' }
): Promise<EmployeeAttendance[]> {
  const profile = await getMyEmployeeProfile();
  if (!profile) return [];

  let q = supabase
    .from('employee_attendance')
    .select(ATTENDANCE_COLS)
    .eq('employee_id', profile.id)
    .gte('work_date', options.from);

  if (options.to) q = q.lte('work_date', options.to);
  if (options.status) q = q.eq('attendance_status', options.status);

  const { data, error } = await q.order('work_date', { ascending: false });
  if (error) throw error;
  return (data as AttendanceRow[]).map(mapAttendance);
}

export async function getEmployeeAttendance(
  employeeId: string,
  from: string,
  to?: string
): Promise<EmployeeAttendance[]> {
  let q = supabase
    .from('employee_attendance')
    .select(ATTENDANCE_COLS)
    .eq('employee_id', employeeId)
    .gte('work_date', from);

  if (to) q = q.lte('work_date', to);

  const { data, error } = await q.order('work_date', { ascending: false });
  if (error) throw error;
  return (data as AttendanceRow[]).map(mapAttendance);
}

export async function getTodayAttendance(): Promise<EmployeeAttendance | null> {
  const profile = await getMyEmployeeProfile();
  if (!profile) return null;

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('employee_attendance')
    .select(ATTENDANCE_COLS)
    .eq('employee_id', profile.id)
    .eq('work_date', today)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAttendance(data as AttendanceRow) : null;
}

// ================================================================
// === Employee Leaves
// ================================================================

export async function getMyLeaves(
  options: { status?: LeaveApprovalStatus; leaveType?: LeaveType } = {}
): Promise<EmployeeLeave[]> {
  const profile = await getMyEmployeeProfile();
  if (!profile) return [];

  let q = supabase
    .from('employee_leaves')
    .select('*')
    .eq('employee_id', profile.id);

  if (options.status) q = q.eq('approval_status', options.status);
  if (options.leaveType) q = q.eq('leave_type', options.leaveType);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as LeaveRow[]).map(mapLeave);
}

export async function getLeave(leaveId: string): Promise<EmployeeLeave | null> {
  const { data, error } = await supabase
    .from('employee_leaves')
    .select('*')
    .eq('id', leaveId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapLeave(data as LeaveRow) : null;
}

export async function getTeamLeaves(
  managerId: string,
  status?: LeaveApprovalStatus
): Promise<EmployeeLeave[]> {
  const { data: reports, error: rErr } = await supabase
    .from('employees')
    .select('id')
    .eq('manager_id', managerId);
  if (rErr) throw rErr;
  if (!reports?.length) return [];

  const employeeIds = (reports as { id: string }[]).map(r => r.id);

  let q = supabase
    .from('employee_leaves')
    .select('*')
    .in('employee_id', employeeIds);

  if (status) q = q.eq('approval_status', status);

  const { data, error } = await q.order('start_date', { ascending: true });
  if (error) throw error;
  return (data as LeaveRow[]).map(mapLeave);
}

export async function submitLeaveRequest(payload: {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  handoverNotes?: string;
  attachmentUrl?: string;
}): Promise<EmployeeLeave> {
  const profile = await getMyEmployeeProfile();
  if (!profile) throw new Error('No employee profile found');

  const { data, error } = await supabase
    .from('employee_leaves')
    .insert({
      employee_id: profile.id,
      leave_type: payload.leaveType,
      start_date: payload.startDate,
      end_date: payload.endDate,
      total_days: payload.totalDays,
      reason: payload.reason,
      handover_notes: payload.handoverNotes ?? null,
      attachment_url: payload.attachmentUrl ?? null,
      approval_status: 'pending_manager',
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapLeave(data as LeaveRow);
}

export async function cancelLeave(leaveId: string): Promise<void> {
  const profile = await getMyEmployeeProfile();
  if (!profile) throw new Error('No employee profile found');

  const { error } = await supabase
    .from('employee_leaves')
    .update({ approval_status: 'cancelled' })
    .eq('id', leaveId)
    .eq('employee_id', profile.id)
    .in('approval_status', ['draft', 'pending_manager']);
  if (error) throw error;
}

// ================================================================
// === Employee Performance
// ================================================================

export async function getMyPerformanceReviews(): Promise<EmployeePerformance[]> {
  const profile = await getMyEmployeeProfile();
  if (!profile) return [];

  const { data, error } = await supabase
    .from('employee_performance')
    .select('*')
    .eq('employee_id', profile.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PerformanceRow[]).map(mapPerformance);
}

export async function getPerformanceReview(
  reviewId: string
): Promise<EmployeePerformance | null> {
  const { data, error } = await supabase
    .from('employee_performance')
    .select('*')
    .eq('id', reviewId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPerformance(data as PerformanceRow) : null;
}

export async function getTeamPerformance(
  managerId: string,
  reviewPeriod?: string
): Promise<EmployeePerformance[]> {
  const { data: reports, error: rErr } = await supabase
    .from('employees')
    .select('id')
    .eq('manager_id', managerId);
  if (rErr) throw rErr;
  if (!reports?.length) return [];

  const employeeIds = (reports as { id: string }[]).map(r => r.id);

  let q = supabase
    .from('employee_performance')
    .select('*')
    .in('employee_id', employeeIds);

  if (reviewPeriod) q = q.eq('review_period', reviewPeriod);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PerformanceRow[]).map(mapPerformance);
}

// ================================================================
// === Employee Benefits
// ================================================================

export async function getMyBenefits(activeOnly: boolean = true): Promise<EmployeeBenefit[]> {
  const profile = await getMyEmployeeProfile();
  if (!profile) return [];

  let q = supabase
    .from('employee_benefits')
    .select('*')
    .eq('employee_id', profile.id);

  if (activeOnly) q = q.eq('is_active', true);

  const { data, error } = await q.order('benefit_type', { ascending: true });
  if (error) throw error;
  return (data as BenefitRow[]).map(mapBenefit);
}

export async function getEmployeeBenefits(
  employeeId: string,
  activeOnly: boolean = true
): Promise<EmployeeBenefit[]> {
  let q = supabase
    .from('employee_benefits')
    .select('*')
    .eq('employee_id', employeeId);

  if (activeOnly) q = q.eq('is_active', true);

  const { data, error } = await q.order('benefit_type', { ascending: true });
  if (error) throw error;
  return (data as BenefitRow[]).map(mapBenefit);
}
