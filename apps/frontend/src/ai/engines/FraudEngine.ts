import type { FraudAssessment, FraudSignal } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { SYSTEM_PROMPTS } from '../prompt/AIPromptEngine';

export const FraudEngine = {
  async assess(
    entityId: string,
    entityType: FraudAssessment['entityType'],
    data: Record<string, unknown>,
  ): Promise<FraudAssessment> {
    // Real-time backend assessment (ML model)
    try {
      const res = await fetch('/api/ai/fraud/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, entityType, data }),
      });
      if (res.ok) return res.json() as Promise<FraudAssessment>;
    } catch {
      /* fallback to AI */
    }

    // AI fallback assessment
    const prompt = `Analyze fraud signals in this data for entity type "${entityType}":\n${JSON.stringify(data, null, 2)}\n\nReturn JSON: { riskScore: 0-100, riskLevel: "low"|"medium"|"high"|"critical", signals: [{ type: string, score: number, evidence: string[], confidence: number }], recommendation: "allow"|"review"|"block" }`;

    const result = await AIGateway.json<{
      riskScore: number;
      riskLevel: FraudAssessment['riskLevel'];
      signals: FraudSignal[];
      recommendation: FraudAssessment['recommendation'];
    }>(prompt, { strategy: 'balanced', temperature: 0 }).catch(() => ({
      riskScore: 0,
      riskLevel: 'low' as const,
      signals: [],
      recommendation: 'allow' as const,
    }));

    return { entityId, entityType, ...result, confidence: 70, timestamp: Date.now() };
  },

  async detectFakeReview(
    reviewText: string,
    businessContext?: string,
  ): Promise<{ authentic: boolean; confidence: number; signals: string[] }> {
    const prompt = PROMPT_TEMPLATES.scoreReview(reviewText, businessContext);
    return AIGateway.json<{ authentic: boolean; confidence: number; signals: string[] }>(prompt, {
      strategy: 'balanced',
      temperature: 0,
    }).catch(() => ({ authentic: true, confidence: 50, signals: [] }));
  },

  async detectBotActivity(
    sessionData: Record<string, unknown>,
  ): Promise<{ isBot: boolean; confidence: number; signals: string[] }> {
    // Heuristic checks (no AI call needed for most cases)
    const signals: string[] = [];
    let botScore = 0;

    if ((sessionData.requestsPerMinute as number) > 100) {
      signals.push('high_request_rate');
      botScore += 30;
    }
    if ((sessionData.mouseMovements as number) === 0) {
      signals.push('no_mouse_movement');
      botScore += 25;
    }
    if ((sessionData.sessionDuration as number) < 2) {
      signals.push('very_short_session');
      botScore += 20;
    }
    if (((sessionData.userAgent as string) ?? '').includes('bot')) {
      signals.push('bot_user_agent');
      botScore += 40;
    }

    return { isBot: botScore >= 50, confidence: Math.min(botScore + 20, 100), signals };
  },

  async detectSuspiciousLogin(loginData: {
    userId: string;
    ip: string;
    device?: string;
    country?: string;
    previousCountry?: string;
    failedAttempts?: number;
  }): Promise<{ suspicious: boolean; riskLevel: 'low' | 'medium' | 'high'; reason?: string }> {
    const signals: string[] = [];
    let risk = 0;

    if (loginData.failedAttempts && loginData.failedAttempts > 3) {
      signals.push('multiple_failed_attempts');
      risk += 30;
    }
    if (
      loginData.country &&
      loginData.previousCountry &&
      loginData.country !== loginData.previousCountry
    ) {
      signals.push('country_change');
      risk += 25;
    }

    const level = risk >= 50 ? 'high' : risk >= 25 ? 'medium' : 'low';
    const reason = signals.join(', ') || undefined;
    return {
      suspicious: risk >= 25,
      riskLevel: level,
      ...(reason !== undefined ? { reason } : {}),
    };
  },
};

function PROMPT_TEMPLATES_scoreReview(text: string, ctx?: string) {
  return `Analyze if this review is authentic:\n"${text}"${ctx ? `\nContext: ${ctx}` : ''}\nReturn JSON: { authentic: boolean, confidence: number, signals: string[] }`;
}

// Fix reference
const PROMPT_TEMPLATES = { scoreReview: PROMPT_TEMPLATES_scoreReview };
