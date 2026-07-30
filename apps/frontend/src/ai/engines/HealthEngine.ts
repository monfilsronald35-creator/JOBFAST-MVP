import type { HealthRecommendation, AppointmentSuggestion } from '../types';
import { AIGateway } from '../gateway/AIGateway';

// IMPORTANT: This engine provides appointment scheduling, hospital/doctor matching,
// and general wellness content ONLY. It does NOT diagnose medical conditions.
// All outputs must include a disclaimer when surfaced to users.

const NO_DIAGNOSIS_DISCLAIMER = 'Enfòmasyon sa a pa yon dyagnostik medikal. Tanpri konsilte yon doktè.';

export const HealthEngine = {
  async suggestAppointment(params: {
    userId: string; concern: string; urgency: 'routine' | 'soon' | 'urgent';
    location?: string; language?: string;
  }): Promise<AppointmentSuggestion> {
    // Never use AI to diagnose — only to route to the right care
    try {
      const res = await fetch('/api/ai/health/appointment-suggest', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      });
      if (res.ok) return res.json() as Promise<AppointmentSuggestion>;
    } catch { /* fallback */ }

    return {
      speciality:  'general_practitioner',
      urgency:     params.urgency,
      reason:      'Konsiltasyon jeneral',
      disclaimer:  NO_DIAGNOSIS_DISCLAIMER,
      scheduleSoon: params.urgency !== 'routine',
    };
  },

  async findDoctors(params: {
    speciality: string; location: string; language?: string; insurance?: string;
  }): Promise<HealthRecommendation[]> {
    try {
      const res = await fetch('/api/ai/health/find-doctors', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      });
      if (res.ok) return res.json() as Promise<HealthRecommendation[]>;
    } catch { /* */ }
    return [];
  },

  async findHospitals(params: {
    location: string; type?: string; emergency?: boolean;
  }): Promise<HealthRecommendation[]> {
    try {
      const res = await fetch('/api/ai/health/find-hospitals', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      });
      if (res.ok) return res.json() as Promise<HealthRecommendation[]>;
    } catch { /* */ }
    return [];
  },

  async getWellnessContent(topic: string, language = 'ht'): Promise<{ title: string; content: string; disclaimer: string }> {
    const langInstruction = language === 'ht'
      ? 'Ekri an Kreyòl Ayisyen pou yon piblik jeneral.'
      : language === 'fr' ? 'Rédigez en français pour un public général.' : 'Write in plain English for a general audience.';

    const content = await AIGateway.complete(
      `${langInstruction}\n\nWrite a brief, factual wellness article about: ${topic}\n\nIMPORTANT: Focus on general wellness information only. Do NOT provide medical diagnoses, prescriptions, or specific medical advice. Keep it under 200 words.`,
      { strategy: 'best_quality', temperature: 0.3, maxTokens: 300 },
    ).catch(() => '');

    return {
      title:      topic,
      content,
      disclaimer: NO_DIAGNOSIS_DISCLAIMER,
    };
  },

  async getHealthFacilityDetails(facilityId: string): Promise<HealthRecommendation | null> {
    try {
      const res = await fetch(`/api/health/facilities/${facilityId}`);
      if (res.ok) return res.json() as Promise<HealthRecommendation>;
    } catch { /* */ }
    return null;
  },
};