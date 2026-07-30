export interface ReputationScore {
  userId:          string;
  // Core metrics
  rating:          number;    // 0–5 stars (avg of reviews)
  reviewCount:     number;
  successRate:     number;    // 0–100%
  completionRate:  number;    // 0–100%
  cancellationRate: number;   // 0–100%
  complaintRate:   number;    // 0–100%
  // Composite scores (0–100)
  trustScore:      number;
  reliabilityScore: number;
  overallScore:    number;
  // Trend
  trend:           'up' | 'down' | 'stable';
  lastCalculated:  string;
}

export interface AIProfileScore {
  userId:            string;
  aiScore:           number;   // 0–100 overall AI assessment
  hiringProbability: number;   // 0–100%
  marketplaceScore:  number;   // 0–100
  trustScore:        number;   // 0–100
  visibilityScore:   number;   // 0–100
  completenessScore: number;   // 0–100 how complete the profile is
  strengths:         string[];
  weaknesses:        string[];
  suggestedImprovements: string[];
  lastAnalyzed:      string;
}

export interface ReviewRecord {
  id:          string;
  userId:      string;           // reviewed user
  reviewerId:  string;
  rating:      number;           // 1–5
  comment?:    string;
  context:     'job' | 'marketplace' | 'service' | 'travel' | 'general';
  contextId?:  string;           // job ID, order ID, etc.
  isVerified:  boolean;          // came from completed transaction
  createdAt:   string;
  updatedAt:   string;
}

export interface ReputationEvent {
  id:         string;
  userId:     string;
  eventType:  string;   // 'job_completed', 'review_received', 'complaint_filed', etc.
  impact:     number;   // -10 to +10 score impact
  details:    Record<string, unknown>;
  occurredAt: string;
}
