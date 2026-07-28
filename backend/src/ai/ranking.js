/**
 * AI — Smart Ranking Engine
 * Composite scoring for search results using multiple signals
 */

// Weights must sum to 1.0
const WEIGHTS = {
  rating:       0.30,
  relevance:    0.25,
  availability: 0.20,
  recentActivity: 0.15,
  completeness: 0.10,
};

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Score a single result item
export function scoreItem(item, query = '') {
  const signals = {};

  // Rating (0-5 → 0-1)
  signals.rating = ((item.stats?.rating || item.rating || 3) / 5);

  // Relevance — simple text match score
  const q = query.toLowerCase();
  if (q) {
    const text = [item.name, item.profession, item.category, item.description].join(' ').toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const matches = words.filter(w => text.includes(w)).length;
    signals.relevance = matches / words.length;
  } else {
    signals.relevance = 0.5;
  }

  // Availability
  signals.availability = item.isAvailable || item.is_available ? 1.0 : 0.1;

  // Recent activity (jobs completed in last 30 days)
  const recentJobs = item.stats?.completedJobsLast30d || 0;
  signals.recentActivity = normalize(recentJobs, 0, 20);

  // Profile completeness (0-100 → 0-1)
  signals.completeness = (item.profileCompleteness || item.profile_completeness || 50) / 100;

  // Composite score
  const composite = Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (signals[key] || 0) * weight;
  }, 0);

  return { composite: Math.round(composite * 100) / 100, signals };
}

// Rank an array of results
export function rankResults(items, query = '', boosts = {}) {
  return items
    .map(item => {
      const { composite, signals } = scoreItem(item, query);
      // Apply optional boosts (e.g. sponsored, promoted)
      const boosted = composite + (boosts[item.id] || 0);
      return { ...item, _rank: { score: composite, boosted, signals } };
    })
    .sort((a, b) => b._rank.boosted - a._rank.boosted);
}

// Rank with pagination
export function rankPaginated(items, query = '', { page = 1, limit = 20 } = {}) {
  const ranked = rankResults(items, query);
  const total  = ranked.length;
  const data   = ranked.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

export default { scoreItem, rankResults, rankPaginated };
