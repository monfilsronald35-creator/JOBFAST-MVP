import { db }                    from '../../../core/database/SupabaseClient.js';
import { FraudEngine }           from './FraudEngine.js';
import { IncidentResponseService } from './IncidentResponseService.js';
import type { EventEnvelope }    from '../../../core/events/DomainEvent.js';
import type { IncidentType }     from '../types/security.types.js';

function pld<T>(ev: EventEnvelope): T { return (ev.payload as unknown) as T; }

export const ThreatDetectionService = {
  async analyzeEvent(envelope: EventEnvelope): Promise<void> {
    const { eventName } = envelope;

    // Auth failures — possible credential stuffing
    if (eventName === 'auth.login_failed') {
      const p = pld<{ userId?: string; ip?: string }>(envelope);
      if (p.ip) {
        const { count } = await db.client().from('sec_audit_log').select('*', { count: 'exact', head: true })
          .eq('ip', p.ip).eq('action', 'auth.failed').gte('created_at', new Date(Date.now() - 600000).toISOString());
        if ((count ?? 0) >= 20) {
          await IncidentResponseService.create('credential_stuffing', 'high',
            `Possible credential stuffing: ${count} echèk login depi IP ${p.ip} nan 10 minit`, p.ip);
        }
      }
    }

    // Mass payments
    if (eventName === 'payment.initiated') {
      const p = pld<{ userId?: string; amount?: number; ip?: string }>(envelope);
      if (p.userId && p.amount) {
        const score = await FraudEngine.scorePayment(Number(p.amount), p.userId, p.ip ?? '');
        if (score >= 70) {
          await IncidentResponseService.create('fraud_detected', score >= 85 ? 'critical' : 'high',
            `Peman risk wo (score: ${score}) — ${p.amount} HTG`, undefined, p.userId);
        }
      }
    }

    // Wallet large transfer
    if (eventName === 'wallet.transfer') {
      const p = pld<{ userId?: string; amount?: number }>(envelope);
      if (p.amount && Number(p.amount) > 50_000_00) { // > 500K HTG
        await IncidentResponseService.create('suspicious_behavior', 'medium',
          `Gwo transfè portefèy: ${p.amount} HTG`, undefined, p.userId);
      }
    }

    // Impossible travel
    if (eventName === 'auth.login' || eventName === 'auth.login_success') {
      const p = pld<{ userId?: string; country?: string }>(envelope);
      if (p.userId && p.country) {
        const isImpossible = await FraudEngine.detectImpossibleTravel(p.userId, p.country);
        if (isImpossible) {
          await IncidentResponseService.create('impossible_travel', 'high',
            `Itilizatè ${p.userId} konekte depi peyi diferan nan espas kout tan`, undefined, p.userId);
        }
      }
    }
  },

  async getRecentThreats(hours = 24): Promise<Array<{ type: IncidentType; count: number }>> {
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    const { data } = await db.client().from('sec_incidents').select('type').gte('created_at', since).eq('status', 'open');
    const counts: Record<string, number> = {};
    ((data ?? []) as { type: string }[]).forEach(r => { counts[r.type] = (counts[r.type] ?? 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type: type as IncidentType, count })).sort((a, b) => b.count - a.count);
  },
};