import { HealthcareRepository } from '../repositories/HealthcareRepository.js';
import type { EmergencyRequest } from '../types/healthcare.types.js';

export const EmergencyService = {
  async request(userId: string, input: {
    lat: number; lng: number; description: string;
    severity?: EmergencyRequest['severity'];
    address?: string; patientId?: string;
  }): Promise<EmergencyRequest> {
    const row: Record<string, unknown> = {
      user_id:     userId,
      lat:         input.lat,
      lng:         input.lng,
      description: input.description,
      severity:    input.severity ?? 'high',
    };
    if (input.address)   row['address']    = input.address;
    if (input.patientId) row['patient_id'] = input.patientId;

    const emergency = await HealthcareRepository.createEmergency(row);

    // Auto-dispatch: find nearest hospital and set dispatched
    const hospitals = await HealthcareRepository.getNearbyFacilities(input.lat, input.lng, 'hospital');
    const nearest   = hospitals[0];
    if (nearest) {
      await HealthcareRepository.updateEmergency(emergency.id, {
        hospital_id:   nearest.id,
        status:        'dispatched',
        dispatched_at: new Date().toISOString(),
      });
      emergency.hospitalId   = nearest.id;
      emergency.status       = 'dispatched';
      emergency.dispatchedAt = new Date().toISOString();
    }

    return emergency;
  },

  async updateStatus(id: string, status: EmergencyRequest['status']): Promise<void> {
    const patch: Record<string, unknown> = { status };
    if (status === 'resolved') patch['resolved_at'] = new Date().toISOString();
    await HealthcareRepository.updateEmergency(id, patch);
  },

  async assignAmbulance(id: string, ambulanceId: string): Promise<void> {
    await HealthcareRepository.updateEmergency(id, {
      ambulance_id: ambulanceId,
      status:       'on_way',
    });
  },

  async listActive(): Promise<EmergencyRequest[]> {
    return HealthcareRepository.listActiveEmergencies();
  },

  getSeverityLabel(severity: EmergencyRequest['severity']): string {
    const labels: Record<string, string> = {
      critical: 'KRITIK — Ijans imedya',
      high:     'ELVE — Mande atansyon rapid',
      medium:   'MWAYEN — Konsiltasyon rekòmande',
      low:      'BA — Kontakte doktè nan 24h',
    };
    return labels[severity] ?? severity;
  },
};