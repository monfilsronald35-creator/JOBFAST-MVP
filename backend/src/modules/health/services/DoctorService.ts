import { HealthcareRepository } from '../repositories/HealthcareRepository.js';
import type { Doctor, DoctorSchedule } from '../types/healthcare.types.js';

export const DoctorService = {
  async register(userId: string, input: {
    firstName: string; lastName: string; specialty: string; licenseNumber: string;
    country?: string; city?: string; phone?: string; email?: string;
    languages?: string[]; experience?: number; consultationFee?: number;
    currency?: string; facilityId?: string; telemedicineAvailable?: boolean;
  }): Promise<Doctor> {
    const row: Record<string, unknown> = {
      user_id:        userId,
      first_name:     input.firstName,
      last_name:      input.lastName,
      specialty:      input.specialty,
      license_number: input.licenseNumber,
      country:        input.country      ?? 'HT',
      city:           input.city         ?? '',
      phone:          input.phone        ?? '',
      languages:      input.languages    ?? ['ht', 'fr'],
      experience:     input.experience   ?? 0,
      consultation_fee: input.consultationFee ?? 0,
      currency:       input.currency     ?? 'HTG',
      telemedicine_available: input.telemedicineAvailable ?? false,
    };
    if (input.email)      row['email']       = input.email;
    if (input.facilityId) row['facility_id'] = input.facilityId;
    return HealthcareRepository.createDoctor(row);
  },

  async list(filter: { specialty?: string; city?: string; telemedicine?: boolean; facilityId?: string } = {}): Promise<Doctor[]> {
    return HealthcareRepository.listDoctors(filter);
  },

  async get(id: string): Promise<Doctor | null> {
    return HealthcareRepository.getDoctor(id);
  },

  async addSchedule(doctorId: string, input: {
    dayOfWeek: number; startTime?: string; endTime?: string; slotMinutes?: number;
  }): Promise<DoctorSchedule> {
    return HealthcareRepository.createSchedule({
      doctor_id:    doctorId,
      day_of_week:  input.dayOfWeek,
      start_time:   input.startTime   ?? '08:00',
      end_time:     input.endTime     ?? '17:00',
      slot_minutes: input.slotMinutes ?? 30,
    });
  },

  async getSchedule(doctorId: string): Promise<DoctorSchedule[]> {
    return HealthcareRepository.getSchedules(doctorId);
  },

  async checkAvailability(doctorId: string, scheduledAt: string): Promise<boolean> {
    const count = await HealthcareRepository.countDoctorAppointmentsInSlot(doctorId, scheduledAt);
    return count === 0;
  },
};