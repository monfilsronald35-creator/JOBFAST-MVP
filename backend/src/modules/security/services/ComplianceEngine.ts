import { db } from '../../../core/database/SupabaseClient.js';

// Supported consent types aligned to GDPR/CCPA/Haiti data law
export type ConsentType =
  | 'analytics' | 'marketing' | 'third_party' | 'biometric'
  | 'medical_data' | 'government_data' | 'location';

// Data retention policies in days per category
const RETENTION_DAYS: Record<string, number> = {
  audit_log:          365 * 7,  // 7 years (financial compliance)
  chat_messages:      365 * 2,  // 2 years
  analytics_events:   365 * 1,  // 1 year
  medical_records:    365 * 10, // 10 years (Haiti medical law)
  government_docs:    365 * 7,  // 7 years
  payment_records:    365 * 7,  // 7 years (financial)
  session_data:       90,       // 90 days
  device_data:        365 * 2,  // 2 years
};

export const ComplianceEngine = {
  async grantConsent(userId: string, consentType: ConsentType, ip: string, userAgent: string): Promise<void> {
    await db.client().from('sec_consent_records').insert({
      user_id: userId, consent_type: consentType, granted: true, ip, user_agent: userAgent,
      expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
    });
  },

  async revokeConsent(userId: string, consentType: ConsentType): Promise<void> {
    await db.client().from('sec_consent_records').update({ revoked_at: new Date().toISOString(), granted: false })
      .eq('user_id', userId).eq('consent_type', consentType).is('revoked_at', null);
  },

  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    const { data } = await db.client().from('sec_consent_records').select('granted, revoked_at, expires_at')
      .eq('user_id', userId).eq('consent_type', consentType).is('revoked_at', null)
      .gte('expires_at', new Date().toISOString()).order('granted_at', { ascending: false }).limit(1).single();
    if (!data) return false;
    return Boolean((data as Record<string, unknown>)['granted']);
  },

  async getConsentRecord(userId: string): Promise<Record<ConsentType, boolean>> {
    const { data } = await db.client().from('sec_consent_records').select('consent_type, granted, revoked_at')
      .eq('user_id', userId).is('revoked_at', null);
    const result = {} as Record<ConsentType, boolean>;
    ((data ?? []) as { consent_type: string; granted: boolean }[]).forEach(r => {
      result[r.consent_type as ConsentType] = r.granted;
    });
    return result;
  },

  getRetentionPolicy(category: string): { days: number; description: string } {
    const days = RETENTION_DAYS[category] ?? 365;
    return { days, description: `${category}: ${days} jou (${Math.round(days / 365)} an)` };
  },

  // Data erasure — GDPR right to be forgotten
  async requestErasure(userId: string): Promise<{ scheduledFor: string; tables: string[] }> {
    const scheduledFor = new Date(Date.now() + 30 * 86400000).toISOString(); // 30-day cooling off
    const tables = ['anlt_events', 'anlt_sessions', 'sec_devices', 'sec_consent_records', 'chat_messages'];
    // Log the erasure request — actual deletion runs in a scheduled job
    await db.client().from('sec_audit_log').insert({
      user_id: userId, action: 'compliance.erasure_requested', result: 'success',
      ip: '', country: '', device_id: '', user_agent: '', risk_score: 0,
      metadata: { scheduledFor, tables }, created_at: new Date().toISOString(),
    });
    return { scheduledFor, tables };
  },

  getRegionalConfig(country: string): { gdpr: boolean; ccpa: boolean; consentRequired: string[]; retentionMultiplier: number } {
    const EU = ['FR', 'DE', 'ES', 'IT', 'PT', 'BE', 'NL', 'AT', 'PL', 'SE', 'DK', 'FI', 'IE'];
    const isEU = EU.includes(country);
    const isUS = country === 'US';
    return {
      gdpr:               isEU,
      ccpa:               isUS && true,
      consentRequired:    isEU ? ['analytics', 'marketing', 'third_party'] : ['marketing'],
      retentionMultiplier: isEU ? 1.0 : 1.2,
    };
  },
};