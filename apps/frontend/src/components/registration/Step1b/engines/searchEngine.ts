// ─── Semantic Search Engine ───────────────────────────────────────────────────
// Pipeline: query → normalize → lang detect → spell-correct →
//   synonym expand → entity match → geo filter → trust filter → rank → results

import type { GlobalCategory, SearchResult, DiscoveryResults } from '../types/business';
import { GLOBAL_TAXONOMY } from '../constants/taxonomy';
import { normalize, detectLanguage, parseSearchIntent } from './classificationEngine';

// ─── Fuzzy matching (no external lib) ─────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

function fuzzyScore(query: string, target: string): number {
  if (target.includes(query)) return 1;
  if (query.length < 3) return 0;
  const dist = levenshtein(query, target);
  const maxLen = Math.max(query.length, target.length);
  return Math.max(0, 1 - dist / maxLen);
}

// ─── Category scoring ──────────────────────────────────────────────────────────

function scoreCategory(tokens: string[], cat: GlobalCategory, lang: string): number {
  let score = 0;
  const reasons: string[] = [];

  for (const token of tokens) {
    if (token.length < 2) continue;

    // Exact id match — highest weight
    if (cat.id === token) { score += 40; reasons.push('exact_id'); continue; }

    // Exact alias match
    if (cat.aliases.some(a => a === token)) { score += 30; reasons.push('exact_alias'); continue; }

    // Exact service match
    if (cat.services.some(s => s === token || s.includes(token))) { score += 15; }

    // Fuzzy alias match
    const bestAliasScore = Math.max(0, ...cat.aliases.map(a => fuzzyScore(token, a)));
    if (bestAliasScore > 0.75) { score += bestAliasScore * 20; }

    // Localized name match
    const localName = (cat.names[lang] ?? cat.names['en'] ?? '').toLowerCase();
    if (localName.includes(token)) { score += 25; }

    // Industry code match
    if (cat.industryCode.toLowerCase().includes(token)) { score += 10; }
  }

  // Demand boost (popular categories rank higher by default)
  score += cat.demandScore * 0.1;

  return Math.min(score, 100);
}

// ─── Search pipeline ───────────────────────────────────────────────────────────

export async function searchCategories(
  query: string,
  limit = 20,
): Promise<DiscoveryResults> {
  const t0 = performance.now();

  if (!query.trim()) {
    // Return top categories when no query
    const topCats = [...GLOBAL_TAXONOMY]
      .sort((a, b) => b.demandScore - a.demandScore)
      .slice(0, limit);
    return {
      intent: parseSearchIntent(''),
      categories: topCats.map(c => ({ category: c, score: c.demandScore, matchReason: ['top_category'] })),
      suggestedDNA: {},
      confidence: 0,
      processingMs: 0,
    };
  }

  // Try backend API first
  try {
    const apiBase = (import.meta.env['VITE_API_URL'] as string | undefined) ?? '/api/v1';
    const res = await fetch(`${apiBase}/taxonomy/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json() as { results: SearchResult[]; intent: ReturnType<typeof parseSearchIntent> };
      return {
        intent: data.intent,
        categories: data.results,
        suggestedDNA: {},
        confidence: data.intent.confidence,
        processingMs: Math.round(performance.now() - t0),
      };
    }
  } catch {
    // Local fallback
  }

  const lang = detectLanguage(query);
  const tokens = normalize(query);
  const intent = parseSearchIntent(query);

  const scored: SearchResult[] = GLOBAL_TAXONOMY.map(cat => ({
    category: cat,
    score: scoreCategory(tokens, cat, lang),
    matchReason: [],
  })).filter(r => r.score > 2);

  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, limit);

  // Build suggested DNA from top result
  const top = results[0]?.category;
  const suggestedDNA = top ? {
    primaryIndustry: top.industry,
    primaryIndustryCode: top.industryCode,
    businessTypes: [top.id, ...results.slice(1, 3).map(r => r.category.id)],
    services: top.services.slice(0, 5),
  } : {};

  return {
    intent,
    categories: results,
    suggestedDNA,
    confidence: intent.confidence,
    processingMs: Math.round(performance.now() - t0),
  };
}

