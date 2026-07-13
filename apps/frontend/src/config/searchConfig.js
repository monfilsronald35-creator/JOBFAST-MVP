// ============================================================
// JOBFAST — SEARCH ENGINE CONFIGURATION
// Single source of truth for role-aware search behavior.
// Components consume this via getSearchConfig(role).
// Do NOT scatter search logic across individual components.
// ============================================================

// ── Ranking weights ──────────────────────────────────────────
// All weights are positive; moderation_risk is subtracted.
// Adjust here to change how results are ranked globally.
export const RANKING_WEIGHTS = Object.freeze({
  trust_score:          0.25,
  rating:               0.20,
  distance_inverse:     0.15,  // 1/(distanceKm + 0.5) — closer scores higher
  verified:             0.15,
  recent_activity:      0.10,
  availability:         0.08,
  experience:           0.04,
  profile_completeness: 0.03,
  moderation_risk:     -0.10,  // subtracted — higher risk → lower score
});

// ── Filter definitions ───────────────────────────────────────
// type:
//   'toggle'  — boolean on/off button
//   'steps'   — row of preset value buttons (clicking active value resets to 0/'')
//   'options' — row of string value buttons (clicking active resets to '')
export const FILTER_DEFS = Object.freeze({
  availability: {
    key:   'availableOnly',
    type:  'toggle',
    label: 'Disponib',
    emoji: '🟢',
  },
  verified: {
    key:   'verifiedOnly',
    type:  'toggle',
    label: 'Verifye',
    emoji: '✅',
  },
  distance: {
    key:   'maxDistance',
    type:  'steps',
    steps: [2, 5, 10, 25],
    unit:  'km',
    label: 'Distans',
    emoji: '📍',
    zero:  0,    // 0 means "no distance filter"
  },
  rating: {
    key:   'minRating',
    type:  'steps',
    steps: [3, 4, 4.5],
    unit:  '★',
    label: 'Rating Min',
    emoji: '⭐',
    zero:  0,
  },
  trust_score: {
    key:   'minTrust',
    type:  'steps',
    steps: [50, 70, 90],
    unit:  '',
    label: 'Trust',
    emoji: '🛡️',
    zero:  0,
  },
  experience: {
    key:   'minExperience',
    type:  'steps',
    steps: [1, 3, 5, 10],
    unit:  'ans',
    label: 'Eksperyans',
    emoji: '🎓',
    zero:  0,
  },
  language: {
    key:     'language',
    type:    'options',
    options: ['HT', 'FR', 'EN', 'ES'],
    label:   'Lang',
    emoji:   '🌐',
    zero:    '',
  },
  country: {
    key:     'country',
    type:    'options',
    options: ['HT', 'DO', 'US', 'FR'],
    label:   'Peyi',
    emoji:   '🌍',
    zero:    '',
  },
  service_zone: {
    key:     'serviceZone',
    type:    'options',
    options: ['Nord', 'Sud', 'Est', 'Ouest', 'Centre'],
    label:   'Zòn Sèvis',
    emoji:   '🗺️',
    zero:    '',
  },
});

// Default filter state — all filters "off"
export const DEFAULT_FILTERS = Object.freeze({
  availableOnly: false,
  verifiedOnly:  false,
  maxDistance:   0,
  minRating:     0,
  minTrust:      0,
  minExperience: 0,
  language:      '',
  country:       '',
  serviceZone:   '',
});

