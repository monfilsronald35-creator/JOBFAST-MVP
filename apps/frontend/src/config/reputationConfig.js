/**
 * reputationConfig.js
 *
 * Single source of truth for Trust, Reputation, Review, Complaint,
 * Verification, and Badge behavior across all JOBFAST roles.
 *
 * No role-specific logic in component code — everything derives from here.
 * Mirrors backend/src/utils/reputation.js for consistent scoring.
 */

// ── Trust Score Weights ───────────────────────────────────────
// Must sum to 100 maximum possible points.
export const TRUST_WEIGHTS = {
  base:               20,  // everyone starts with 20
  completedJobs:      20,  // capped: min(20, jobs * 2)
  rating:             15,  // (avgRating - 1) / 4 * 15
  profileCompleteness: 10, // completeness% / 100 * 10
  verified:           10,  // flat +10 if user.verified
  verificationDepth:  10,  // +2 per verified document type (max 10)
  reviewQuality:       8,  // count + avg quality signal
  recentActivity:      5,  // active in last 30 days
  badges:              2,  // 0.5 per badge (max 4 badges = 2pts)
  // Penalties (subtracted, always negative)
  complaintPenalty:  -10,  // -2 per open complaint (min -10)
  fraudPenalty:      -10,  // -10 if fraud flags > 2
  spamPenalty:        -5,  // -5 if spam score > 5
};

// ── Trust Score Tiers ─────────────────────────────────────────
export const TRUST_TIERS = [
  { min: 90, label: 'Eksèlan',   color: '#22c55e', emoji: '🌟' },
  { min: 75, label: 'Trè Bon',  color: '#84cc16', emoji: '⭐' },
  { min: 55, label: 'Bon',       color: '#f59e0b', emoji: '👍' },
  { min: 35, label: 'Modere',    color: '#f97316', emoji: '⚠️' },
  { min:  0, label: 'Fèb',       color: '#ef4444', emoji: '🔴' },
];

export function getTrustTier(score) {
  return TRUST_TIERS.find(t => score >= t.min) ?? TRUST_TIERS[TRUST_TIERS.length - 1];
}

// ── Profile Completeness Fields per Role ─────────────────────
// Each entry: [fieldKey, weight, label]
// weight is how many points it contributes out of 100 total.
export const COMPLETENESS_FIELDS_BASE = [
  { key: 'photo',      label: 'Foto Pwofil',    weight: 12 },
  { key: 'name',       label: 'Non Konplè',     weight: 10 },
  { key: 'email',      label: 'Imèl',           weight:  8 },
  { key: 'phone',      label: 'Telefòn',        weight:  8 },
  { key: 'bio',        label: 'Bio / Deskripsyon', weight: 10 },
  { key: 'city',       label: 'Vil / Adres',    weight:  8 },
  { key: 'country',    label: 'Peyi',           weight:  5 },
  { key: 'skills',     label: 'Konpetans',      weight: 10 },
  { key: 'languages',  label: 'Lang',           weight:  5 },
  { key: 'verified',   label: 'Verifikasyon',   weight: 12 },
  { key: 'experience', label: 'Eksperyans',     weight: 12 },
];

export const COMPLETENESS_FIELDS_EXTRA = {
  worker: [
    { key: 'certifications', label: 'Sètifika',     weight: 5 },
    { key: 'portfolio',      label: 'Pòtfòlyo',     weight: 5 },
  ],
  company: [
    { key: 'description',    label: 'Deskripsyon Biznis', weight: 5 },
    { key: 'website',        label: 'Sit Entènèt',         weight: 5 },
  ],
  enterprise: [
    { key: 'industries',     label: 'Sektè Aktivite',  weight: 5 },
    { key: 'website',        label: 'Sit Entènèt',     weight: 5 },
  ],
  restaurant: [
    { key: 'cuisine',        label: 'Tip Kwizin',      weight: 5 },
    { key: 'menu',           label: 'Menu',            weight: 5 },
  ],
  hotel: [
    { key: 'room_count',     label: 'Kantite Chanm',   weight: 5 },
    { key: 'amenities',      label: 'Sèvis',           weight: 5 },
  ],
  hospital: [
    { key: 'specialties',    label: 'Spesyalite',      weight: 5 },
    { key: 'license_number', label: 'Nimewo Lisans',   weight: 5 },
  ],
  clinic: [
    { key: 'specialties',    label: 'Spesyalite',      weight: 5 },
    { key: 'license_number', label: 'Nimewo Lisans',   weight: 5 },
  ],
};

