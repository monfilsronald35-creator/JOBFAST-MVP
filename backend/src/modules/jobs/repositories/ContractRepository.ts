import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import {
  ContractType, ContractStatus, PayrollStatus,
  type JobContract, type WorkShift, type AttendanceRecord, type PayrollRecord,
} from '../types/contract.types.js';

function toShift(r: Record<string, unknown>): WorkShift {
  const base: WorkShift = {
    id:         r['id'] as string,
    contractId: r['contract_id'] as string,
    workerId:   r['worker_id'] as string,
    shiftDate:  r['shift_date'] as string,
    startTime:  r['start_time'] as string,
    endTime:    r['end_time'] as string,
    breakMins:  r['break_mins'] as number,
    status:     r['status'] as WorkShift['status'],
    createdAt:  r['created_at'] as string,
  };
  if (r['notes']) (base as unknown as Record<string, unknown>)['notes'] = r['notes'];
  return base;
}

function toContract(r: Record<string, unknown>): JobContract {
  const base: JobContract = {
    id:           r['id'] as string,
    jobId:        (r['posting_id'] ?? r['job_id']) as string,
    employerId:   r['employer_id'] as string,
    workerId:     r['worker_id'] as string,
    type:         r['type'] as ContractType,
    salaryAmount: r['salary_amount'] as number,
    currency:     r['currency'] as string,
    startDate:    r['start_date'] as string,
    status:       r['status'] as ContractStatus,
    createdAt:    r['created_at'] as string,
    updatedAt:    r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['title'])              b['title']             = r['title'];
  if (r['terms'])              b['terms']             = r['terms'];
  if (r['end_date'])           b['endDate']           = r['end_date'];
  if (r['employer_signed_at']) b['employerSignedAt']  = r['employer_signed_at'];
  if (r['worker_signed_at'])   b['workerSignedAt']    = r['worker_signed_at'];
  if (r['terminated_at'])      b['terminatedAt']      = r['terminated_at'];
  if (r['termination_reason']) b['terminationReason'] = r['termination_reason'];
  return base;
}

