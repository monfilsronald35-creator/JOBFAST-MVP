import { HealthcareRepository } from '../repositories/HealthcareRepository.js';
import type { InsuranceClaim, InsurancePolicy } from '../types/healthcare.types.js';

const COVERAGE_RATES: Record<string, number> = {
  consultation:     0.80,
  lab:              0.70,
  medication:       0.60,
  hospitalization:  0.90,
  surgery:          0.85,
  emergency:        1.00,
};

export const InsuranceEngine = {
  async registerPolicy(input: {
    patientId: string; insurerId: string; policyNumber: string;
    coverageTypes?: string[]; maxAnnual?: number; currency?: string;
    startDate: string; endDate: string;
  }): Promise<InsurancePolicy> {
    return HealthcareRepository.createPolicy({
      patient_id:     input.patientId,
      insurer_id:     input.insurerId,
      policy_number:  input.policyNumber,
      coverage_types: input.coverageTypes ?? Object.keys(COVERAGE_RATES),
      max_annual:     input.maxAnnual     ?? 0,
      currency:       input.currency      ?? 'HTG',
      start_date:     input.startDate,
      end_date:       input.endDate,
    });
  },

  async verifyCoverage(patientId: string, claimType: InsuranceClaim['type']): Promise<{
    hasCoverage: boolean; coverageRate: number; policy?: InsurancePolicy;
  }> {
    const policy = await HealthcareRepository.getActivePolicy(patientId);
    if (!policy || !policy.coverageTypes.includes(claimType)) {
      return { hasCoverage: false, coverageRate: 0 };
    }
    return { hasCoverage: true, coverageRate: COVERAGE_RATES[claimType] ?? 0.7, policy };
  },

  async submitClaim(input: {
    patientId: string; insurerId: string; type: InsuranceClaim['type'];
    totalAmount: number; currency?: string; deductible?: number;
    facilityId?: string; appointmentId?: string; documents?: string[]; notes?: string;
  }): Promise<InsuranceClaim> {
    const rate        = COVERAGE_RATES[input.type] ?? 0.7;
    const deductible  = input.deductible ?? 0;
    const coveredBase = Math.max(0, input.totalAmount - deductible);
    const coveredAmount = Math.round(coveredBase * rate);
    const copayment   = input.totalAmount - coveredAmount - deductible;

    const row: Record<string, unknown> = {
      patient_id:     input.patientId,
      insurer_id:     input.insurerId,
      type:           input.type,
      total_amount:   input.totalAmount,
      covered_amount: coveredAmount,
      copayment:      Math.max(0, copayment),
      deductible:     deductible,
      currency:       input.currency ?? 'HTG',
      status:         'submitted',
      documents:      input.documents ?? [],
    };
    if (input.facilityId)   row['facility_id']    = input.facilityId;
    if (input.appointmentId)row['appointment_id'] = input.appointmentId;
    if (input.notes)        row['notes']          = input.notes;
    return HealthcareRepository.createClaim(row);
  },

  async approveClaim(id: string): Promise<void> {
    await HealthcareRepository.updateClaim(id, { status: 'approved' });
  },

  async rejectClaim(id: string, notes?: string): Promise<void> {
    const patch: Record<string, unknown> = { status: 'rejected' };
    if (notes) patch['notes'] = notes;
    await HealthcareRepository.updateClaim(id, patch);
  },

  async markPaid(id: string): Promise<void> {
    await HealthcareRepository.updateClaim(id, { status: 'paid' });
  },

  async listClaims(patientId: string): Promise<InsuranceClaim[]> {
    return HealthcareRepository.listClaims(patientId);
  },
};