export function getCompletenessFields(role) {
  return [
    ...COMPLETENESS_FIELDS_BASE,
    ...(COMPLETENESS_FIELDS_EXTRA[role] ?? []),
  ];
}

// ── Badge Definitions ─────────────────────────────────────────
// criteria: function(user, reputationData) → boolean
// Auto-generated server-side; config used client-side for display.
export const BADGE_DEFINITIONS = [
  {
    id:          'verified',
    label:       'Verifye',
    icon:        '✅',
    color:       '#3b82f6',
    description: 'Idantite konfime pa JOBFAST',
    criteria:    (u) => !!u.verified,
  },
  {
    id:          'trusted',
    label:       'Fè Konfyans',
    icon:        '🛡️',
    color:       '#8b5cf6',
    description: 'Nivo konfyans ≥ 80',
    criteria:    (u, rd) => (rd?.trustScore ?? 0) >= 80,
  },
  {
    id:          'top_worker',
    label:       'Travayè Tèt',
    icon:        '🏆',
    color:       '#f59e0b',
    description: 'Travayè avèk 10+ travay fini ak rating ≥ 4.5',
    criteria:    (u, rd) => {
      const jobs = rd?.workerReviews?.length ?? (u.stats?.totalJobs ?? 0);
      const rating = u.stats?.rating ?? rd?.avgRating ?? 0;
      return u.role === 'worker' && jobs >= 10 && rating >= 4.5;
    },
  },
  {
    id:          'top_company',
    label:       'Meye Konpayi',
    icon:        '🏢',
    color:       '#6366f1',
    description: 'Konpayi avèk 5+ anplwaye ak rating bon',
    criteria:    (u) => {
      const isCompany = ['company', 'enterprise'].includes(u.role);
      const employees = (u.companyData?.employees || u.enterpriseData?.employees || []).filter(
        e => e.status === 'active'
      ).length;
      return isCompany && employees >= 5;
    },
  },
  {
    id:          'highly_rated',
    label:       'Evalyasyon Wo',
    icon:        '⭐',
    color:       '#eab308',
    description: 'Rating mwayèn ≥ 4.8',
    criteria:    (u, rd) => (rd?.avgRating ?? u.stats?.rating ?? 0) >= 4.8,
  },
  {
    id:          'excellent_employer',
    label:       'Bon Patwon',
    icon:        '🤝',
    color:       '#10b981',
    description: 'Konpayi san plent ak 5+ travayè rekrite',
    criteria:    (u) => {
      const isEmployer = ['company', 'enterprise'].includes(u.role);
      const complaints = (u.reputationData?.complaints || []).filter(
        c => c.status === 'resolved' && c.resolution === 'against'
      ).length;
      const hired = (u.companyData?.employees || u.enterpriseData?.employees || []).length;
      return isEmployer && complaints === 0 && hired >= 5;
    },
  },
  {
    id:          'fast_responder',
    label:       'Repons Rapid',
    icon:        '⚡',
    color:       '#f97316',
    description: '20+ rezèvasyon / aplikasyon konfime',
    criteria:    (u) => {
      const bookings = (u.marketplaceData?.bookings || []).filter(b => b.status === 'confirmed').length;
      const jobs     = (u.companyData?.jobs || []).filter(j => ['confirmed','hired'].includes(j.status)).length;
      return bookings + jobs >= 20;
    },
  },
  {
    id:          'premium_business',
    label:       'Biznis Premium',
    icon:        '💎',
    color:       '#0ea5e9',
    description: 'Biznis verifye avèk 10+ tranzaksyon',
    criteria:    (u, rd) => {
      const isProvider = ['restaurant','hotel','rental','office','tourism','hospital','clinic','service_provider'].includes(u.role);
      const bookings = (u.marketplaceData?.bookings || []).length;
      return isProvider && !!u.verified && bookings >= 10;
    },
  },
  {
    id:          'expert',
    label:       'Ekspè',
    icon:        '🎓',
    color:       '#14b8a6',
    description: 'Travayè avèk 5+ ane eksperyans',
    criteria:    (u) => u.role === 'worker' && (u.experience ?? u.profileMetadata?.yearsExperience ?? 0) >= 5,
  },
  {
    id:          'master',
    label:       'Mèt Pwofesyonèl',
    icon:        '🌟',
    color:       '#a855f7',
    description: 'Travayè avèk 15+ travay fini ak rating ≥ 4.9',
    criteria:    (u, rd) => {
      const jobs   = u.stats?.totalJobs ?? (rd?.workerReviews?.length ?? 0);
      const rating = rd?.avgRating ?? u.stats?.rating ?? 0;
      return u.role === 'worker' && jobs >= 15 && rating >= 4.9;
    },
  },
];

