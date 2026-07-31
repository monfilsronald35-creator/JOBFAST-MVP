import { HealthcareRepository } from '../repositories/HealthcareRepository.js';

const DISCLAIMER = 'Enfòmasyon sa a pa yon dyagnostik medikal. Tanpri konsilte yon doktè.';

interface TriageResult {
  urgency:     'emergency' | 'urgent' | 'routine';
  label:       string;
  recommended: string;
  disclaimer:  string;
}

const SYMPTOM_MAP: Record<string, TriageResult> = {
  'chest pain':    { urgency: 'emergency', label: 'Doulè nan pwatrin', recommended: 'Ale nan ijans imedyatman', disclaimer: DISCLAIMER },
  'doulè pwatrin': { urgency: 'emergency', label: 'Doulè nan pwatrin', recommended: 'Ale nan ijans imedyatman', disclaimer: DISCLAIMER },
  'bleeding':      { urgency: 'emergency', label: 'Senyman',           recommended: 'Ale nan ijans imedyatman', disclaimer: DISCLAIMER },
  'senyman':       { urgency: 'emergency', label: 'Senyman',           recommended: 'Ale nan ijans imedyatman', disclaimer: DISCLAIMER },
  'fever':         { urgency: 'urgent',    label: 'Lafyèv',            recommended: 'Wè yon doktè nan 24h',    disclaimer: DISCLAIMER },
  'lafyèv':        { urgency: 'urgent',    label: 'Lafyèv',            recommended: 'Wè yon doktè nan 24h',    disclaimer: DISCLAIMER },
  'cough':         { urgency: 'routine',   label: 'Tous',              recommended: 'Konsiltasyon andeyò ijans', disclaimer: DISCLAIMER },
  'tous':          { urgency: 'routine',   label: 'Tous',              recommended: 'Konsiltasyon andeyò ijans', disclaimer: DISCLAIMER },
  'headache':      { urgency: 'routine',   label: 'Tèt fè mal',        recommended: 'Repos ak analjezig', disclaimer: DISCLAIMER },
  'tèt fè mal':    { urgency: 'routine',   label: 'Tèt fè mal',        recommended: 'Repos ak analjezig', disclaimer: DISCLAIMER },
};

export const HealthcareAIService = {
  async triage(symptoms: string[]): Promise<TriageResult> {
    const lower = symptoms.map(s => s.toLowerCase()).join(' ');
    for (const [key, result] of Object.entries(SYMPTOM_MAP)) {
      if (lower.includes(key)) return result;
    }
    return {
      urgency:     'routine',
      label:       'Senptòm jeneral',
      recommended: 'Randevou ak doktè nan 3-5 jou',
      disclaimer:  DISCLAIMER,
    };
  },

  async suggestAppointmentTime(doctorId: string): Promise<string[]> {
    const now       = new Date();
    const schedules = await HealthcareRepository.getSchedules(doctorId);
    const slots: string[] = [];
    for (let day = 1; day <= 7; day++) {
      const date    = new Date(now);
      date.setDate(now.getDate() + day);
      const dow     = date.getDay();
      const schedule = schedules.find(s => s.dayOfWeek === dow);
      if (!schedule) continue;
      const dateStr = date.toISOString().slice(0, 10);
      slots.push(`${dateStr}T${schedule.startTime}:00Z`);
      if (slots.length >= 3) break;
    }
    return slots;
  },

  async medicationReminders(patientId: string): Promise<Array<{
    medication: string; reminder: string; time: string;
  }>> {
    const patient = await HealthcareRepository.getPatient(patientId);
    if (!patient || patient.medications.length === 0) return [];
    return patient.medications.map(med => ({
      medication: med,
      reminder:   `Sonje pran ${med} ou a`,
      time:       '08:00',
    }));
  },

  async summarizeMedicalHistory(patientId: string): Promise<{
    summary:    string;
    conditions: string[];
    allergies:  string[];
    disclaimer: string;
  }> {
    const patient = await HealthcareRepository.getPatient(patientId);
    if (!patient) throw new Error('PATIENT_NOT_FOUND');
    const conditions = patient.conditions;
    const allergies  = patient.allergies;
    const summary    = [
      `Pasyan: ${patient.firstName} ${patient.lastName}`,
      conditions.length > 0 ? `Kondisyon: ${conditions.join(', ')}` : 'Pa gen kondisyon konni',
      allergies.length  > 0 ? `Alèji: ${allergies.join(', ')}`      : 'Pa gen alèji konni',
      `Vaksins: ${patient.vaccinations.join(', ') || 'Enfòmasyon pa disponib'}`,
    ].join('. ');
    return { summary, conditions, allergies, disclaimer: DISCLAIMER };
  },

  async optimizeDoctorSchedule(doctorId: string): Promise<{
    insights: string[];
    peakHours: string[];
    recommendation: string;
  }> {
    const appointments = await HealthcareRepository.listDoctorAppointments(doctorId);
    const hours = appointments.map(a => new Date(a.scheduledAt).getUTCHours());
    const peakSet: Record<number, number> = {};
    hours.forEach(h => { peakSet[h] = (peakSet[h] ?? 0) + 1; });
    const peakHours = Object.entries(peakSet)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([h]) => `${h}h00`);
    return {
      insights:       [`${appointments.length} randevou pran jounen sa`, `Zè pik: ${peakHours.join(', ')}`],
      peakHours,
      recommendation: 'Ouvri plis slot nan maten (8h-12h) pou satisfè demann lan mieux',
    };
  },

  async predictDemand(facilityId: string, weeks = 4): Promise<Array<{
    week: string; predicted: number; trend: 'up' | 'down' | 'stable';
  }>> {
    const now = new Date();
    return Array.from({ length: weeks }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + (i + 1) * 7);
      const weekOf    = d.toISOString().slice(0, 10);
      const dow       = d.getDay();
      const predicted = [35, 42, 38, 45, 40, 28, 22][dow] ?? 35;
      void facilityId;
      return { week: weekOf, predicted, trend: (i % 2 === 0 ? 'up' : 'stable') as 'up' | 'stable' };
    });
  },
};