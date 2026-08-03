import { db }                 from '../../../core/database/SupabaseClient.js';
import { AuditEngine }        from './AuditEngine.js';
import type { FraudSignal, RiskScore } from '../types/security.types.js';

export const FraudEngine = {
  async scoreUser(userId: string): Promise<{ score: RiskScore; signals: FraudSignal[] }> {
    const signals: FraudSignal[] = [];
    let totalScore = 0;

    // 1. Failed login attempts in last 24h
    const failedLogins = await AuditEngine.countUserActions(userId, 'auth.failed', 1440);
    if (failedLogins >= 5)  { signals.push({ type: 'multiple_failed_logins', score: 20, evidence: `${failedLogins} echèk nan 24h` }); totalScore += 20; }
    if (failedLogins >= 15) { signals.push({ type: 'excessive_failed_logins', score: 30, evidence: `${failedLogins} echèk — pèsekisyon pwobab` }); totalScore += 30; }

    // 2. Payments count in last hour (mass payments)
    const recentPayments = await AuditEngine.countUserActions(userId, 'payment.initiated', 60);
    if (recentPayments >= 10) { signals.push({ type: 'mass_payments', score: 40, evidence: `${recentPayments} peman nan 1h` }); totalScore += 40; }

    // 3. Account age (accounts < 1 day have higher risk)
    const { data: profile } = await db.client().from('profiles').select('created_at, is_verified').eq('id', userId).single();
    if (profile) {
      const p = profile as Record<string, unknown>;
      const ageMs = Date.now() - new Date(String(p['created_at'])).getTime();
      if (ageMs < 86400000) { signals.push({ type: 'new_account', score: 15, evidence: 'Kont kreye mwens pase 24h' }); totalScore += 15; }
      if (!p['is_verified']) { signals.push({ type: 'unverified_account', score: 10, evidence: 'Kont pa verifye' }); totalScore += 10; }
    }

    // 4. Recent documents flagged
    const flaggedDocs = await AuditEngine.countUserActions(userId, 'document.upload', 60);
    if (flaggedDocs >= 20) { signals.push({ type: 'mass_uploads', score: 25, evidence: `${flaggedDocs} dokiman nan 1h` }); totalScore += 25; }

    return { score: Math.min(100, totalScore), signals };
  },

  async scorePayment(amount: number, userId: string, ip: string): Promise<RiskScore> {
    let score = 0;

    // High amount threshold (1,000,000 HTG = ~10,000 HTG minor units)
    if (amount > 100_000_00) score += 30; // >1M HTG
    else if (amount > 10_000_00) score += 15; // >100K HTG

    // Multiple payments from same IP in short window
    const { count } = await db.client().from('sec_audit_log').select('*', { count: 'exact', head: true })
      .eq('ip', ip).eq('action', 'payment.initiated').gte('created_at', new Date(Date.now() - 3600000).toISOString());
    if ((count ?? 0) >= 5) score += 25;

    // New account bonus
    const { data } = await db.client().from('profiles').select('created_at').eq('id', userId).single();
    if (data) {
      const ageMs = Date.now() - new Date(String((data as Record<string, unknown>)['created_at'])).getTime();
      if (ageMs < 86400000) score += 20;
    }

    return Math.min(100, score) as RiskScore;
  },

  // Detect impossible travel: same user from two very distant IPs within short time
  async detectImpossibleTravel(userId: string, currentCountry: string): Promise<boolean> {
    const since = new Date(Date.now() - 3600000).toISOString(); // last hour
    const { data } = await db.client().from('sec_audit_log').select('country').eq('user_id', userId).gte('created_at', since).neq('country', currentCountry).limit(1);
    return (data ?? []).length > 0;
  },
};