export function computeBadgesForUser(user, reputationData) {
  return BADGE_DEFINITIONS
    .filter(b => {
      try { return b.criteria(user, reputationData); } catch { return false; }
    })
    .map(({ id, label, icon, color, description }) => ({
      id, label, icon, color, description,
      awardedAt: new Date().toISOString(),
    }));
}

// ── Complaint Categories ──────────────────────────────────────
export const COMPLAINT_CATEGORIES = [
  { id: 'payment',        label: 'Pwoblèm Peman',        icon: '💳' },
  { id: 'no_show',        label: 'Absan San Preyavi',    icon: '🚫' },
  { id: 'poor_quality',   label: 'Travay Pa Bon',        icon: '👎' },
  { id: 'harassment',     label: 'Asèlman',              icon: '⚠️' },
  { id: 'fraud',          label: 'Fwòd / Eskok',        icon: '🔴' },
  { id: 'discrimination', label: 'Diskriminasyon',       icon: '❌' },
  { id: 'breach',         label: 'Non-Respè Kontra',     icon: '📋' },
  { id: 'safety',         label: 'Pwoblèm Sekirite',    icon: '🛡️' },
  { id: 'other',          label: 'Lòt',                  icon: '❓' },
];

// ── Complaint Lifecycle ───────────────────────────────────────
export const COMPLAINT_STATUSES = {
  OPEN:           { id: 'open',          label: 'Louvri',          color: '#f59e0b' },
  UNDER_REVIEW:   { id: 'under_review',  label: 'Anba Revizyon',  color: '#3b82f6' },
  INVESTIGATING:  { id: 'investigating', label: 'Envestigasyon',   color: '#8b5cf6' },
  RESOLVED:       { id: 'resolved',      label: 'Rezoud',          color: '#22c55e' },
  REJECTED:       { id: 'rejected',      label: 'Rejete',          color: '#ef4444' },
  ESCALATED:      { id: 'escalated',     label: 'Eskalasyon',      color: '#f97316' },
  CLOSED:         { id: 'closed',        label: 'Fèmen',           color: '#6b7280' },
};

export const COMPLAINT_STATUS_LIST = Object.values(COMPLAINT_STATUSES);

