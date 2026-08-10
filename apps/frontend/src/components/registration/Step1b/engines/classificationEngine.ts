// ─── AI Business Classification Engine ───────────────────────────────────────
// Pipeline: raw text → normalize → lang detect → tokens → entity match →
//           alias lookup → confidence scoring → BusinessDNA draft
// Backend API hook: when VITE_API_URL is set and backend is online, this
// engine defers to /api/v1/classify instead of running locally.

import type { AIClassificationResult, SearchIntent, BusinessLocation } from '../types/business';
import { ALIAS_INDEX, GLOBAL_TAXONOMY, TAXONOMY_BY_ID } from '../constants/taxonomy';

// ─── Language detection (lightweight trigram heuristic) ───────────────────────

const LANG_MARKERS: Record<string, string[]> = {
  ht: ['mwen', 'nou', 'yo', 'nan', 'ak', 'ki', 'sa', 'pou', 'li', 'gen', 'pa', 'ou', 'dwe', 'te', 'ap', 'kay', 'sèvis', 'fè'],
  es: ['tengo', 'que', 'una', 'mi', 'negocio', 'tenemos', 'hacemos', 'empresa', 'tienda', 'quiero', 'necesito', 'vendo'],
  fr: ['j\'ai', 'nous', 'une', 'mon', 'notre', 'entreprise', 'nous', 'faisons', 'service', 'vendre', 'acheter'],
  pt: ['tenho', 'nosso', 'nossa', 'empresa', 'fazemos', 'vendo', 'preciso', 'quero'],
  ar: ['لدي', 'نحن', 'شركة', 'أعمال', 'خدمة'],
  zh: ['我', '公司', '业务', '服务', '我们'],
};

