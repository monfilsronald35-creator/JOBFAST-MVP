// ─── Business DNA Engine ──────────────────────────────────────────────────────
// Assembles a BusinessDNA from AI classification + user selections + location.

import type {
  BusinessDNA, AIClassificationResult, GlobalCategory,
  VerificationRecord, VerificationState, BusinessReputation,
  BusinessPresence, BusinessCapabilities,
} from '../types/business';

const DEFAULT_VERIFICATION: VerificationRecord = {
  status: 'unverified',
  confidence: 0,
};

export function defaultVerificationState(): VerificationState {
  const v = DEFAULT_VERIFICATION;
  return {
    identity: { ...v },
    businessRegistration: { ...v },
    ownership: { ...v },
    address: { ...v },
    licenses: { ...v },
    certifications: { ...v },
    phone: { ...v },
    email: { ...v },
    documents: { ...v },
  };
}

export function defaultReputation(): BusinessReputation {
  return { rating: 0, reviews: 0, responseRate: 0, completionRate: 0, reliabilityScore: 0, repeatCustomers: 0 };
}

export function defaultPresence(): BusinessPresence {
  return {
    status: 'offline',
    lastSeen: new Date().toISOString(),
    responseTimeSeconds: 0,
    acceptingCustomers: false,
    acceptingJobs: false,
    acceptingOrders: false,
    acceptingBookings: false,
  };
}

export function defaultCapabilities(): BusinessCapabilities {
  return {
    booking: false, delivery: false, ecommerce: false, employment: false,
    remoteService: false, financing: false, subscription: false,
    internationalShipping: false, pickup: false, homeService: false, emergency24h: false,
  };
}

// ─── Merge capabilities from selected categories ───────────────────────────────

function mergeCapabilities(categories: GlobalCategory[]): BusinessCapabilities {
  const base = defaultCapabilities();
  for (const cat of categories) {
    for (const [key, val] of Object.entries(cat.capabilities ?? {})) {
      if (val) (base as Record<string, boolean>)[key] = true;
    }
  }
  return base;
}

// ─── Build DNA from AI + user selections ─────────────────────────────────────

export function buildBusinessDNA(
  ai: AIClassificationResult,
  selectedCategories: GlobalCategory[],
  rawInput: string,
): Partial<BusinessDNA> {
  const primaryCat = selectedCategories[0];
  const allServices = [...new Set(selectedCategories.flatMap(c => c.services))];
  const allProducts = [...new Set(selectedCategories.flatMap(c => c.products))];

  const capabilities = mergeCapabilities(selectedCategories);

  const locations = ai.extractedLocation
    ? [{ ...ai.extractedLocation, timezone: ai.extractedLocation.timezone ?? 'UTC' }]
    : [];

  return {
    entityType: 'company',
    primaryIndustry: primaryCat?.industry ?? 'Unknown',
    primaryIndustryCode: primaryCat?.industryCode ?? 'UNK',
    businessTypes: selectedCategories.map(c => c.id),
    services: allServices,
    products: allProducts,
    targetMarkets: ['b2c'],
    operatingCountries: ai.extractedLocation?.countryCode ? [ai.extractedLocation.countryCode] : [],
    locations: locations as BusinessDNA['locations'],
    capabilities,
    verification: defaultVerificationState(),
    reputation: defaultReputation(),
    presence: defaultPresence(),
    currencies: ['USD'],
    paymentMethods: [],
    languages: [ai.language],
    aiClassification: ai,
    schemaVersion: 1,
  };
}

// ─── Compute profile completeness score ────────────────────────────────────────

export interface CompletenessResult {
  score: number; // 0–100
  missingFields: string[];
  nextSteps: string[];
}

export function computeCompleteness(dna: Partial<BusinessDNA>): CompletenessResult {
  const checks: Array<{ field: string; label: string; weight: number }> = [
    { field: 'name', label: 'Business name', weight: 15 },
    { field: 'primaryIndustry', label: 'Industry', weight: 15 },
    { field: 'businessTypes', label: 'Business types', weight: 15 },
    { field: 'locations', label: 'Location', weight: 15 },
    { field: 'services', label: 'Services offered', weight: 10 },
    { field: 'phone', label: 'Phone number', weight: 10 },
    { field: 'description', label: 'Business description', weight: 10 },
    { field: 'currencies', label: 'Payment currencies', weight: 5 },
    { field: 'languages', label: 'Business languages', weight: 5 },
  ];

  let score = 0;
  const missing: string[] = [];

  for (const check of checks) {
    const val = dna[check.field as keyof BusinessDNA];
    const filled = Array.isArray(val) ? (val as unknown[]).length > 0 : Boolean(val);
    if (filled) {
      score += check.weight;
    } else {
      missing.push(check.label);
    }
  }

  const nextSteps = missing.slice(0, 3).map(f => `Add ${f}`);

  return { score, missingFields: missing, nextSteps };
}
