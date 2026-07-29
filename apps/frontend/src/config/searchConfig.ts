export const RANKING_WEIGHTS = {
  trust_score:          0.25,
  rating:               0.20,
  distance_inverse:     0.15,
  verified:             0.15,
  recent_activity:      0.10,
  availability:         0.08,
  experience:           0.04,
  profile_completeness: 0.03,
  moderation_risk:     -0.10,
} as const;

// ── Filter definitions ────────────────────────────────────────

interface ToggleFilter {
  key: string;
  type: 'toggle';
  label: string;
  emoji: string;
}

interface StepsFilter {
  key: string;
  type: 'steps';
  steps: readonly number[];
  unit: string;
  label: string;
  emoji: string;
  zero: number;
}

interface OptionsFilter {
  key: string;
  type: 'options';
  options: readonly string[];
  label: string;
  emoji: string;
  zero: string;
}

export type FilterDef = ToggleFilter | StepsFilter | OptionsFilter;

export const FILTER_DEFS = {
  availability: {
    key:   'availableOnly',
    type:  'toggle',
    label: 'Disponib',
    emoji: '🟢',
  } satisfies ToggleFilter,

  verified: {
    key:   'verifiedOnly',
    type:  'toggle',
    label: 'Verifye',
    emoji: '✅',
  } satisfies ToggleFilter,

  distance: {
    key:   'maxDistance',
    type:  'steps',
    steps: [2, 5, 10, 25] as const,
    unit:  'km',
    label: 'Distans',
    emoji: '📍',
    zero:  0,
  } satisfies StepsFilter,

  rating: {
    key:   'minRating',
    type:  'steps',
    steps: [3, 4, 4.5] as const,
    unit:  '★',
    label: 'Rating Min',
    emoji: '⭐',
    zero:  0,
  } satisfies StepsFilter,

  trust_score: {
    key:   'minTrust',
    type:  'steps',
    steps: [50, 70, 90] as const,
    unit:  '',
    label: 'Trust',
    emoji: '🛡️',
    zero:  0,
  } satisfies StepsFilter,

  experience: {
    key:   'minExperience',
    type:  'steps',
    steps: [1, 3, 5, 10] as const,
    unit:  'ans',
    label: 'Eksperyans',
    emoji: '🎓',
    zero:  0,
  } satisfies StepsFilter,

  language: {
    key:     'language',
    type:    'options',
    options: ['HT', 'FR', 'EN', 'ES'] as const,
    label:   'Lang',
    emoji:   '🌐',
    zero:    '',
  } satisfies OptionsFilter,

  country: {
    key:     'country',
    type:    'options',
    options: ['HT', 'DO', 'US', 'FR'] as const,
    label:   'Peyi',
    emoji:   '🌍',
    zero:    '',
  } satisfies OptionsFilter,

  service_zone: {
    key:     'serviceZone',
    type:    'options',
    options: ['Nord', 'Sud', 'Est', 'Ouest', 'Centre'] as const,
    label:   'Zòn Sèvis',
    emoji:   '🗺️',
    zero:    '',
  } satisfies OptionsFilter,
} as const;

export type FilterKey = keyof typeof FILTER_DEFS;

export interface DefaultFilters {
  availableOnly: boolean;
  verifiedOnly:  boolean;
  maxDistance:   number;
  minRating:     number;
  minTrust:      number;
  minExperience: number;
  language:      string;
  country:       string;
  serviceZone:   string;
}

export const DEFAULT_FILTERS: DefaultFilters = {
  availableOnly: false,
  verifiedOnly:  false,
  maxDistance:   0,
  minRating:     0,
  minTrust:      0,
  minExperience: 0,
  language:      '',
  country:       '',
  serviceZone:   '',
};

export interface SearchConfig {
  heading:       string;
  placeholder:   string;
  activeFilters: string[];
  cardFields:    string[];
}

const ROLE_SEARCH_CONFIGS: Record<string, SearchConfig | null> = {
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
  user:     null,
  business: null,
};

const FALLBACK_CONFIG = ROLE_SEARCH_CONFIGS['worker'] as SearchConfig;

export function getSearchConfig(role: string): SearchConfig {
  return ROLE_SEARCH_CONFIGS[role] ?? FALLBACK_CONFIG;
}

export default ROLE_SEARCH_CONFIGS;