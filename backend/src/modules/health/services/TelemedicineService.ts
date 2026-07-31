import { randomUUID } from 'crypto';
import { HealthcareRepository } from '../repositories/HealthcareRepository.js';
import type { TelemedicineSession } from '../types/healthcare.types.js';

function generateRoomToken(sessionId: string, doctorId: string, patientId: string): string {
  return `TELE-${sessionId.slice(0, 8).toUpperCase()}-${doctorId.slice(0, 4).toUpperCase()}-${patientId.slice(0, 4).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

export const TelemedicineService = {
  async createSession(input: {
    appointmentId: string; patientId: string; doctorId: string;
    mode?: TelemedicineSession['mode'];
  }): Promise<TelemedicineSession> {
    const sessionId = randomUUID();
    const token     = generateRoomToken(sessionId, input.doctorId, input.patientId);
    return HealthcareRepository.createSession({
      id:             sessionId,
      appointment_id: input.appointmentId,
      patient_id:     input.patientId,
      doctor_id:      input.doctorId,
      mode:           input.mode ?? 'video',
      room_token:     token,
    });
  },

  async start(sessionId: string): Promise<{ roomToken: string }> {
    const session = await HealthcareRepository.getSession(sessionId);
    if (!session) throw new Error('SESSION_NOT_FOUND');
    await HealthcareRepository.updateSession(sessionId, {
      status:     'active',
      started_at: new Date().toISOString(),
    });
    return { roomToken: session.roomToken ?? '' };
  },

  async end(sessionId: string, notes?: string): Promise<void> {
    const session = await HealthcareRepository.getSession(sessionId);
    if (!session) return;
    const endedAt  = new Date().toISOString();
    const startedMs = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const duration  = Math.round((Date.now() - startedMs) / 60000);
    const patch: Record<string, unknown> = { status: 'completed', ended_at: endedAt, duration };
    if (notes) patch['notes'] = notes;
    await HealthcareRepository.updateSession(sessionId, patch);
  },

  async scheduleFollowUp(sessionId: string, followUpAt: string): Promise<void> {
    await HealthcareRepository.updateSession(sessionId, { follow_up_at: followUpAt });
  },

  async get(sessionId: string): Promise<TelemedicineSession | null> {
    return HealthcareRepository.getSession(sessionId);
  },
};