import type { MatchRequest, MatchResult } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { SYSTEM_PROMPTS, PROMPT_TEMPLATES } from '../prompt/AIPromptEngine';

export const MatchingEngine = {
  async match(request: MatchRequest): Promise<MatchResult[]> {
    try {
      const res = await fetch('/api/ai/match', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(request),
      });
      if (res.ok) return res.json() as Promise<MatchResult[]>;
    } catch { /* fallback */ }
    return [];
  },

  async scoreMatch(
    subjectProfile: string,
    candidateProfile: string,
    domain: MatchRequest['domain'],
  ): Promise<{ score: number; reasons: string[] }> {
    const prompt = domain === 'worker_company' || domain === 'client_provider'
      ? PROMPT_TEMPLATES.matchJobWorker(subjectProfile, candidateProfile)
      : `Score compatibility between these two profiles for ${domain} matching:\n\nProfile A:\n${subjectProfile}\n\nProfile B:\n${candidateProfile}\n\nReturn JSON: { score: 0-100, reasons: string[] }`;

    const result = await AIGateway.json<{ score: number; reasons: string[] }>(
      prompt,
      { strategy: 'balanced', temperature: 0 },
    ).catch(() => ({ score: 0, reasons: [] }));

    return result;
  },

  async batchMatch(
    subjectId: string,
    candidateIds: string[],
    domain: MatchRequest['domain'],
  ): Promise<MatchResult[]> {
    try {
      const res = await fetch('/api/ai/match/batch', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subjectId, candidateIds, domain }),
      });
      if (res.ok) return res.json() as Promise<MatchResult[]>;
    } catch { /* */ }
    return [];
  },

  async explainMatch(subjectId: string, candidateId: string, domain: MatchRequest['domain']): Promise<string> {
    try {
      return await AIGateway.complete(
        `Explain in 2 sentences why ${subjectId} and ${candidateId} are a good match for ${domain}:`,
        { strategy: 'fastest', maxTokens: 100 },
      );
    } catch { return ''; }
  },
};