// Legal transitions in the complaint lifecycle
export const COMPLAINT_TRANSITIONS = {
  open:          ['under_review', 'rejected', 'closed'],
  under_review:  ['investigating', 'resolved', 'rejected'],
  investigating: ['resolved', 'rejected', 'escalated'],
  resolved:      ['closed', 'escalated'],   // appeal can escalate
  rejected:      ['closed', 'escalated'],   // appeal can escalate
  escalated:     ['resolved', 'closed'],
  closed:        [],                         // terminal
};

// ── Verification Types ────────────────────────────────────────
export const VERIFICATION_TYPES = [
  { id: 'identity',  label: 'Idantite',           icon: '🪪', requiredFor: ['all'] },
  { id: 'business',  label: 'Biznis / Enstitisyon', icon: '🏢', requiredFor: ['company','enterprise','restaurant','hotel','rental','tourism','hospital','clinic','service_provider'] },
  { id: 'document',  label: 'Dokiman Ofisyèl',    icon: '📄', requiredFor: ['all'] },
  { id: 'license',   label: 'Lisans Pwofesyonèl', icon: '📋', requiredFor: ['hospital','clinic','worker','service_provider'] },
  { id: 'address',   label: 'Adres',              icon: '📍', requiredFor: ['all'] },
];

export const VERIFICATION_STATUSES = {
  NOT_REQUESTED: null,
  PENDING:       'pending',
  VERIFIED:      'verified',
  REJECTED:      'rejected',
};

// ── Relationship Types (for review + complaint eligibility) ───
// Maps a reviewer role to valid target roles.
export const ELIGIBLE_RELATIONSHIPS = {
  worker:           ['company', 'enterprise'],
  user:             ['restaurant', 'hotel', 'rental', 'tourism', 'hospital', 'clinic', 'service_provider', 'worker'],
  company:          ['worker', 'service_provider'],
  enterprise:       ['worker', 'service_provider', 'company'],
  restaurant:       ['user', 'worker'],
  hotel:            ['user', 'worker'],
  rental:           ['user'],
  tourism:          ['user'],
  hospital:         ['user', 'worker'],
  clinic:           ['user', 'worker'],
  service_provider: ['user', 'company', 'enterprise'],
};

export function canReview(reviewerRole, targetRole) {
  return (ELIGIBLE_RELATIONSHIPS[reviewerRole] ?? []).includes(targetRole);
}

// ── Fake Review Detection Rules ───────────────────────────────
export const FAKE_REVIEW_SIGNALS = {
  newAccount:          { label: 'Nouvo kont (<7 jou)',        scoreImpact: 3 },
  ratingTooExtreme:    { label: 'Rating ekstrèm san komantè', scoreImpact: 2 },
  duplicateReviewer:   { label: 'Deja evalye sa a',           scoreImpact: 10 },
  selfReview:          { label: 'Evalyasyon tèt li',          scoreImpact: 10 },
  suspiciousPattern:   { label: 'Patenal enstantane',         scoreImpact: 4 },
  noInteraction:       { label: 'Pa gen relasyon verifye',    scoreImpact: 8 },
};

// Threshold above which review is flagged for moderation
export const FAKE_REVIEW_FLAG_THRESHOLD = 5;

// ── Spam Detection Thresholds ─────────────────────────────────
export const SPAM_THRESHOLDS = {
  reviewsPerHour:       3,   // more than 3 reviews in 1 hour → spam
  complaintsPerDay:     2,   // more than 2 complaints per day → spam
  applicationsPerHour: 10,   // more than 10 applications in 1 hour → spam
};

// ── Search Ranking Weights ────────────────────────────────────
// Used to compute a search relevance score 0-100 for each candidate.
export const SEARCH_RANK_WEIGHTS = {
  textMatch:        0.35,  // exact/partial query match
  trustScore:       0.25,  // normalized trust score
  rating:           0.20,  // normalized avg rating
  distance:         0.10,  // proximity (inverse)
  completeness:     0.05,  // profile completeness
  verified:         0.05,  // boolean bonus
};