export function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [lang, markers] of Object.entries(LANG_MARKERS)) {
    scores[lang] = markers.filter(m => lower.includes(m)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : 'en';
}

// ─── Text normalization ────────────────────────────────────────────────────────

const STOP_WORDS = new Set(['i', 'a', 'an', 'the', 'and', 'or', 'is', 'are', 'we', 'my', 'our',
  'mwen', 'nou', 'yo', 'epi', 'oswa', 'e', 'o', 'y', 'el', 'la', 'los', 'le', 'les', 'un', 'une']);

const SYNONYMS: Record<string, string> = {
  'hôtel': 'hotel', 'hotêl': 'hotel', 'otèl': 'hotel',
  'restaurant': 'restaurant', 'restoran': 'restaurant', 'resto': 'restaurant',
  'médecin': 'doctor', 'doktè': 'doctor', 'médico': 'doctor',
  'avocat': 'lawyer', 'abogado': 'lawyer', 'avoka': 'lawyer',
  'transport': 'transportation', 'transpò': 'transportation',
  'konstriksyon': 'construction', 'construcción': 'construction', 'bâtiment': 'construction',
  'lojistik': 'logistics', 'logística': 'logistics',
  'bank': 'bank', 'banco': 'bank', 'banque': 'bank',
  'teknoloji': 'technology', 'tecnología': 'technology', 'informatique': 'technology',
  'agrikilti': 'agriculture', 'agricultura': 'agriculture',
  'sekirite': 'security', 'seguridad': 'security', 'sécurité': 'security',
  'famasi': 'pharmacy', 'farmacia': 'pharmacy', 'pharmacie': 'pharmacy',
  'lekòl': 'school', 'escuela': 'school', 'école': 'school',
  'faktori': 'factory', 'fábrica': 'factory', 'usine': 'factory',
};

export function normalize(text: string): string[] {
  const raw = text.toLowerCase()
    .replace(/[^\w\s'àáâãäçèéêëìíîïòóôõöùúûüýÿñ]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
  return raw.map(t => SYNONYMS[t] ?? t);
}

// ─── Location extraction ───────────────────────────────────────────────────────

const GEO_HINTS: Array<{ pattern: RegExp; country: string; countryCode: string; city?: string }> = [
  { pattern: /\bhaiti\b|haiti|ayiti|\bport.au.prince\b|pòtoprens/i, country: 'Haiti', countryCode: 'HT', city: 'Port-au-Prince' },
  { pattern: /\bdominican\b|\brepublica dominicana\b|\bsanto domingo\b|\bpunta cana\b|\bsantiago\b.*\bdo\b/i, country: 'Dominican Republic', countryCode: 'DO' },
  { pattern: /\bpunta cana\b/i, country: 'Dominican Republic', countryCode: 'DO', city: 'Punta Cana' },
  { pattern: /\bmiami\b/i, country: 'United States', countryCode: 'US', city: 'Miami' },
  { pattern: /\bnew york\b|\bnyc\b/i, country: 'United States', countryCode: 'US', city: 'New York' },
  { pattern: /\bfrance\b|\bparis\b/i, country: 'France', countryCode: 'FR', city: 'Paris' },
  { pattern: /\bjamaica\b/i, country: 'Jamaica', countryCode: 'JM' },
  { pattern: /\bcuba\b/i, country: 'Cuba', countryCode: 'CU' },
  { pattern: /\bcanada\b|\bmontreal\b|\btoronto\b/i, country: 'Canada', countryCode: 'CA' },
  { pattern: /\bbrazil\b|\bbresil\b|\bbrésil\b|\bsão paulo\b/i, country: 'Brazil', countryCode: 'BR' },
  { pattern: /\bmexico\b|\bméxico\b/i, country: 'Mexico', countryCode: 'MX' },
  { pattern: /\bdubai\b|\buae\b/i, country: 'UAE', countryCode: 'AE', city: 'Dubai' },
];

function extractLocation(text: string): Partial<BusinessLocation> | undefined {
  for (const hint of GEO_HINTS) {
    if (hint.pattern.test(text)) {
      return {
        country: hint.country,
        countryCode: hint.countryCode,
        ...(hint.city !== undefined ? { city: hint.city } : {}),
        timezone: hint.countryCode === 'HT' ? 'America/Port-au-Prince'
          : hint.countryCode === 'DO' ? 'America/Santo_Domingo'
          : 'UTC',
      };
    }
  }
  return undefined;
}

// ─── Intent classification ─────────────────────────────────────────────────────

const INTENT_SIGNALS: Record<string, string[]> = {
  hiring:    ['hire', 'employee', 'staff', 'recruit', 'travayè', 'employé', 'empleado', 'contratar'],
  booking:   ['book', 'reserve', 'appointment', 'rezève', 'reservar', 'réserver'],
  purchasing:['buy', 'purchase', 'order', 'achte', 'comprar', 'acheter'],
  discovery: ['find', 'search', 'look', 'chèche', 'buscar', 'chercher', 'découvrir'],
};

function detectIntent(tokens: string[]): SearchIntent['intent'] {
  const joined = tokens.join(' ');
  for (const [intent, signals] of Object.entries(INTENT_SIGNALS)) {
    if (signals.some(s => joined.includes(s))) {
      return intent as SearchIntent['intent'];
    }
  }
  return 'discovery';
}

// ─── Core classification ───────────────────────────────────────────────────────

interface CategoryMatch {
  categoryId: string;
  confidence: number;
  matchedAliases: string[];
}

function scoreCategory(tokens: string[], categoryId: string): CategoryMatch {
  const cat = TAXONOMY_BY_ID[categoryId];
  if (!cat) return { categoryId, confidence: 0, matchedAliases: [] };

  const matchedAliases: string[] = [];
  let hits = 0;

  for (const token of tokens) {
    if (cat.aliases.includes(token)) { hits += 2; matchedAliases.push(token); }
    if (cat.services.includes(token)) { hits += 1; }
    if (cat.products.includes(token)) { hits += 1; }
    if (cat.id === token) { hits += 3; }
    // partial match
    if (cat.aliases.some(a => a.includes(token) && token.length > 3)) { hits += 0.5; }
  }

  const maxPossible = tokens.length * 2.5;
  const confidence = Math.min(1, hits / Math.max(1, maxPossible)) * 100;

  return { categoryId, confidence, matchedAliases };
}

export async function classifyBusiness(input: string): Promise<AIClassificationResult> {
  const t0 = performance.now();

  // Try backend first
  try {
    const apiBase = (import.meta.env['VITE_API_URL'] as string | undefined) ?? '/api/v1';
    const res = await fetch(`${apiBase}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return res.json() as Promise<AIClassificationResult>;
    }
  } catch {
    // Fall through to local engine
  }

  // Local classification engine
  const language = detectLanguage(input);
  const tokens = normalize(input);
  const location = extractLocation(input);

  // Score every category
  const scores: CategoryMatch[] = [];
  const seenCategories = new Set<string>();

  for (const token of tokens) {
    const catId = ALIAS_INDEX[token];
    if (catId && !seenCategories.has(catId)) {
      seenCategories.add(catId);
      scores.push(scoreCategory(tokens, catId));
    }
  }

  // Also run against all categories for partial matches
  for (const cat of GLOBAL_TAXONOMY) {
    if (!seenCategories.has(cat.id)) {
      const s = scoreCategory(tokens, cat.id);
      if (s.confidence > 10) {
        scores.push(s);
      }
    }
  }

  scores.sort((a, b) => b.confidence - a.confidence);

  const top = scores.slice(0, 5).filter(s => s.confidence > 5);
  const primary = top[0];
  const secondary = top.slice(1);

  const processingMs = Math.round(performance.now() - t0);

  return {
    primaryBusiness: primary?.categoryId ?? 'unknown',
    primaryConfidence: Math.round(primary?.confidence ?? 0),
    secondaryBusinesses: secondary.map(s => ({
      type: s.categoryId,
      confidence: Math.round(s.confidence),
    })),
    ...(location !== undefined ? { extractedLocation: location } : {}),
    extractedNeeds: detectNeeds(tokens),
    language,
    processingMs,
  };
}

function detectNeeds(tokens: string[]): string[] {
  const needMap: Record<string, string> = {
    employee: 'hiring', travayè: 'hiring', staff: 'hiring',
    supplier: 'supply_chain', founisè: 'supply_chain',
    delivery: 'delivery', livraison: 'delivery',
    loan: 'financing', prè: 'financing',
    marketing: 'marketing',
    website: 'digital_presence', app: 'digital_presence',
    insurance: 'insurance', asirans: 'insurance',
  };
  const needs = new Set<string>();
  for (const token of tokens) {
    const need = needMap[token];
    if (need) needs.add(need);
  }
  return [...needs];
}

// ─── Intent parsing ────────────────────────────────────────────────────────────

export function parseSearchIntent(query: string): SearchIntent {
  const language = detectLanguage(query);
  const tokens = normalize(query);
  const location = extractLocation(query);

  const matchedCategories = tokens
    .map(t => ALIAS_INDEX[t])
    .filter(Boolean) as string[];

  const industries = [...new Set(
    matchedCategories.map(id => TAXONOMY_BY_ID[id]?.industryCode).filter(Boolean) as string[]
  )];

  return {
    raw: query,
    normalized: tokens.join(' '),
    language,
    entities: [...new Set(matchedCategories)],
    industries,
    businessTypes: [...new Set(matchedCategories)],
    ...(location !== undefined ? { location } : {}),
    intent: detectIntent(tokens),
    confidence: matchedCategories.length > 0 ? Math.min(0.95, 0.4 + matchedCategories.length * 0.15) : 0.2,
  };
}
