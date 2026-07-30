import { ContractRepository } from '../repositories/ContractRepository.js';
import { AppError } from '../../../core/errors/AppError.js';
import {
  ContractType, ContractStatus, PayrollStatus,
  type JobContract, type WorkShift, type AttendanceRecord, type PayrollRecord,
} from '../types/contract.types.js';

export const ContractService = {
  async create(data: {
    jobId:        string;
    employerId:   string;
    workerId:     string;
    type:         ContractType;
    salaryAmount: number;
    currency:     string;
    startDate:    string;
    title?:       string;
    terms?:       string;
    endDate?:     string;
  }): Promise<JobContract> {
    const input: Parameters<typeof ContractRepository.create>[0] = {
      jobId:        data.jobId,
      employerId:   data.employerId,
      workerId:     data.workerId,
      type:         data.type,
      salaryAmount: data.salaryAmount,
      currency:     data.currency,
      startDate:    data.startDate,
    };
    if (data.title)   input.title   = data.title;
    if (data.terms)   input.terms   = data.terms;
    if (data.endDate) input.endDate = data.endDate;
    return ContractRepository.create(input);
  },

  async getById(id: string): Promise<JobContract> {
    const c = await ContractRepository.findById(id);
    if (!c) throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
    return c;
  },

  async sign(id: string, userId: string): Promise<JobContract> {
    const contract = await ContractService.getById(id);
    if (contract.status === ContractStatus.Terminated) {
      throw new AppError('Contract is terminated', 400, 'CONTRACT_TERMINATED');
    }
    const role = contract.employerId === userId ? 'employer'
               : contract.workerId   === userId ? 'worker'
               : null;
    if (!role) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return ContractRepository.sign(id, role);
  },

  async terminate(id: string, employerId: string, reason: string): Promise<JobContract> {
    const contract = await ContractService.getById(id);
    if (contract.employerId !== employerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    if (!([ContractStatus.Active] as ContractStatus[]).includes(contract.status)) {
      throw new AppError('Only active contracts can be terminated', 400, 'INVALID_STATUS');
    }
    return ContractRepository.terminate(id, reason);
  },

  async listByWorker(workerId: string): Promise<JobContract[]> {
    return ContractRepository.listByWorker(workerId);
  },

  async listByEmployer(employerId: string): Promise<JobContract[]> {
    return ContractRepository.listByEmployer(employerId);
  },

  // ——— Schedules ————————————————————————————————————————————————————————
  async addShift(contractId: string, employerId: string, shift: Omit<WorkShift, 'id' | 'contractId' | 'status' | 'createdAt'>): Promise<WorkShift> {
    const contract = await ContractService.getById(contractId);
    if (contract.employerId !== employerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return ContractRepository.addShift({ contractId, ...shift });
  },

  async listShifts(contractId: string): Promise<WorkShift[]> {
    return ContractRepository.listShifts(contractId);
  },

  // ——— Attendance ————————————————————————————————————————————————————————
  async clockIn(contractId: string, workerId: string, opts: { scheduleId?: string; lat?: number; lng?: number } = {}): Promise<AttendanceRecord> {
    const contract = await ContractService.getById(contractId);
    if (contract.workerId !== workerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return ContractRepository.clockIn(contractId, workerId, opts);
  },

  async clockOut(attendanceId: string, workerId: string, lat?: number, lng?: number): Promise<AttendanceRecord> {
    return ContractRepository.clockOut(attendanceId, lat, lng);
  },

  // ——— Payroll ——————————————————————————————————————————————————————————
  async createPayroll(employerId: string, data: Omit<PayrollRecord, 'id' | 'status' | 'paidAt' | 'paymentRef' | 'createdAt'>): Promise<PayrollRecord> {
    const contract = await ContractService.getById(data.contractId);
    if (contract.employerId !== employerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return ContractRepository.createPayroll(data);
  },

  async approvePayroll(id: string, employerId: string): Promise<PayrollRecord> {
    return ContractRepository.updatePayrollStatus(id, PayrollStatus.Approved);
  },

  async markPayrollPaid(id: string, paymentRef: string): Promise<PayrollRecord> {
    return ContractRepository.updatePayrollStatus(id, PayrollStatus.Paid, paymentRef);
  },

  async getPayslips(workerId: string): Promise<PayrollRecord[]> {
    return ContractRepository.listPayrollByWorker(workerId);
  },
};
