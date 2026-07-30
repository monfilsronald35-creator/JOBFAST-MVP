import type { NotificationDecision, NotificationContext } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { PROMPT_TEMPLATES, detectLanguage } from '../prompt/AIPromptEngine';

export const NotificationEngine = {
  async decide(context: NotificationContext): Promise<NotificationDecision> {
    try {
      const res = await fetch('/api/ai/notifications/decide', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(context),
      });
      if (res.ok) return res.json() as Promise<NotificationDecision>;
    } catch { /* AI fallback */ }

    const prompt = `Decide optimal notification delivery for user ${context.userId}.\n\nEvent: ${context.event}\nUser timezone: ${context.timezone ?? 'UTC'}\nUser language: ${context.language ?? 'ht'}\nEvent data: ${JSON.stringify(context.data ?? {})}\n\nReturn JSON: { send: boolean, channel: "push"|"email"|"sms"|"in_app", priority: "low"|"medium"|"high"|"urgent", scheduledAt?: number, message: { title: string, body: string }, reason: string }`;

    return AIGateway.json<NotificationDecision>(
      prompt,
      { strategy: 'fastest', temperature: 0.2 },
    ).catch(() => ({
      send:     true,
      channel:  'in_app' as const,
      priority: 'medium' as const,
      message:  { title: 'Notification', body: context.event },
      reason:   'fallback',
    }));
  },

  async generateMessage(event: string, language: string, context: Record<string, unknown>): Promise<{ title: string; body: string }> {
    const prompt = PROMPT_TEMPLATES.generateNotification(event, language, context);
    return AIGateway.json<{ title: string; body: string }>(
      prompt,
      { strategy: 'fastest', temperature: 0.3 },
    ).catch(() => ({ title: event, body: '' }));
  },

  async getOptimalTime(userId: string, timezone?: string): Promise<{ hour: number; minute: number; reason: string }> {
    try {
      const res = await fetch(`/api/ai/notifications/optimal-time?userId=${userId}${timezone ? `&tz=${encodeURIComponent(timezone)}` : ''}`);
      if (res.ok) return res.json() as Promise<{ hour: number; minute: number; reason: string }>;
    } catch { /* */ }
    // Default: 10 AM in user's timezone
    return { hour: 10, minute: 0, reason: 'default_business_hours' };
  },

  async batch(contexts: NotificationContext[]): Promise<NotificationDecision[]> {
    try {
      const res = await fetch('/api/ai/notifications/batch', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contexts }),
      });
      if (res.ok) return res.json() as Promise<NotificationDecision[]>;
    } catch { /* */ }
    return Promise.all(contexts.map(c => this.decide(c)));
  },

  // Convenience: decide + send
  async send(context: NotificationContext): Promise<{ sent: boolean; decision: NotificationDecision }> {
    const decision = await this.decide(context);
    if (!decision.send) return { sent: false, decision };

    try {
      const res = await fetch('/api/notifications/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...context, decision }),
      });
      return { sent: res.ok, decision };
    } catch {
      return { sent: false, decision };
    }
  },
};