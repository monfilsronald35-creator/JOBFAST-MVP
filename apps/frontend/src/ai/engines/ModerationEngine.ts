import type { ModerationResult, ModerationTarget } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { SYSTEM_PROMPTS } from '../prompt/AIPromptEngine';

export const ModerationEngine = {
  async moderate(target: ModerationTarget): Promise<ModerationResult> {
    // Backend ML moderation (faster, cheaper for bulk)
    try {
      const res = await fetch('/api/ai/moderate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(target),
      });
      if (res.ok) return res.json() as Promise<ModerationResult>;
    } catch { /* AI fallback */ }

    // AI moderation fallback
    const contentDesc = target.contentType === 'text'
      ? `Text: "${(target.content as string).slice(0, 500)}"`
      : `${target.contentType} content`;

    const result = await AIGateway.json<{
      approved: boolean;
      action: ModerationResult['action'];
      categories: ModerationResult['categories'];
      confidence: number;
      reason?: string;
    }>(
      `${SYSTEM_PROMPTS.moderator()}\n\nContent to moderate (${target.contentType}, context: ${target.context ?? 'general'}):\n${contentDesc}\n\nReturn JSON: { approved: boolean, action: "allow"|"flag"|"remove"|"escalate", categories: { hate: bool, sexual: bool, violence: bool, spam: bool, harassment: bool, minors: bool }, confidence: 0-100, reason?: string }`,
      { strategy: 'balanced', temperature: 0 },
    ).catch(() => ({
      approved: true, action: 'allow' as const,
      categories: { hate: false, sexual: false, violence: false, spam: false, harassment: false, minors: false },
      confidence: 50,
    }));

    return { ...result, contentId: target.contentId, contentType: target.contentType, timestamp: Date.now() };
  },

  async moderateBatch(targets: ModerationTarget[]): Promise<ModerationResult[]> {
    // Backend batch endpoint (cheaper per item)
    try {
      const res = await fetch('/api/ai/moderate/batch', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ targets }),
      });
      if (res.ok) return res.json() as Promise<ModerationResult[]>;
    } catch { /* */ }

    return Promise.all(targets.map(t => this.moderate(t)));
  },

  async checkText(text: string, context?: string): Promise<ModerationResult> {
    return this.moderate({ contentId: crypto.randomUUID(), contentType: 'text', content: text, context });
  },

  async checkImage(imageUrl: string, context?: string): Promise<ModerationResult> {
    return this.moderate({ contentId: crypto.randomUUID(), contentType: 'image', content: imageUrl, context });
  },

  async checkUserProfile(userId: string, profileData: Record<string, unknown>): Promise<ModerationResult> {
    const combined = JSON.stringify(profileData);
    return this.moderate({ contentId: userId, contentType: 'text', content: combined, context: 'user_profile' });
  },

  async checkJobPosting(jobId: string, jobData: { title: string; description: string }): Promise<ModerationResult> {
    const text = `${jobData.title}\n\n${jobData.description}`;
    return this.moderate({ contentId: jobId, contentType: 'text', content: text, context: 'job_posting' });
  },

  async checkMarketplaceListing(listingId: string, data: { title: string; description: string }): Promise<ModerationResult> {
    const text = `${data.title}\n\n${data.description}`;
    return this.moderate({ contentId: listingId, contentType: 'text', content: text, context: 'marketplace' });
  },
};