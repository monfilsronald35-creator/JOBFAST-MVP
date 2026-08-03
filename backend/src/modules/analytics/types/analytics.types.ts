// ── Events ────────────────────────────────────────────────────────────────────
export type EventCategory =
  | 'user' | 'job' | 'payment' | 'chat' | 'search' | 'marketplace'
  | 'travel' | 'health' | 'telecom' | 'enterprise' | 'media' | 'system';

export interface AnalyticsEvent {
  id:          string;
  userId?:     string | undefined;
  sessionId?:  string | undefined;
  eventName:   string;
  category:    EventCategory;
  properties:  Record<string, unknown>;
  country?:    string | undefined;
  city?:       string | undefined;
  platform?:   'web' | 'mobile' | 'api' | undefined;
  occurredAt:  string;
}

// ── Session ───────────────────────────────────────────────────────────────────
export interface UserSession {
  id:          string;
  userId?:     string | undefined;
  startedAt:   string;
  endedAt?:    string | undefined;
  durationSec: number;
  pageViews:   number;
  events:      number;
  country?:    string | undefined;
  platform?:   string | undefined;
}

// ── KPIs ──────────────────────────────────────────────────────────────────────
export interface PlatformKPIs {
  period:           string;
  totalUsers:       number;
  activeUsers:      number;
  newUsers:         number;
  totalJobs:        number;
  jobsCompleted:    number;
  totalRevenue:     number;
  currency:         string;
  avgSessionSec:    number;
  retentionRate:    number;
  churRate:         number;
  topCountries:     Array<{ country: string; users: number }>;
  topCategories:    Array<{ category: EventCategory; count: number }>;
  conversionRate:   number;
  generatedAt:      string;
}

// ── Funnel ────────────────────────────────────────────────────────────────────
export interface FunnelStep {
  name:        string;
  count:       number;
  dropoffRate: number;
}

export interface FunnelReport {
  id:          string;
  name:        string;
  steps:       FunnelStep[];
  totalEntered: number;
  totalCompleted: number;
  overallRate: number;
  period:      string;
  createdAt:   string;
}

// ── Cohort ────────────────────────────────────────────────────────────────────
export interface CohortRow {
  cohort:      string;
  size:        number;
  week1:       number;
  week2:       number;
  week4:       number;
  week8:       number;
}

// ── Report ────────────────────────────────────────────────────────────────────
export type ReportType = 'revenue' | 'users' | 'jobs' | 'payments' | 'retention' | 'funnel' | 'cohort' | 'custom';

export interface AnalyticsReport {
  id:          string;
  ownerId:     string;
  name:        string;
  type:        ReportType;
  period:      string;
  filters:     Record<string, unknown>;
  data:        Record<string, unknown>;
  createdAt:   string;
}

// ── Real-time ─────────────────────────────────────────────────────────────────
export interface RealtimeMetrics {
  activeUsersNow:  number;
  eventsPerMinute: number;
  topPage:         string;
  revenueToday:    number;
  currency:        string;
  errorsPerMinute: number;
  generatedAt:     string;
}