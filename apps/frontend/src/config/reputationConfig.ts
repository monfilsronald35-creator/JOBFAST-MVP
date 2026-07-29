export const TRUST_WEIGHTS = {
  base:                20,
  completedJobs:       20,
  rating:              15,
  profileCompleteness: 10,
  verified:            10,
  verificationDepth:   10,
  reviewQuality:        8,
  recentActivity:       5,
  badges:               2,
  complaintPenalty:   -10,
  fraudPenalty:       -10,
  spamPenalty:         -5,
} as const;

export interface TrustTier {
  min: number;
  label: string;
  color: string;
  emoji: string;
}

export const TRUST_TIERS: readonly TrustTier[] = [
  { min: 90, label: 'Eksèlan',  color: '#22c55e', emoji: '🌟' },
  { min: 75, label: 'Trè Bon', color: '#84cc16', emoji: '⭐' },
  { min: 55, label: 'Bon',      color: '#f59e0b', emoji: '👍' },
  { min: 35, label: 'Modere',   color: '#f97316', emoji: '⚠️' },
  { min:  0, label: 'Fèb',      color: '#ef4444', emoji: '🔴' },
];

export function getTrustTier(score: number): TrustTier {
  return TRUST_TIERS.find((t) => score >= t.min) ?? TRUST_TIERS[TRUST_TIERS.length - 1]!;
}

export interface CompletenessField {
  key: string;
  label: string;
  weight: number;
}

export const COMPLETENESS_FIELDS_BASE: readonly CompletenessField[] = [
  { key: 'photo',      label: 'Foto Pwofil',      weight: 12 },
  { key: 'name',       label: 'Non Konplè',       weight: 10 },
  { key: 'email',      label: 'Imèl',             weight:  8 },
  { key: 'phone',      label: 'Telefòn',          weight:  8 },
  { key: 'bio',        label: 'Bio / Deskripsyon', weight: 10 },
  { key: 'city',       label: 'Vil / Adres',      weight:  8 },
  { key: 'country',    label: 'Peyi',             weight:  5 },
  { key: 'skills',     label: 'Konpetans',        weight: 10 },
  { key: 'languages',  label: 'Lang',             weight:  5 },
  { key: 'verified',   label: 'Verifikasyon',     weight: 12 },
  { key: 'experience', label: 'Eksperyans',       weight: 12 },
];

export const COMPLETENESS_FIELDS_EXTRA: Record<string, readonly CompletenessField[]> = {
  worker: [
    { key: 'certifications', label: 'Sètifika',          weight: 5 },
    { key: 'portfolio',      label: 'Pòtfòlyo',          weight: 5 },
  ],
  company: [
    { key: 'description',    label: 'Deskripsyon Biznis', weight: 5 },
    { key: 'website',        label: 'Sit Entènèt',        weight: 5 },
  ],
  enterprise: [
    { key: 'industries',     label: 'Sektè Aktivite',    weight: 5 },
    { key: 'website',        label: 'Sit Entènèt',       weight: 5 },
  ],
  restaurant: [
    { key: 'cuisine',        label: 'Tip Kwizin',        weight: 5 },
    { key: 'menu',           label: 'Menu',              weight: 5 },
  ],
  hotel: [
    { key: 'room_count',     label: 'Kantite Chanm',     weight: 5 },
    { key: 'amenities',      label: 'Sèvis',             weight: 5 },
  ],
  hospital: [
    { key: 'specialties',    label: 'Spesyalite',        weight: 5 },
    { key: 'license_number', label: 'Nimewo Lisans',     weight: 5 },
  ],
  clinic: [
    { key: 'specialties',    label: 'Spesyalite',        weight: 5 },
    { key: 'license_number', label: 'Nimewo Lisans',     weight: 5 },
  ],
};