export const ContractRepository = {
  async create(data: Omit<JobContract, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<JobContract> {
    const row: Record<string, unknown> = {
      job_id:        data.jobId,
      employer_id:   data.employerId,
      worker_id:     data.workerId,
      type:          data.type,
      salary_amount: data.salaryAmount,
      currency:      data.currency,
      start_date:    data.startDate,
    };
    if (data.title   !== undefined) row['title']    = data.title;
    if (data.terms   !== undefined) row['terms']    = data.terms;
    if (data.endDate !== undefined) row['end_date'] = data.endDate;

    const { data: saved, error } = await db.client()
      .from('job_contracts').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create contract', 500, 'DB_ERROR');
    return toContract(saved);
  },

  async findById(id: string): Promise<JobContract | null> {
    const { data, error } = await db.client()
      .from('job_contracts').select('*').eq('id', id).single<Record<string, unknown>>();
    if (error?.code === 'PGRST116') return null;
    if (error) throw new AppError('Failed to load contract', 500, 'DB_ERROR');
    return data ? toContract(data) : null;
  },

  async listByWorker(workerId: string): Promise<JobContract[]> {
    const { data, error } = await db.client()
      .from('job_contracts').select('*').eq('worker_id', workerId)
      .order('created_at', { ascending: false }).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list contracts', 500, 'DB_ERROR');
    return (data ?? []).map(toContract);
  },

  async listByEmployer(employerId: string): Promise<JobContract[]> {
    const { data, error } = await db.client()
      .from('job_contracts').select('*').eq('employer_id', employerId)
      .order('created_at', { ascending: false }).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list contracts', 500, 'DB_ERROR');
    return (data ?? []).map(toContract);
  },

  async sign(id: string, role: 'employer' | 'worker'): Promise<JobContract> {
    const field = role === 'employer' ? 'employer_signed_at' : 'worker_signed_at';
    const now   = new Date().toISOString();
    const contract = await ContractRepository.findById(id);
    if (!contract) throw new AppError('Contract not found', 404, 'NOT_FOUND');

    const row: Record<string, unknown> = { [field]: now, updated_at: now };
    const otherSigned = role === 'employer' ? contract.workerSignedAt : contract.employerSignedAt;
    if (otherSigned) row['status'] = ContractStatus.Active;

    const { data, error } = await db.client()
      .from('job_contracts').update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to sign contract', 500, 'DB_ERROR');
    return toContract(data);
  },

  async terminate(id: string, reason: string): Promise<JobContract> {
    const now = new Date().toISOString();
    const { data, error } = await db.client()
      .from('job_contracts')
      .update({ status: ContractStatus.Terminated, terminated_at: now, termination_reason: reason, updated_at: now })
      .eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to terminate contract', 500, 'DB_ERROR');
    return toContract(data);
  },

  // ——— Schedules ————————————————————————————————————————————————————————
  async addShift(data: Omit<WorkShift, 'id' | 'status' | 'createdAt'>): Promise<WorkShift> {
    const row: Record<string, unknown> = {
      contract_id: data.contractId,
      worker_id:   data.workerId,
      shift_date:  data.shiftDate,
      start_time:  data.startTime,
      end_time:    data.endTime,
      break_mins:  data.breakMins,
    };
    if (data.notes !== undefined) row['notes'] = data.notes;
    const { data: saved, error } = await db.client()
      .from('job_schedules').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to add shift', 500, 'DB_ERROR');
    return toShift(saved);
  },

  async listShifts(contractId: string): Promise<WorkShift[]> {
    const { data, error } = await db.client()
      .from('job_schedules').select('*').eq('contract_id', contractId)
      .order('shift_date', { ascending: true }).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list shifts', 500, 'DB_ERROR');
    return (data ?? []).map(toShift);
  },

  // ——— Attendance ————————————————————————————————————————————————————————
  async clockIn(contractId: string, workerId: string, opts: { scheduleId?: string; lat?: number; lng?: number } = {}): Promise<AttendanceRecord> {
    const row: Record<string, unknown> = {
      contract_id: contractId,
      worker_id:   workerId,
      clock_in:    new Date().toISOString(),
    };
    if (opts.scheduleId !== undefined) row['schedule_id'] = opts.scheduleId;
    if (opts.lat        !== undefined) row['lat']         = opts.lat;
    if (opts.lng        !== undefined) row['lng']         = opts.lng;
    const { data, error } = await db.client()
      .from('job_attendance').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to clock in', 500, 'DB_ERROR');
    return toAttendance(data);
  },

  async clockOut(id: string, lat?: number, lng?: number): Promise<AttendanceRecord> {
    const clockOut = new Date().toISOString();
    const row: Record<string, unknown> = { clock_out: clockOut };
    if (lat !== undefined) row['lat'] = lat;
    if (lng !== undefined) row['lng'] = lng;
    const { data, error } = await db.client()
      .from('job_attendance').update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to clock out', 500, 'DB_ERROR');
    return toAttendance(data);
  },

  // ——— Payroll ——————————————————————————————————————————————————————————
  async createPayroll(data: Omit<PayrollRecord, 'id' | 'status' | 'paidAt' | 'paymentRef' | 'createdAt'>): Promise<PayrollRecord> {
    const { data: saved, error } = await db.client().from('job_payroll').insert({
      contract_id:  data.contractId,
      employer_id:  data.employerId,
      worker_id:    data.workerId,
      period_start: data.periodStart,
      period_end:   data.periodEnd,
      gross_amount: data.grossAmount,
      tax_amount:   data.taxAmount,
      bonus_amount: data.bonusAmount,
      net_amount:   data.netAmount,
      currency:     data.currency,
    }).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create payroll', 500, 'DB_ERROR');
    return toPayroll(saved);
  },

  async updatePayrollStatus(id: string, status: PayrollStatus, paymentRef?: string): Promise<PayrollRecord> {
    const row: Record<string, unknown> = { status };
    if (status === PayrollStatus.Paid) row['paid_at'] = new Date().toISOString();
    if (paymentRef !== undefined) row['payment_ref'] = paymentRef;
    const { data, error } = await db.client()
      .from('job_payroll').update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update payroll', 500, 'DB_ERROR');
    return toPayroll(data);
  },

  async listPayrollByWorker(workerId: string): Promise<PayrollRecord[]> {
    const { data, error } = await db.client()
      .from('job_payroll').select('*').eq('worker_id', workerId)
      .order('period_start', { ascending: false }).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list payroll', 500, 'DB_ERROR');
    return (data ?? []).map(toPayroll);
  },
};

function toAttendance(r: Record<string, unknown>): AttendanceRecord {
  const base: AttendanceRecord = {
    id:         r['id'] as string,
    contractId: r['contract_id'] as string,
    workerId:   r['worker_id'] as string,
    clockIn:    r['clock_in'] as string,
    status:     r['status'] as AttendanceRecord['status'],
    createdAt:  r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['schedule_id'])  b['scheduleId']  = r['schedule_id'];
  if (r['clock_out'])    b['clockOut']    = r['clock_out'];
  if (r['hours_worked']) b['hoursWorked'] = r['hours_worked'];
  if (r['lat'])          b['lat']         = r['lat'];
  if (r['lng'])          b['lng']         = r['lng'];
  if (r['notes'])        b['notes']       = r['notes'];
  return base;
}

function toPayroll(r: Record<string, unknown>): PayrollRecord {
  const base: PayrollRecord = {
    id:          r['id'] as string,
    contractId:  r['contract_id'] as string,
    employerId:  r['employer_id'] as string,
    workerId:    r['worker_id'] as string,
    periodStart: r['period_start'] as string,
    periodEnd:   r['period_end'] as string,
    grossAmount: r['gross_amount'] as number,
    taxAmount:   r['tax_amount'] as number,
    bonusAmount: r['bonus_amount'] as number,
    netAmount:   r['net_amount'] as number,
    currency:    r['currency'] as string,
    status:      r['status'] as PayrollStatus,
    createdAt:   r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['paid_at'])    b['paidAt']    = r['paid_at'];
  if (r['payment_ref']) b['paymentRef'] = r['payment_ref'];
  return base;
}
