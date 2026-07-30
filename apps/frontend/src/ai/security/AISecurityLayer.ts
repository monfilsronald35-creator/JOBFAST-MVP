/**
 * AISecurityLayer — Guards every AI request.
 * Rate limiting, PII masking, prompt injection detection, output filtering.
 */

import type { AIRequest, AIResponse } from '../types';

// ─── Rate limiting ────────────────────────────────────────────────────────────

const _rateLimits: Map<string, { count: number; windowStart: number }> = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX       = 30; // requests per minute per user

// ─── Prompt injection patterns ────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+instructions/i,
  /you\s+are\s+now\s+(a\s+)?DAN/i,
  /pretend\s+you\s+(have\s+)?no\s+restrictions/i,
  /jailbreak/i,
  /override\s+(your\s+)?(safety|restrictions|guidelines)/i,
  /act\s+as\s+an?\s+(unrestricted|uncensored|evil)/i,
  /forget\s+(your\s+)?(training|instructions|guidelines)/i,
];

// ─── PII patterns ─────────────────────────────────────────────────────────────

const PII_PATTERNS: Array<{ pattern: RegExp; label: string; mask: string }> = [
  { pattern: /\b\d{16}\b/g,                                                   label: 'card_number',   mask: '[CARD_NUMBER]'   },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g,                                        label: 'ssn',           mask: '[SSN]'           },
  { pattern: /\b[A-Z]{1,2}\d{6,9}\b/g,                                        label: 'passport',      mask: '[PASSPORT]'      },
  { pattern: /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/gi,                              label: 'email',         mask: '[EMAIL]'         },
  { pattern: /\b\+?1?\s?[-.]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,       label: 'phone',         mask: '[PHONE]'         },
  { pattern: /\b(?:htg|usd)\s*[\d,]+(?:\.\d{2})?\b/gi,                        label: 'currency_amount', mask: '[AMOUNT]'      },
];

// ─── Blocked content categories ───────────────────────────────────────────────

const BLOCKED_CATEGORIES = [
  /\b(porn|nude|explicit|sexual|xxx)\b/i,
  /\b(bomb|weapon|explosive|massacre)\b/i,
  /\b(suicide|self.harm|cut\s+myself)\b/i,
];

export class AISecurityLayer {
  private _bypassUsers: Set<string> = new Set(); // internal admin bypass

  // ─── Pre-request validation ───────────────────────────────────────────────

  validateRequest(request: AIRequest): { ok: boolean; reason?: string } {
    const userId = request.context?.userId;

    // Rate limit
    if (userId && !this._bypassUsers.has(userId)) {
      const key    = `rate:${userId}`;
      const bucket = _rateLimits.get(key) ?? { count: 0, windowStart: Date.now() };
      if (Date.now() - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
        bucket.count = 0; bucket.windowStart = Date.now();
      }
      bucket.count++;
      _rateLimits.set(key, bucket);
      if (bucket.count > RATE_LIMIT_MAX) {
        return { ok: false, reason: 'Rate limit exceeded. Tann 1 minit.' };
      }
    }

    // Prompt injection detection
    const allText = request.messages
      .map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
      .join('\n');

    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(allText)) {
        return { ok: false, reason: 'Request blocked: prompt injection detected.' };
      }
    }

    // Blocked content
    for (const pattern of BLOCKED_CATEGORIES) {
      if (pattern.test(allText)) {
        return { ok: false, reason: 'Request blocked: prohibited content.' };
      }
    }

    return { ok: true };
  }

  // ─── PII masking ──────────────────────────────────────────────────────────

  maskPII(text: string): { masked: string; piiFound: string[] } {
    let masked = text;
    const found: string[] = [];
    for (const { pattern, label, mask } of PII_PATTERNS) {
      const orig = masked;
      masked = masked.replace(pattern, mask);
      if (masked !== orig) found.push(label);
    }
    return { masked, piiFound: found };
  }

  maskRequestPII(request: AIRequest): AIRequest {
    const messages = request.messages.map(m => {
      if (typeof m.content !== 'string') return m;
      const { masked } = this.maskPII(m.content);
      return { ...m, content: masked };
    });
    return { ...request, messages };
  }

  // ─── Output validation ────────────────────────────────────────────────────

  validateOutput(response: AIResponse): { ok: boolean; reason?: string; filtered?: string } {
    for (const pattern of BLOCKED_CATEGORIES) {
      if (pattern.test(response.content)) {
        return { ok: false, reason: 'Output filtered: prohibited content detected.' };
      }
    }
    return { ok: true };
  }

  // ─── Budget enforcement ───────────────────────────────────────────────────

  checkBudget(request: AIRequest, estimatedCostUSD: number): { ok: boolean; reason?: string } {
    const budget = request.budgetUSD;
    if (budget !== undefined && estimatedCostUSD > budget) {
      return { ok: false, reason: `Estimated cost $${estimatedCostUSD.toFixed(4)} exceeds budget $${budget.toFixed(4)}.` };
    }
    return { ok: true };
  }

  // ─── Admin bypass ─────────────────────────────────────────────────────────

  addBypassUser(userId: string): void { this._bypassUsers.add(userId); }
  removeBypassUser(userId: string): void { this._bypassUsers.delete(userId); }
}

export const aiSecurity = new AISecurityLayer();