export function getCompletenessFields(role: string): CompletenessField[] {
  return [
    ...COMPLETENESS_FIELDS_BASE,
    ...(COMPLETENESS_FIELDS_EXTRA[role] ?? []),
  ];
}

type AnyUser = Record<string, unknown>;
type ReputationData = Record<string, unknown> | null | undefined;

export interface BadgeDefinition {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  criteria: (user: AnyUser, reputationData?: ReputationData) => boolean;
}

export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  {
    id:          'verified',
    label:       'Verifye',
    icon:        '✅',
    color:       '#3b82f6',
    description: 'Idantite konfime pa JOBFAST',
    criteria:    (u) => !!u['verified'],
  },
  {
    id:          'trusted',
    label:       'Fè Konfyans',
    icon:        '🛡️',
    color:       '#8b5cf6',
    description: 'Nivo konfyans ≥ 80',
    criteria:    (_u, rd) => ((rd?.['trustScore'] as number) ?? 0) >= 80,
  },
  {
    id:          'top_worker',
    label:       'Travayè Tèt',
    icon:        '🏆',
    color:       '#f59e0b',
    description: 'Travayè avèk 10+ travay fini ak rating ≥ 4.5',
    criteria:    (u, rd) => {
      const reviews = rd?.['workerReviews'];
      const jobs   = Array.isArray(reviews) ? reviews.length : ((u['stats'] as AnyUser | undefined)?.['totalJobs'] as number | undefined) ?? 0;
      const stats  = u['stats'] as AnyUser | undefined;
      const rating = (stats?.['rating'] as number | undefined) ?? ((rd?.['avgRating'] as number | undefined) ?? 0);
      return u['role'] === 'worker' && jobs >= 10 && rating >= 4.5;
    },
  },
  {
    id:          'top_company',
    label:       'Meye Konpayi',
    icon:        '🏢',
    color:       '#6366f1',
    description: 'Konpayi avèk 5+ anplwaye ak rating bon',
    criteria:    (u) => {
      const isCompany = ['company', 'enterprise'].includes(u['role'] as string);
      const companyEmps   = (u['companyData'] as AnyUser | undefined)?.['employees'];
      const enterpriseEmps = (u['enterpriseData'] as AnyUser | undefined)?.['employees'];
      const emps = Array.isArray(companyEmps) ? companyEmps : (Array.isArray(enterpriseEmps) ? enterpriseEmps : []);
      const count = (emps as AnyUser[]).filter((e) => e['status'] === 'active').length;
      return isCompany && count >= 5;
    },
  },
  {
    id:          'highly_rated',
    label:       'Evalyasyon Wo',
    icon:        '⭐',
    color:       '#eab308',
    description: 'Rating mwayèn ≥ 4.8',
    criteria:    (u, rd) => ((rd?.['avgRating'] as number | undefined) ?? ((u['stats'] as AnyUser | undefined)?.['rating'] as number | undefined) ?? 0) >= 4.8,
  },
  {
    id:          'excellent_employer',
    label:       'Bon Patwon',
    icon:        '🤝',
    color:       '#10b981',
    description: 'Konpayi san plent ak 5+ travayè rekrite',
    criteria:    (u) => {
      const isEmployer = ['company', 'enterprise'].includes(u['role'] as string);
      const repData = u['reputationData'] as AnyUser | undefined;
      const complaints = (Array.isArray(repData?.['complaints']) ? repData!['complaints'] as AnyUser[] : [])
        .filter((c) => c['status'] === 'resolved' && c['resolution'] === 'against').length;
      const companyEmps   = (u['companyData'] as AnyUser | undefined)?.['employees'];
      const enterpriseEmps = (u['enterpriseData'] as AnyUser | undefined)?.['employees'];
      const hired = Array.isArray(companyEmps) ? companyEmps.length : (Array.isArray(enterpriseEmps) ? enterpriseEmps.length : 0);
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
      const mkt  = u['marketplaceData'] as AnyUser | undefined;
      const cmp  = u['companyData']    as AnyUser | undefined;
      const bookings = (Array.isArray(mkt?.['bookings']) ? mkt!['bookings'] as AnyUser[] : []).filter((b) => b['status'] === 'confirmed').length;
      const jobs     = (Array.isArray(cmp?.['jobs'])     ? cmp!['jobs']     as AnyUser[] : []).filter((j) => ['confirmed', 'hired'].includes(j['status'] as string)).length;
      return bookings + jobs >= 20;
    },
  },
  {
    id:          'premium_business',
    label:       'Biznis Premium',
    icon:        '💎',
    color:       '#0ea5e9',
    description: 'Biznis verifye avèk 10+ tranzaksyon',
    criteria:    (u) => {
      const isProvider = ['restaurant','hotel','rental','office','tourism','hospital','clinic','service_provider'].includes(u['role'] as string);
      const mkt = u['marketplaceData'] as AnyUser | undefined;
      const bookings = Array.isArray(mkt?.['bookings']) ? (mkt!['bookings'] as unknown[]).length : 0;
      return isProvider && !!u['verified'] && bookings >= 10;
    },
  },
  {
    id:          'expert',
    label:       'Ekspè',
    icon:        '🎓',
    color:       '#14b8a6',
    description: 'Travayè avèk 5+ ane eksperyans',
    criteria:    (u) => u['role'] === 'worker' && ((u['experience'] as number | undefined) ?? ((u['profileMetadata'] as AnyUser | undefined)?.['yearsExperience'] as number | undefined) ?? 0) >= 5,
  },
  {
    id:          'master',
    label:       'Mèt Pwofesyonèl',
    icon:        '🌟',
    color:       '#a855f7',
    description: 'Travayè avèk 15+ travay fini ak rating ≥ 4.9',
    criteria:    (u, rd) => {
      const stats = u['stats'] as AnyUser | undefined;
      const reviews = rd?.['workerReviews'];
      const jobs   = (stats?.['totalJobs'] as number | undefined) ?? (Array.isArray(reviews) ? reviews.length : 0);
      const rating = (rd?.['avgRating'] as number | undefined) ?? (stats?.['rating'] as number | undefined) ?? 0;
      return u['role'] === 'worker' && jobs >= 15 && rating >= 4.9;
    },
  },
];

