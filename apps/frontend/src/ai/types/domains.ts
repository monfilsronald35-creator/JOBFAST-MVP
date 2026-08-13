// ─── Domain-specific AI types ─────────────────────────────────────────────────

// ─── Search ───────────────────────────────────────────────────────────────────

export type SearchMode = 'keyword' | 'semantic' | 'vector' | 'nlp' | 'image' | 'voice' | 'ocr';

export interface AISearchRequest {
  query: string;
  modes: SearchMode[];
  domain?: string;
  filters?: Record<string, unknown>;
  limit?: number;
  userId?: string;
  language?: string;
  imageData?: string; // base64 for image search
  audioData?: string; // base64 for voice search
  ocrImage?: string; // base64 for OCR search
}

export interface AISearchHit {
  id: string;
  score: number;
  title: string;
  description?: string;
  type: string;
  url?: string;
  image?: string;
  highlights?: string[];
  metadata: Record<string, unknown>;
}

export interface AISearchResult {
  items: AISearchHit[];
  query: string;
  interpretedQuery?: string;
  suggestions?: string[];
  facets?: Record<string, number>;
  totalResults: number;
  searchLatencyMs: number;
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export type RecommendationDomain =
  | 'job'
  | 'client'
  | 'product'
  | 'service'
  | 'hotel'
  | 'restaurant'
  | 'travel'
  | 'rental'
  | 'event'
  | 'finance'
  | 'training';

export interface RecommendationRequest {
  userId: string;
  domain: RecommendationDomain;
  limit?: number;
  context?: {
    currentItemId?: string;
    recentActions?: string[];
    location?: { lat: number; lng: number };
    budget?: number;
    currency?: string;
    preferences?: Record<string, unknown>;
  };
}

export interface RecommendationItem {
  id: string;
  domain: RecommendationDomain;
  title: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
  score: number;
  reason: string;
  metadata: Record<string, unknown>;
}

// ─── Matching ─────────────────────────────────────────────────────────────────

export type MatchDomain =
  | 'worker_company'
  | 'client_provider'
  | 'buyer_seller'
  | 'hotel_guest'
  | 'driver_passenger'
  | 'tourist_guide';

export interface MatchRequest {
  domain: MatchDomain;
  subjectId: string;
  subjectType: 'seeker' | 'provider';
  limit?: number;
  filters?: Record<string, unknown>;
}

export interface MatchResult {
  matchId: string;
  subjectId: string;
  candidateId: string;
  score: number; // 0-100
  reasons: string[];
  domain: MatchDomain;
  metadata: Record<string, unknown>;
}

// ─── Fraud ────────────────────────────────────────────────────────────────────

export type FraudSignalType =
  | 'fake_account'
  | 'fake_job'
  | 'fake_review'
  | 'fake_payment'
  | 'spam'
  | 'scam'
  | 'bot_activity'
  | 'money_laundering'
  | 'suspicious_login'
  | 'device_risk';

export interface FraudSignal {
  type: FraudSignalType;
  score: number; // 0-100
  evidence: string[];
  confidence: number; // 0-100
}

export interface FraudAssessment {
  entityId: string;
  entityType: 'user' | 'job' | 'review' | 'payment' | 'device' | 'session';
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: FraudSignal[];
  recommendation: 'allow' | 'review' | 'block';
  confidence: number;
  timestamp: number;
}

// ─── Translation ──────────────────────────────────────────────────────────────

export type TranslationDomain =
  'chat' | 'job' | 'marketplace' | 'review' | 'contract' | 'notification' | 'post' | 'general';

export interface TranslationRequest {
  text: string;
  sourceLang?: string; // auto-detect if omitted
  targetLang: string;
  domain?: TranslationDomain;
  formality?: 'formal' | 'informal';
}

export interface TranslationResult {
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
  confidence: number;
  provider?: string;
}

// ─── Voice ────────────────────────────────────────────────────────────────────

export type VoiceRequestType = 'stt' | 'tts' | 'command' | 'translation' | 'assistant';

export interface VoiceRequest {
  type: VoiceRequestType;
  audioData?: string; // base64 for STT
  text?: string; // for TTS
  language?: string;
  targetLang?: string;
  voice?: string; // TTS voice ID
  speed?: number; // 0.5–2.0
  domain?: string;
}

export interface VoiceResult {
  type: VoiceRequestType;
  text?: string; // STT result
  audioData?: string; // TTS result base64
  command?: string; // Parsed command action
  commandArgs?: Record<string, unknown>;
  translation?: string;
  confidence?: number;
  language?: string;
  duration?: number; // audio duration in seconds
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export type ContentType =
  'image' | 'video' | 'audio' | 'text' | 'message' | 'review' | 'job' | 'listing';

export interface ModerationRequest {
  contentType: ContentType;
  content: string; // text or base64 for media
  context?: string;
  strictness?: 'low' | 'medium' | 'high';
}

export interface ModerationCategory {
  name: string;
  score: number; // 0-1
  flagged: boolean;
}

export interface ModerationResult {
  approved: boolean;
  confidence: number;
  categories: ModerationCategory[];
  action: 'allow' | 'warn' | 'blur' | 'remove' | 'escalate';
  reason?: string;
  reviewQueue?: boolean;
}

// ─── Business Intelligence ────────────────────────────────────────────────────

export type BIMetric = 'revenue' | 'demand' | 'sales' | 'customer' | 'market' | 'risk' | 'growth';

export interface BIRequest {
  metric: BIMetric;
  entityId: string;
  entityType: 'vendor' | 'org' | 'platform';
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  horizon?: number; // forecast days
}

export interface BIInsight {
  metric: BIMetric;
  value: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  summary: string;
  suggestions: string[];
  chartData?: Array<{ label: string; value: number }>;
}

// ─── Career ───────────────────────────────────────────────────────────────────

export interface CareerProfile {
  userId: string;
  cvText?: string;
  skills: string[];
  experience: number; // years
  education?: string;
  languages?: string[];
  desiredRole?: string;
  currentSalary?: number;
  targetSalary?: number;
  location?: string;
  available?: boolean;
}

export interface CareerAnalysis {
  skillGaps: string[];
  matchedJobs: Array<{ jobId: string; title: string; score: number; reason: string }>;
  salaryEstimate: { min: number; max: number; currency: string };
  careerPaths: Array<{ path: string; yearsToAchieve: number; requiredSkills: string[] }>;
  cvScore: number; // 0-100
  improvements: string[];
}

// ─── Marketplace AI ───────────────────────────────────────────────────────────

export interface MarketplaceAIRequest {
  type: 'pricing' | 'ranking' | 'demand' | 'cross_sell' | 'upsell';
  vendorId?: string;
  listingId?: string;
  userId?: string;
  context?: Record<string, unknown>;
}

export interface MarketplaceAIResult {
  type: string;
  suggestedPrice?: number;
  currency?: string;
  rankedItems?: Array<{ id: string; score: number }>;
  demandForecast?: Array<{ date: string; demand: number }>;
  recommendations?: Array<{ id: string; title: string; reason: string }>;
  confidence: number;
}

// ─── Travel AI ───────────────────────────────────────────────────────────────

export interface TravelRequest {
  type: 'hotel' | 'flight' | 'restaurant' | 'attraction' | 'transport' | 'weather' | 'event';
  destination: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  budget?: number;
  currency?: string;
  preferences?: Record<string, unknown>;
  userId?: string;
}

export interface TravelResult {
  type: string;
  items: Array<{
    id: string;
    name: string;
    score: number;
    price?: number;
    currency?: string;
    image?: string;
    reason: string;
    metadata: Record<string, unknown>;
  }>;
  currency?: string;
  totalBudget?: number;
}

// ─── Health AI ────────────────────────────────────────────────────────────────

export interface HealthAIRequest {
  type: 'appointment' | 'content' | 'hospital' | 'doctor';
  query?: string;
  specialty?: string;
  location?: string;
  userId?: string;
  filters?: Record<string, unknown>;
}

export interface HealthAIResult {
  type: string;
  results: Array<{
    id: string;
    name: string;
    type: string;
    specialty?: string;
    location?: string;
    score: number;
    available?: boolean;
    metadata: Record<string, unknown>;
  }>;
  disclaimer: string; // Always: not medical advice
}

// ─── Notification AI ─────────────────────────────────────────────────────────

export interface NotificationAIRequest {
  userId: string;
  event: string;
  payload: Record<string, unknown>;
  channels: Array<'push' | 'email' | 'sms' | 'in_app'>;
  language?: string;
}

export interface NotificationAIDecision {
  shouldSend: boolean;
  channel: 'push' | 'email' | 'sms' | 'in_app';
  priority: 'critical' | 'high' | 'normal' | 'low';
  scheduledAt?: number; // optimal send time
  message: string;
  language: string;
  reason: string;
}

// ─── Type aliases for engine compatibility ────────────────────────────────────

export type BIQuery = BIRequest;
export type BIReport = BIInsight;
export type CVAnalysisResult = CareerAnalysis;
export type ModerationTarget = ModerationRequest;
export type NotificationDecision = NotificationAIDecision;

export interface NotificationContext {
  userId: string;
  channel?: 'push' | 'email' | 'sms' | 'in_app';
  history?: string[];
}

export interface HealthRecommendation {
  id: string;
  type: 'doctor' | 'hospital' | 'appointment' | 'content';
  name: string;
  specialty?: string;
  location?: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface AppointmentSuggestion {
  doctorId: string;
  specialty: string;
  availableSlots: string[];
  location?: string;
  score: number;
}

export interface PricingDecision {
  listingId: string;
  suggestedPrice: number;
  currency: string;
  confidence: number;
  reasoning: string;
}

export interface InventoryInsight {
  vendorId: string;
  lowStock: string[];
  demand: Array<{ itemId: string; forecastedDemand: number }>;
  recommendations: string[];
}

export interface MarketplaceRanking {
  listingId: string;
  rank: number;
  score: number;
  factors: Record<string, number>;
}

export interface TravelRecommendation {
  id: string;
  type: 'hotel' | 'restaurant' | 'attraction' | 'transport';
  name: string;
  score: number;
  price?: number;
  currency?: string;
  reason: string;
  metadata: Record<string, unknown>;
}

export interface TravelItinerary {
  destination: string;
  days: Array<{ date: string; activities: TravelRecommendation[] }>;
  totalBudget?: number;
  currency?: string;
}

// ─── AI Workflow ──────────────────────────────────────────────────────────────

export type AIWorkflowStepType =
  | 'ai_call'
  | 'condition'
  | 'transform'
  | 'api_call'
  | 'human_review'
  | 'notification'
  | 'database'
  | 'delay';

export interface AIWorkflowStep {
  id: string;
  name: string;
  type: AIWorkflowStepType;
  config: Record<string, unknown>;
  nextOnSuccess?: string;
  nextOnFailure?: string;
  timeoutMs?: number;
}

export interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  steps: AIWorkflowStep[];
  variables: Record<string, unknown>;
  status: 'draft' | 'active' | 'paused';
  createdAt: number;
  updatedAt: number;
}

export interface AIWorkflowRun {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  context: Record<string, unknown>;
  output?: unknown;
  error?: string;
  startedAt: number;
  completedAt?: number;
}
