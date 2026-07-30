import { MessageRepository } from '../repositories/MessageRepository.js';
import { ModerationAction, ModerationFlag } from '../types/chat.types.js';

// Blocklist patterns (production: integrate with AI content moderation API)
const SPAM_PATTERNS    = [/\b(click here|buy now|free money|earn \$|make money fast)\b/i, /(.)\1{8,}/];
const SCAM_PATTERNS    = [/\b(send me|wire transfer|western union|gift card|nigerian prince)\b/i];
const THREAT_PATTERNS  = [/\b(i will kill|i'll kill|death threat|bomb|gonna hurt)\b/i];
const HARASS_PATTERNS  = [/\b(kys|kill yourself|go die|stupid idiot|moron)\b/i];
const MALWARE_PATTERNS = [/\b(http[s]?:\/\/[^\s]+\.(exe|zip|bat|sh|cmd))\b/i, /bit\.ly\//i];

interface ModerationResult {
  action: ModerationAction;
  flags:  ModerationFlag[];
  score:  number;
}

function scoreText(text: string): ModerationResult {
  const flags: ModerationFlag[] = [];
  let score = 0;

  if (SPAM_PATTERNS.some(p => p.test(text)))    { flags.push(ModerationFlag.Spam);          score += 30; }
  if (SCAM_PATTERNS.some(p => p.test(text)))    { flags.push(ModerationFlag.Scam);          score += 50; }
  if (THREAT_PATTERNS.some(p => p.test(text)))  { flags.push(ModerationFlag.Threat);        score += 70; }
  if (HARASS_PATTERNS.some(p => p.test(text)))  { flags.push(ModerationFlag.Harassment);    score += 40; }
  if (MALWARE_PATTERNS.some(p => p.test(text))) { flags.push(ModerationFlag.MalwareLink);   score += 60; }

  const capped  = Math.min(100, score);
  const action  = capped >= 70 ? ModerationAction.Block
    :            capped >= 50 ? ModerationAction.Hide
    :            capped >= 30 ? ModerationAction.Review
    :            ModerationAction.None;

  return { action, flags, score: capped };
}

export const ModerationService = {
  async analyze(messageId: string, userId: string, content: string): Promise<ModerationResult> {
    const result = scoreText(content);
    if (result.flags.length > 0) {
      await MessageRepository.saveModerationLog({ messageId, userId, action: result.action, flags: result.flags, score: result.score });
    }
    return result;
  },

  analyzeSync(content: string): ModerationResult {
    return scoreText(content);
  },
};