export interface ComputedBadge {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  awardedAt: string;
}

export function computeBadgesForUser(user: AnyUser, reputationData: ReputationData): ComputedBadge[] {
  return BADGE_DEFINITIONS
    .filter((b) => {
      try { return b.criteria(user, reputationData); } catch { return false; }
    })
    .map(({ id, label, icon, color, description }) => ({
      id, label, icon, color, description,
      awardedAt: new Date().toISOString(),
    }));
}

export interface ComplaintCategory {
  id: string;
  label: string;
  icon: string;
}

export const COMPLAINT_CATEGORIES: readonly ComplaintCategory[] = [
  { id: 'payment',        label: 'Pwoblèm Peman',       icon: '💳' },
  { id: 'no_show',        label: 'Absan San Preyavi',   icon: '🚫' },
  { id: 'poor_quality',   label: 'Travay Pa Bon',       icon: '👎' },
  { id: 'harassment',     label: 'Asèlman',             icon: '⚠️' },
  { id: 'fraud',          label: 'Fwòd / Eskok',       icon: '🔴' },
  { id: 'discrimination', label: 'Diskriminasyon',      icon: '❌' },
  { id: 'breach',         label: 'Non-Respè Kontra',    icon: '📋' },
  { id: 'safety',         label: 'Pwoblèm Sekirite',   icon: '🛡️' },
  { id: 'other',          label: 'Lòt',                 icon: '❓' },
];

export interface ComplaintStatus {
  id: string;
  label: string;
  color: string;
}

