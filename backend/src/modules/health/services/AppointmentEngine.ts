import { HealthcareRepository } from '../repositories/HealthcareRepository.js';
import { DoctorService }         from './DoctorService.js';
import type { Appointment } from '../types/healthcare.types.js';

export const AppointmentEngine = {
  async book(input: {
    patientId: string; doctorId: string; scheduledAt: string;
    type?: Appointment['type']; reason?: string;
    facilityId?: string; duration?: number;
    fee?: number; currency?: string;
  }): Promise<Appointment> {
    const available = await DoctorService.checkAvailability(input.doctorId, input.scheduledAt);
    if (!available) throw new Error('SLOT_TAKEN');

    const doctor = await HealthcareRepository.getDoctor(input.doctorId);
    const row: Record<string, unknown> = {
      patient_id:   input.patientId,
      doctor_id:    input.doctorId,
      scheduled_at: input.scheduledAt,
      type:         input.type       ?? 'online',
      reason:       input.reason     ?? '',
      duration:     input.duration   ?? 30,
      fee:          input.fee        ?? (doctor?.consultationFee ?? 0),
      currency:     input.currency   ?? (doctor?.currency ?? 'HTG'),
    };
    if (input.facilityId) row['facility_id'] = input.facilityId;
    return HealthcareRepository.createAppointment(row);
  },

  async bookWalkIn(doctorId: string, patientId: string, facilityId: string): Promise<Appointment> {
    const existing = await HealthcareRepository.listDoctorAppointments(doctorId);
    const pending  = existing.filter(a => a.status === 'arrived' || a.status === 'pending');
    const queue    = pending.length + 1;
    const now      = new Date();
    now.setMinutes(now.getMinutes() + queue * 30);

    const doctor = await HealthcareRepository.getDoctor(doctorId);
    return HealthcareRepository.createAppointment({
      patient_id:   patientId,
      doctor_id:    doctorId,
      facility_id:  facilityId,
      type:         'walk_in',
      scheduled_at: now.toISOString(),
      duration:     30,
      reason:       'Walk-in',
      queue_number: queue,
      fee:          doctor?.consultationFee ?? 0,
      currency:     doctor?.currency ?? 'HTG',
    });
  },

  async confirm(id: string): Promise<void> {
    await HealthcareRepository.updateAppointment(id, { status: 'confirmed' });
  },

  async arrive(id: string): Promise<void> {
    await HealthcareRepository.updateAppointment(id, { status: 'arrived' });
  },

  async start(id: string): Promise<void> {
    await HealthcareRepository.updateAppointment(id, { status: 'in_progress' });
  },

  async complete(id: string, notes?: string): Promise<void> {
    const patch: Record<string, unknown> = { status: 'completed' };
    if (notes) patch['notes'] = notes;
    await HealthcareRepository.updateAppointment(id, patch);
  },

  async cancel(id: string): Promise<void> {
    await HealthcareRepository.updateAppointment(id, { status: 'cancelled' });
  },

  async markPaid(id: string): Promise<void> {
    await HealthcareRepository.updateAppointment(id, { is_paid: true });
  },

  async listPatient(patientId: string): Promise<Appointment[]> {
    return HealthcareRepository.listPatientAppointments(patientId);
  },

  async listDoctor(doctorId: string, date?: string): Promise<Appointment[]> {
    return HealthcareRepository.listDoctorAppointments(doctorId, date);
  },

  async get(id: string): Promise<Appointment | null> {
    return HealthcareRepository.getAppointment(id);
  },

  async markReminderSent(id: string): Promise<void> {
    await HealthcareRepository.updateAppointment(id, { reminder_sent: true });
  },
};