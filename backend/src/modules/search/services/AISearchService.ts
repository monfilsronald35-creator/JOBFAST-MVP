import { SearchSource, SearchMode } from '../types/search.types.js';
import type { SearchQuery } from '../types/search.types.js';

interface Intent {
  query:     string;
  sources:   SearchSource[];
  mode:      SearchMode;
  location?: { nearby: boolean } | undefined;
}

// Intent detection patterns — maps natural language signals to sources
const SOURCE_SIGNALS: Array<{ patterns: RegExp[]; source: SearchSource }> = [
  { patterns: [/hotel|lodge|inn|guesthouse|otèl/i],               source: SearchSource.Hotels },
  { patterns: [/restaurant|food|eat|manje|restoran|cafe/i],        source: SearchSource.Restaurants },
  { patterns: [/doctor|hospital|clinic|medical|doktè|lopital/i],   source: SearchSource.Hospitals },
  { patterns: [/job|work|hiring|employ|travay|klas/i],             source: SearchSource.Jobs },
  { patterns: [/plumber|electric|carpenter|mechanic|plonbye/i],    source: SearchSource.Workers },
  { patterns: [/buy|sell|product|shop|achte|telefon|phone/i],      source: SearchSource.Products },
  { patterns: [/school|university|college|lekòl|inivèsite/i],      source: SearchSource.Schools },
  { patterns: [/flight|airplane|avyon|airline/i],                  source: SearchSource.Flights },
  { patterns: [/car|vehicle|auto|machin/i],                        source: SearchSource.Cars },
  { patterns: [/house|property|apartment|kay|apaman/i],            source: SearchSource.Properties },
  { patterns: [/event|concert|show|evenman/i],                     source: SearchSource.Events },
  { patterns: [/lawyer|attorney|legal|avoka/i],                    source: SearchSource.Services },
  { patterns: [/telecom|phone plan|wifi|internet|digicel/i],       source: SearchSource.Telecom },
];

const NEARBY_SIGNALS = /nearby|near|toupre|close|around|prè|distans/i;
const AVAILABILITY   = /today|now|available|jodi a|kounye a|disponib/i;

function stripNaturalLanguage(q: string): string {
  return q
    .replace(/\b(find|get|show|looking for|i need|mwen bezwen|ban mwen|cherche|busco|necesito)\b/gi, '')
    .replace(/\b(a|an|the|yon|un|une)\b/gi, '')
    .trim()
    .replace(/\s{2,}/g, ' ');
}

export const AISearchService = {
  parseIntent(rawQuery: string): Intent {
    const sources: SearchSource[] = [];
    for (const sig of SOURCE_SIGNALS) {
      if (sig.patterns.some(p => p.test(rawQuery))) {
        sources.push(sig.source);
      }
    }

    const cleanQuery = stripNaturalLanguage(rawQuery);
    const hasNearby  = NEARBY_SIGNALS.test(rawQuery);

    return {
      query:    cleanQuery || rawQuery,
      sources:  sources.length > 0 ? sources : [],
      mode:     sources.length > 0 ? SearchMode.Hybrid : SearchMode.AI,
      location: hasNearby ? { nearby: true } : undefined,
    };
  },

  enhance(base: SearchQuery, rawQuery: string): SearchQuery {
    const intent = AISearchService.parseIntent(rawQuery);
    const enhanced: SearchQuery = {
      ...base,
      q:    intent.query,
      mode: intent.mode,
    };
    if (intent.sources.length > 0 && (!base.sources || base.sources.length === 0)) {
      enhanced.sources = intent.sources;
    }
    return enhanced;
  },

  synonymExpand(query: string): string[] {
    const synonymMap: Record<string, string[]> = {
      'software engineer':   ['developer', 'programmer', 'full stack', 'backend'],
      'developer':           ['software engineer', 'programmer', 'coder'],
      'programmer':          ['developer', 'software engineer', 'coder'],
      'plumber':             ['plonbye', 'pipe fitter'],
      'electrician':         ['electricien', 'electricite'],
      'doctor':              ['physician', 'médecin', 'doktè'],
      'lawyer':              ['attorney', 'avoka', 'avocat'],
      'driver':              ['chauffeur', 'chofè'],
    };
    const lower = query.toLowerCase();
    return synonymMap[lower] ?? [];
  },
};