export const COMPLAINT_STATUSES: Record<string, ComplaintStatus> = {
  OPEN:          { id: 'open',          label: 'Louvri',         color: '#f59e0b' },
  UNDER_REVIEW:  { id: 'under_review',  label: 'Anba Revizyon', color: '#3b82f6' },
  INVESTIGATING: { id: 'investigating', label: 'Envestigasyon',  color: '#8b5cf6' },
  RESOLVED:      { id: 'resolved',      label: 'Rezoud',         color: '#22c55e' },
  REJECTED:      { id: 'rejected',      label: 'Rejete',         color: '#ef4444' },
  ESCALATED:     { id: 'escalated',     label: 'Eskalasyon',     color: '#f97316' },
  CLOSED:        { id: 'closed',        label: 'Fèmen',          color: '#6b7280' },
};

export const COMPLAINT_STATUS_LIST: ComplaintStatus[] = Object.values(COMPLAINT_STATUSES);

export const COMPLAINT_TRANSITIONS: Record<string, readonly string[]> = {
  open:          ['under_review', 'rejected', 'closed'],
  under_review:  ['investigating', 'resolved', 'rejected'],
  investigating: ['resolved', 'rejected', 'escalated'],
  resolved:      ['closed', 'escalated'],
  rejected:      ['closed', 'escalated'],
  escalated:     ['resolved', 'closed'],
  closed:        [],
};

export interface VerificationType {
  id: string;
  label: string;
  icon: string;
  requiredFor: readonly string[];
}

export const VERIFICATION_TYPES: readonly VerificationType[] = [
  { id: 'identity', label: 'Idantite',            icon: '🪪', requiredFor: ['all'] },
  { id: 'business', label: 'Biznis / Enstitisyon', icon: '🏢', requiredFor: ['company','enterprise','restaurant','hotel','rental','tourism','hospital','clinic','service_provider'] },
  { id: 'document', label: 'Dokiman Ofisyèl',     icon: '📄', requiredFor: ['all'] },
  { id: 'license',  label: 'Lisans Pwofesyonèl',  icon: '📋', requiredFor: ['hospital','clinic','worker','service_provider'] },
  { id: 'address',  label: 'Adres',               icon: '📍', requiredFor: ['all'] },
];

export const VERIFICATION_STATUSES = {
  NOT_REQUESTED: null,
  PENDING:       'pending',
  VERIFIED:      'verified',
  REJECTED:      'rejected',
} as const;

export const ELIGIBLE_RELATIONSHIPS: Record<string, readonly string[]> = {
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

export function canReview(reviewerRole: string, targetRole: string): boolean {
  return (ELIGIBLE_RELATIONSHIPS[reviewerRole] ?? []).includes(targetRole);
}

export interface FakeReviewSignal {
  label: string;
  scoreImpact: number;
}

export const FAKE_REVIEW_SIGNALS: Record<string, FakeReviewSignal> = {
  newAccount:        { label: 'Nouvo kont (<7 jou)',        scoreImpact:  3 },
  ratingTooExtreme:  { label: 'Rating ekstrèm san komantè', scoreImpact:  2 },
  duplicateReviewer: { label: 'Deja evalye sa a',           scoreImpact: 10 },
  selfReview:        { label: 'Evalyasyon tèt li',          scoreImpact: 10 },
  suspiciousPattern: { label: 'Patenal enstantane',         scoreImpact:  4 },
  noInteraction:     { label: 'Pa gen relasyon verifye',    scoreImpact:  8 },
};

export const FAKE_REVIEW_FLAG_THRESHOLD = 5;

export const SPAM_THRESHOLDS = {
  reviewsPerHour:      3,
  complaintsPerDay:    2,
  applicationsPerHour: 10,
} as const;

export const SEARCH_RANK_WEIGHTS = {
  textMatch:    0.35,
  trustScore:   0.25,
  rating:       0.20,
  distance:     0.10,
  completeness: 0.05,
  verified:     0.05,
} as const;