import { GovernmentRepository } from '../repositories/GovernmentRepository.js';
import { TypedEventBus }        from '../../../core/events/TypedEventBus.js';
import type { GovAppointment } from '../types/government.types.js';

const MAX_PER_SLOT = 5; // max concurrent appointments per 30-min slot per agency

function confirmCode(): string {
  return `GOV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export const AppointmentEngine = {
  async book(citizenId: string, agencyId: string, serviceType: string, scheduledAt: string, officeAddress?: string, notes?: string): Promise<GovAppointment> {
    // Check slot availability
    const slotCount = await GovernmentRepository.countAgencyAppointmentsInSlot(agencyId, scheduledAt);
    if (slotCount >= MAX_PER_SLOT) {
      throw Object.assign(new Error('Slot sa a plen. Chwazi yon lòt lè.'), { code: 'SLOT_FULL' });
    }

    const appt = await GovernmentRepository.createAppointment({
      citizenId, agencyId, serviceType, status: 'scheduled',
      scheduledAt, confirmCode: confirmCode(),
      ...(officeAddress && { officeAddress }),
      ...(notes && { notes }),
    });

    TypedEventBus.publish({ eventName: 'gov.appointment.booked', payload: { appointmentId: appt.id, citizenId, agencyId, scheduledAt } });
    return appt;
  },

  async confirm(appointmentId: string): Promise<void> {
    await GovernmentRepository.updateAppointmentStatus(appointmentId, 'confirmed');
  },

  async complete(appointmentId: string): Promise<void> {
    await GovernmentRepository.updateAppointmentStatus(appointmentId, 'completed');
    TypedEventBus.publish({ eventName: 'gov.appointment.completed', payload: { appointmentId } });
  },

  async cancel(appointmentId: string, citizenId: string): Promise<void> {
    const appts = await GovernmentRepository.listCitizenAppointments(citizenId);
    const appt  = appts.find(a => a.id === appointmentId);
    if (!appt) throw new Error('Randevou pa jwenn');
    await GovernmentRepository.updateAppointmentStatus(appointmentId, 'cancelled');
    TypedEventBus.publish({ eventName: 'gov.appointment.cancelled', payload: { appointmentId, citizenId } });
  },

  async listCitizenAppointments(citizenId: string): Promise<GovAppointment[]> {
    return GovernmentRepository.listCitizenAppointments(citizenId);
  },
};