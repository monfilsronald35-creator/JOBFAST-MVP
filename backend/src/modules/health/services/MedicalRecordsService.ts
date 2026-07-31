import { HealthcareRepository } from '../repositories/HealthcareRepository.js';
import type { MedicalRecord } from '../types/healthcare.types.js';

export const MedicalRecordsService = {
  async create(input: {
    patientId: string; doctorId: string; type?: MedicalRecord['type'];
    title: string; content: string;
    facilityId?: string; attachments?: string[]; isConfidential?: boolean;
  }): Promise<MedicalRecord> {
    const row: Record<string, unknown> = {
      patient_id:      input.patientId,
      doctor_id:       input.doctorId,
      type:            input.type           ?? 'consultation',
      title:           input.title,
      content:         input.content,
      attachments:     input.attachments    ?? [],
      is_confidential: input.isConfidential ?? false,
    };
    if (input.facilityId) row['facility_id'] = input.facilityId;
    return HealthcareRepository.createRecord(row);
  },

  async listForPatient(patientId: string, type?: string): Promise<MedicalRecord[]> {
    return HealthcareRepository.listPatientRecords(patientId, type);
  },

  async summarize(patientId: string): Promise<{
    totalRecords: number; lastConsultation?: string; conditions: string[]; allergies: string[];
  }> {
    const [records, patient] = await Promise.all([
      HealthcareRepository.listPatientRecords(patientId),
      HealthcareRepository.getPatient(patientId),
    ]);
    const lastConsult = records.find(r => r.type === 'consultation');
    return {
      totalRecords:      records.length,
      lastConsultation:  lastConsult?.createdAt,
      conditions:        patient?.conditions ?? [],
      allergies:         patient?.allergies  ?? [],
    };
  },
};