/**
 * AI — Enhanced Search
 * Typo tolerance, synonym expansion, multi-field ranking
 */
import { supabase } from '../config/supabaseClient.js';
import { rankResults } from './ranking.js';
import { withCache, cache } from '../core/cache.js';

// Common synonyms for Haiti/Caribbean job market
const SYNONYMS = {
  'electrician': ['elektrisyen', 'electric', 'electrical'],
  'plumber':     ['plombier', 'plombiye', 'plumbing'],
  'driver':      ['chauffeur', 'chofè', 'transport'],
  'nurse':       ['infirmière', '  enfimyè', 'nursing'],
  'doctor':      ['médecin', 'doktè', 'physician'],
  'cleaner':     ['nettoyage', 'netwayaj', 'cleaning', 'housekeeping'],
  'chef':        ['cuisinier', 'kizinyè', 'cook'],
  'teacher':     ['enseignant', '', 'educator', 'instructor'],
  'carpenter':   ['menuisier', 'menuizye', 'woodworking'],
  'mason':       ['maçon', 'mason', 'bricklayer', 'construction'],
  'mechanic':    ['mécanicien', 'mekanisyen', 'auto repair'],
};

function expandQuery(query) {
  const lower = query.toLowerCase().trim();
  const words = lower.split(/\s+/);
  const expanded = new Set(words);
  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    if (words.some(w => w.includes(key) || synonyms.some(s => w.includes(s)))) {
      expanded.add(key);
      synonyms.forEach(s => expanded.add(s));
    }
  }
  return [...expanded].slice(0, 10);
}

// Levenshtein distance for typo tolerance
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  }
  return dp[m][n];
}

function fuzzyMatch(text, query, threshold = 2) {
  const words = text.toLowerCase().split(/\s+/);
  const qWords = query.toLowerCase().split(/\s+/);
  return qWords.some(qw => words.some(w => w.includes(qw) || levenshtein(w, qw) <= threshold));
}

export async function search({ query = '', type = 'all', category, location, limit = 20, page = 1 }) {
  const cacheKey = `search:${query}:${type}:${category}:${page}`;
  return withCache(cache.short, cacheKey, async () => {
    const terms = expandQuery(query);
    const results = { workers: [], jobs: [], total: 0 };

    if (type === 'all' || type === 'workers') {
      let q = supabase.from('profiles').select('*').in('role', ['worker', 'freelancer', 'service_provider']).eq('is_active', true);
      if (category) q = q.eq('category', category);
      const { data } = await q.limit(200);
      const filtered = (data || []).filter(w => !query || fuzzyMatch([w.name, w.profession, w.category].join(' '), query));
      results.workers = rankResults(filtered, query).slice((page - 1) * limit, page * limit);
    }

    if (type === 'all' || type === 'jobs') {
      let q = supabase.from('jobs').select('*').eq('status', 'open');
      if (category) q = q.eq('category', category);
      const { data } = await q.limit(200);
      const filtered = (data || []).filter(j => !query || fuzzyMatch([j.title, j.description, j.category].join(' '), query));
      results.jobs = rankResults(filtered, query).slice((page - 1) * limit, page * limit);
    }

    results.total = results.workers.length + results.jobs.length;
    results.suggestions = terms.slice(0, 5);
    return results;
  }, 30_000);
}

export async function suggest(partial, limit = 5) {
  if (!partial || partial.length < 2) return [];
  const { data } = await supabase
    .from('profiles')
    .select('profession, category')
    .ilike('profession', `%${partial}%`)
    .limit(50);
  const seen = new Set();
  const suggestions = [];
  for (const row of (data || [])) {
    const v = row.profession || row.category;
    if (v && !seen.has(v)) { seen.add(v); suggestions.push(v); }
    if (suggestions.length >= limit) break;
  }
  return suggestions;
}

export default { search, suggest, expandQuery };
