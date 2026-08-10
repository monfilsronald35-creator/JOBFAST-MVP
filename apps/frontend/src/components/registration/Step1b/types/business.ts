// ─── BusinessDNA — Core type system for JOBFAST Business Intelligence Engine ──

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired';

export type BusinessPresenceStatus =
  | 'online'
  | 'busy'
  | 'away'
  | 'offline'
  | 'closed';

export type EntityType =
  | 'company'
  | 'individual'
  | 'government'
  | 'ngo'
  | 'institution'
  | 'franchise'
  | 'branch'
  | 'cooperative';

export interface VerificationRecord {
  status: VerificationStatus;
  verifiedAt?: string;
  source?: string;
  expiresAt?: string;
  confidence: number;
  documentRef?: string;
}

export interface VerificationState {
  identity: VerificationRecord;
  businessRegistration: VerificationRecord;
  ownership: VerificationRecord;
  address: VerificationRecord;
  licenses: VerificationRecord;
  certifications: VerificationRecord;
  phone: VerificationRecord;
  email: VerificationRecord;
  documents: VerificationRecord;
}

export interface BusinessLocation {
  country: string;
  countryCode: string;
  region?: string;
  state?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  postalCode?: string;
  address?: string;
  gps?: { lat: number; lng: number };
  timezone: string;
  serviceRadius?: number; // km
}

export interface BusinessCapabilities {
  booking: boolean;
  delivery: boolean;
  ecommerce: boolean;
  employment: boolean;
  remoteService: boolean;
  financing: boolean;
  subscription: boolean;
  internationalShipping: boolean;
  pickup: boolean;
  homeService: boolean;
  emergency24h: boolean;
}

export interface BusinessReputation {
  rating: number;          // 0–5
  reviews: number;
  responseRate: number;    // 0–1
  completionRate: number;  // 0–1
  reliabilityScore: number;// 0–100
  repeatCustomers: number; // 0–1
}

export interface BusinessPresence {
  status: BusinessPresenceStatus;
  lastSeen: string;
  responseTimeSeconds: number;
  acceptingCustomers: boolean;
  acceptingJobs: boolean;
  acceptingOrders: boolean;
  acceptingBookings: boolean;
  nextAvailableAt?: string;
}

export interface RankingSignals {
  relevance: number;       // 0–1
  distanceScore: number;   // 0–1
  availabilityScore: number;
  trustScore: number;
  ratingScore: number;
  responseScore: number;
  verificationScore: number;
  personalizationScore: number;
  totalScore: number;
}

export interface BusinessDNA {
  id?: string;
  entityType: EntityType;

  name?: string;
  description?: string;
  logo?: string;

  primaryIndustry: string;
  primaryIndustryCode: string;

  businessTypes: string[];       // ["hotel", "restaurant", "tour_agency"]
  services: string[];
  products: string[];

  targetMarkets: string[];       // ["b2c", "b2b", "government"]
  operatingCountries: string[];

  locations: BusinessLocation[];

  capabilities: BusinessCapabilities;

  verification: VerificationState;

  reputation: BusinessReputation;

  presence: BusinessPresence;

  ranking?: RankingSignals;

  aiClassification?: AIClassificationResult;

  // relationships
  parentId?: string;
  subsidiaries?: string[];
  partners?: string[];

  // commerce
  currencies: string[];
  paymentMethods: string[];

  // media
  languages: string[];
  website?: string;
  phone?: string;
  email?: string;

  // meta
  createdAt?: string;
  updatedAt?: string;
  schemaVersion: number;
}

// ─── Global Taxonomy ──────────────────────────────────────────────────────────

export interface GlobalCategory {
  id: string;
  parentId?: string;
  code: string;
  names: Record<string, string>; // { ht, en, es, fr, pt, ar, zh }
  industry: string;
  industryCode: string;
  services: string[];
  products: string[];
  countries: string[];           // [] = global
  requirements?: {
    licenses?: string[];
    certifications?: string[];
  };
  capabilities: Partial<BusinessCapabilities>;
  aliases: string[];             // alternate names for search
  emoji: string;
  color: string;                 // tailwind color class
  tier: 'primary' | 'secondary' | 'tertiary';
  demandScore: number;           // 0–100, used in ranking
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchIntent {
  raw: string;
  normalized: string;
  language: string;
  entities: string[];
  industries: string[];
  businessTypes: string[];
  location?: Partial<BusinessLocation>;
  intent: 'discovery' | 'hiring' | 'purchasing' | 'booking' | 'comparison';
  confidence: number;
}

export interface SearchResult {
  category: GlobalCategory;
  score: number;
  matchReason: string[];
}

export interface DiscoveryResults {
  intent: SearchIntent;
  categories: SearchResult[];
  suggestedDNA: Partial<BusinessDNA>;
  confidence: number;
  processingMs: number;
}

// ─── AI Classification ────────────────────────────────────────────────────────

export interface AIClassificationResult {
  primaryBusiness: string;
  primaryConfidence: number;
  secondaryBusinesses: Array<{
    type: string;
    confidence: number;
  }>;
  extractedLocation?: Partial<BusinessLocation>;
  extractedNeeds?: string[];
  extractedCapabilities?: Partial<BusinessCapabilities>;
  language: string;
  processingMs: number;
}

// ─── Registration flow ────────────────────────────────────────────────────────

export interface Step1bOutput {
  businessDNA: Partial<BusinessDNA>;
  selectedCategories: GlobalCategory[];
  aiClassification?: AIClassificationResult | undefined;
  rawInput: string;
}

export interface Step1bProps {
  onNext: (data: Step1bOutput) => void;
  onBack?: () => void;
  initialData?: Partial<Step1bOutput>;
  userId?: string;
}