// ── Per-role search configuration ────────────────────────────
// heading:        displayed above the search bar
// placeholder:    search input placeholder
// activeFilters:  keys into FILTER_DEFS shown for this role
// cardFields:     fields rendered on each result card (in order)
const ROLE_SEARCH_CONFIGS = {

  worker: {
    heading:       'Chèche Travay ak Sèvis',
    placeholder:   'Chèche sèvis, biznis, opòtinite...',
    activeFilters: ['availability', 'distance', 'rating', 'language'],
    cardFields:    ['profession', 'distance', 'rating', 'trust_score', 'availability'],
  },

  company: {
    heading:       'Chèche Travayè',
    placeholder:   'Chèche travayè, pwofesyonèl...',
    activeFilters: ['availability', 'distance', 'rating', 'trust_score', 'verified', 'experience'],
    cardFields:    ['profession', 'experience', 'trust_score', 'verified', 'rating', 'distance', 'availability'],
  },

  enterprise: {
    heading:       'Chèche Travayè ak Antrepriz',
    placeholder:   'Chèche travayè, konpayi, sèvis...',
    activeFilters: ['availability', 'distance', 'rating', 'trust_score', 'verified', 'experience', 'country'],
    cardFields:    ['profession', 'experience', 'trust_score', 'verified', 'rating', 'distance'],
  },

  restaurant: {
    heading:       'Chèche Pèsonèl Restoran',
    placeholder:   'Chèche chef, sèvè, livrezon...',
    activeFilters: ['availability', 'distance', 'rating', 'experience'],
    cardFields:    ['profession', 'experience', 'rating', 'availability', 'distance'],
  },

  hotel: {
    heading:       'Chèche Pèsonèl Hotel',
    placeholder:   'Chèche resepsyon, menmwi, transpò...',
    activeFilters: ['availability', 'distance', 'rating', 'experience', 'language'],
    cardFields:    ['profession', 'experience', 'language', 'rating', 'availability', 'distance'],
  },

  rental: {
    heading:       'Chèche Sèvis Rental',
    placeholder:   'Chèche jesyon pwopriyete, tekniyen...',
    activeFilters: ['availability', 'distance', 'rating', 'trust_score', 'verified'],
    cardFields:    ['profession', 'trust_score', 'verified', 'rating', 'availability', 'distance'],
  },

  office: {
    heading:       'Chèche Sèvis Biwo',
    placeholder:   'Chèche sekretè, kontab, lojisiel...',
    activeFilters: ['availability', 'distance', 'rating', 'experience'],
    cardFields:    ['profession', 'experience', 'availability', 'rating', 'distance'],
  },

  hospital: {
    heading:       'Chèche Pwofesyonèl Medikal',
    placeholder:   'Chèche doktè, enfèmyè, tekniyen...',
    activeFilters: ['availability', 'distance', 'rating', 'verified', 'trust_score', 'experience', 'language'],
    cardFields:    ['profession', 'experience', 'verified', 'trust_score', 'rating', 'availability', 'distance'],
  },

  clinic: {
    heading:       'Chèche Pwofesyonèl Sante',
    placeholder:   'Chèche pwofesyonèl sante, espesyalis...',
    activeFilters: ['availability', 'distance', 'rating', 'verified', 'experience'],
    cardFields:    ['profession', 'experience', 'verified', 'rating', 'availability', 'distance'],
  },

  tourism: {
    heading:       'Chèche Sèvis Turizm',
    placeholder:   'Chèche gid, aktivite, transpò, lodman...',
    activeFilters: ['availability', 'distance', 'rating', 'language', 'experience', 'service_zone'],
    cardFields:    ['profession', 'language', 'experience', 'rating', 'availability', 'distance'],
  },

  service_provider: {
    heading:       'Chèche Sèvis',
    placeholder:   'Chèche pwofesyonèl, sèvis sou demann...',
    activeFilters: ['availability', 'distance', 'rating', 'trust_score', 'experience', 'language'],
    cardFields:    ['profession', 'experience', 'trust_score', 'rating', 'availability', 'distance'],
  },

  marketplace: {
    heading:       'Chèche nan Makèt',
    placeholder:   'Chèche pwodwi, boutik, mak...',
    activeFilters: ['category', 'price_range', 'rating', 'distance', 'verified'],
    cardFields:    ['product_name', 'price', 'rating', 'distance', 'store_name'],
  },

  // Legacy aliases
  user:     null,
  business: null,
};

// Fallback for unknown or legacy roles
const FALLBACK_CONFIG = ROLE_SEARCH_CONFIGS.worker;

export const getSearchConfig = (role) =>
  ROLE_SEARCH_CONFIGS[role] || FALLBACK_CONFIG;

export default ROLE_SEARCH_CONFIGS;