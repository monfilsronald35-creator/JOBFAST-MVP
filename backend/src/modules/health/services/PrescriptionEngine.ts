import { HealthcareRepository } from '../repositories/HealthcareRepository.js';
import type { Prescription, PrescriptionItem } from '../types/healthcare.types.js';

const KNOWN_INTERACTIONS: Array<[string, string]> = [
  ['warfarin',   'aspirin'],
  ['metformin',  'alcohol'],
  ['lisinopril', 'potassium'],
  ['ssri',       'tramadol'],
];

function checkInteractions(medications: PrescriptionItem[]): string[] {
  const names = medications.map(m => m.name.toLowerCase());
  const alerts: string[] = [];
  for (const [a, b] of KNOWN_INTERACTIONS) {
    if (names.some(n => n.includes(a)) && names.some(n => n.includes(b))) {
      alerts.push(`Entèaksyon posib ant ${a} ak ${b} — verifye ak famasyen an`);
    }
  }
  return alerts;
}

function generatePrescriptionQR(prescriptionId: string, patientId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `JOBFAST-RX:${prescriptionId.slice(0, 8).toUpperCase()}-${patientId.slice(0, 6).toUpperCase()}-${ts}`;
}

function validUntilDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const PrescriptionEngine = {
  async create(input: {
    patientId: string; doctorId: string; diagnosis: string;
    medications: PrescriptionItem[]; notes?: string;
    pharmacyId?: string; validDays?: number;
  }): Promise<{ prescription: Prescription; interactionAlerts: string[] }> {
    const alerts = checkInteractions(input.medications);

    const row: Record<string, unknown> = {
      patient_id:   input.patientId,
      doctor_id:    input.doctorId,
      diagnosis:    input.diagnosis,
      medications:  input.medications,
      valid_until:  validUntilDate(input.validDays ?? 30),
      qr_code:      '',   // placeholder — updated below
      status:       'active',
    };
    if (input.notes)      row['notes']       = input.notes;
    if (input.pharmacyId) row['pharmacy_id'] = input.pharmacyId;

    const prescription = await HealthcareRepository.createPrescription(row);
    const qrCode = generatePrescriptionQR(prescription.id, input.patientId);
    await HealthcareRepository.updatePrescription(prescription.id, { qr_code: qrCode });
    prescription.qrCode = qrCode;

    return { prescription, interactionAlerts: alerts };
  },

  async renew(id: string): Promise<Prescription> {
    const rx = await HealthcareRepository.getPrescription(id);
    if (!rx) throw new Error('PRESCRIPTION_NOT_FOUND');
    if (rx.status !== 'active') throw new Error('CANNOT_RENEW');
    const newValidUntil = validUntilDate(30);
    await HealthcareRepository.updatePrescription(id, {
      valid_until:  newValidUntil,
      renewal_count: rx.renewalCount + 1,
    });
    return (await HealthcareRepository.getPrescription(id))!;
  },

  async dispense(id: string, pharmacyId: string): Promise<void> {
    await HealthcareRepository.updatePrescription(id, { status: 'dispensed', pharmacy_id: pharmacyId });
  },

  async cancel(id: string): Promise<void> {
    await HealthcareRepository.updatePrescription(id, { status: 'cancelled' });
  },

  async listForPatient(patientId: string): Promise<Prescription[]> {
    return HealthcareRepository.listPatientPrescriptions(patientId);
  },

  async get(id: string): Promise<Prescription | null> {
    return HealthcareRepository.getPrescription(id);
  },
};