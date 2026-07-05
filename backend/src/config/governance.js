/**
 * governance.js
 *
 * Centralized governance configuration for JOBFAST.
 * Single source of truth for:
 *   - Feature flags
 *   - Country configuration (languages, currency, timezone, address/phone formats, service zones)
 *   - Labor rules per country
 *   - Payment rules
 *   - Tax rules
 *   - Role permission matrix
 *   - Consent types
 *   - Privacy visibility options
 *
 * All rule sets are DATA ONLY — no business logic embedded here.
 * Runtime overrides are stored on governanceStore (in-memory MVP).
 * No hardcoded country-specific behavior in component code.
 */

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// FEATURE FLAGS
// ─────────────────────────────────────────────────────────────

export const DEFAULT_FEATURE_FLAGS = [
  {
    id:          'gps_live_tracking',
    name:        'GPS Live Tracking',
    description: 'Real-time GPS location updates for workers and companies',
    enabled:     true,
    rolloutPct:  100,
    countries:   [],          // empty = all countries
    roles:       [],          // empty = all roles
    isBeta:      false,
    emergencyDisabled: false,
  },
  {
    id:          'marketplace_reviews',
    name:        'Marketplace Reviews',
    description: 'Allow customers to leave reviews on marketplace listings',
    enabled:     true,
    rolloutPct:  100,
    countries:   [],
    roles:       [],
    isBeta:      false,
    emergencyDisabled: false,
  },
  {
    id:          'trust_score_public',
    name:        'Public Trust Score',
    description: 'Show trust score on user profiles',
    enabled:     true,
    rolloutPct:  100,
    countries:   [],
    roles:       [],
    isBeta:      false,
    emergencyDisabled: false,
  },
  {
    id:          'enterprise_module',
    name:        'Enterprise Module',
    description: 'Multi-country enterprise dashboard and management',
    enabled:     true,
    rolloutPct:  100,
    countries:   [],
    roles:       ['enterprise'],
    isBeta:      false,
    emergencyDisabled: false,
  },
  {
    id:          'complaint_system',
    name:        'Complaint System',
    description: 'Allow users to file complaints against other users',
    enabled:     true,
    rolloutPct:  100,
    countries:   [],
    roles:       [],
    isBeta:      false,
    emergencyDisabled: false,
  },
  {
    id:          'badge_system',
    name:        'Badge System',
    description: 'Auto-generate reputation badges based on user performance',
    enabled:     true,
    rolloutPct:  100,
    countries:   [],
    roles:       [],
    isBeta:      false,
    emergencyDisabled: false,
  },
  {
    id:          'ai_fraud_detection',
    name:        'AI Fraud Detection',
    description: 'Automated fraud pattern detection',
    enabled:     true,
    rolloutPct:  100,
    countries:   [],
    roles:       ['admin', 'super_admin'],
    isBeta:      true,
    emergencyDisabled: false,
  },
  {
    id:          'document_verification',
    name:        'Document Verification',
    description: 'Request and track identity/business document verification',
    enabled:     true,
    rolloutPct:  100,
    countries:   [],
    roles:       [],
    isBeta:      false,
    emergencyDisabled: false,
  },
  {
    id:          'radius_alerts',
    name:        'Radius Alerts',
    description: 'Companies can send job alerts to nearby workers',
    enabled:     true,
    rolloutPct:  100,
    countries:   [],
    roles:       ['company', 'enterprise'],
    isBeta:      false,
    emergencyDisabled: false,
  },
  {
    id:          'multi_language',
    name:        'Multi-language Support',
    description: 'Haitian Creole, French, English, Spanish UI',
    enabled:     true,
    rolloutPct:  100,
    countries:   [],
    roles:       [],
    isBeta:      false,
    emergencyDisabled: false,
  },
];

// ─────────────────────────────────────────────────────────────
// COUNTRY CONFIGURATION
// ─────────────────────────────────────────────────────────────

export const COUNTRY_CONFIG = [
  {
    code:        'HT',
    name:        'Haiti',
    language:    'ht',           // primary language code
    languages:   ['ht', 'fr'],   // all supported
    currency:    'HTG',
    timezone:    'America/Port-au-Prince',
    addressFormat: '{street}, {city}, {state}, Haiti',
    phoneFormat:   '+509 XXXX XXXX',
    phonePrefix:   '+509',
    serviceZones:  ['Nord', 'Sud', 'Ouest', 'Centre', 'Est', 'Nord-Ouest', 'Nord-Est', 'Sud-Est', 'Grand\'Anse', 'Nippes', 'Artibonite'],
    active:      true,
    laborRules: {
      minAge:          15,
      minWagePerDay:   350,    // HTG
      minWageCurrency: 'HTG',
      maxHoursPerWeek: 48,
      overtimeMultiplier: 1.5,
      contractTypes:   ['formal', 'informal', 'seasonal', 'daily'],
      employmentTypes: ['full_time', 'part_time', 'freelance', 'apprentice'],
      requiredDocuments: ['national_id'],
    },
    paymentRules: {
      methods:         ['cash', 'mobile_money', 'bank_transfer'],
      defaultMethod:   'cash',
      escrowSupported: false,
      refundWindowDays: 3,
      currency:        'HTG',
      minTransactionAmount: 100,
    },
    taxRules: {
      vatRate:          0.10,   // 10%
      servicesTaxRate:  0.05,
      incomeTaxBrackets: [
        { upTo: 60000,  rate: 0 },
        { upTo: 240000, rate: 0.10 },
        { upTo: null,   rate: 0.20 },
      ],
      vatRegistrationThreshold: 1_500_000,
    },
  },
  {
    code:        'DO',
    name:        'Dominican Republic',
    language:    'es',
    languages:   ['es'],
    currency:    'DOP',
    timezone:    'America/Santo_Domingo',
    addressFormat: '{street}, {city}, {state}, Dominican Republic',
    phoneFormat:   '+1 (809) XXX-XXXX',
    phonePrefix:   '+1809',
    serviceZones:  ['Santo Domingo', 'Santiago', 'La Romana', 'San Pedro de Macorís', 'Puerto Plata', 'Higüey'],
    active:      true,
    laborRules: {
      minAge:          14,
      minWagePerDay:   600,
      minWageCurrency: 'DOP',
      maxHoursPerWeek: 44,
      overtimeMultiplier: 1.35,
      contractTypes:   ['formal', 'part_time', 'seasonal'],
      employmentTypes: ['full_time', 'part_time', 'freelance'],
      requiredDocuments: ['cedula'],
    },
    paymentRules: {
      methods:         ['cash', 'card', 'bank_transfer', 'mobile_money'],
      defaultMethod:   'card',
      escrowSupported: false,
      refundWindowDays: 7,
      currency:        'DOP',
      minTransactionAmount: 50,
    },
    taxRules: {
      vatRate:          0.18,
      servicesTaxRate:  0.10,
      incomeTaxBrackets: [
        { upTo: 416_220, rate: 0 },
        { upTo: 624_329, rate: 0.15 },
        { upTo: 867_123, rate: 0.20 },
        { upTo: null,    rate: 0.25 },
      ],
      vatRegistrationThreshold: 7_804_016,
    },
  },
  {
    code:        'US',
    name:        'United States',
    language:    'en',
    languages:   ['en', 'es'],
    currency:    'USD',
    timezone:    'America/New_York',
    addressFormat: '{street}, {city}, {state} {zip}, USA',
    phoneFormat:   '+1 (XXX) XXX-XXXX',
    phonePrefix:   '+1',
    serviceZones:  ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West', 'Florida', 'New York', 'California'],
    active:      true,
    laborRules: {
      minAge:          16,
      minWagePerDay:   116,    // USD (federal $7.25/hr × 16hrs)
      minWageCurrency: 'USD',
      maxHoursPerWeek: 40,
      overtimeMultiplier: 1.5,
      contractTypes:   ['w2', '1099', 'corp_to_corp', 'part_time'],
      employmentTypes: ['full_time', 'part_time', 'contractor', 'freelance'],
      requiredDocuments: ['ssn_or_itin', 'i9'],
    },
    paymentRules: {
      methods:         ['card', 'ach', 'paypal', 'zelle', 'check'],
      defaultMethod:   'card',
      escrowSupported: true,
      refundWindowDays: 14,
      currency:        'USD',
      minTransactionAmount: 1,
    },
    taxRules: {
      vatRate:          0,
      servicesTaxRate:  0.065,  // average state sales tax
      incomeTaxBrackets: [
        { upTo: 11_000,  rate: 0.10 },
        { upTo: 44_725,  rate: 0.12 },
        { upTo: 95_375,  rate: 0.22 },
        { upTo: 201_050, rate: 0.24 },
        { upTo: null,    rate: 0.37 },
      ],
      vatRegistrationThreshold: null,
    },
  },
  {
    code:        'FR',
    name:        'France',
    language:    'fr',
    languages:   ['fr'],
    currency:    'EUR',
    timezone:    'Europe/Paris',
    addressFormat: '{street}, {zip} {city}, France',
    phoneFormat:   '+33 X XX XX XX XX',
    phonePrefix:   '+33',
    serviceZones:  ['Île-de-France', 'Provence', 'PACA', 'Auvergne-Rhône-Alpes', 'Occitanie', 'Bretagne'],
    active:      true,
    laborRules: {
      minAge:          16,
      minWagePerDay:   107,    // EUR (SMIC)
      minWageCurrency: 'EUR',
      maxHoursPerWeek: 35,
      overtimeMultiplier: 1.25,
      contractTypes:   ['cdi', 'cdd', 'interim', 'auto-entrepreneur'],
      employmentTypes: ['full_time', 'part_time', 'freelance', 'apprentice'],
      requiredDocuments: ['carte_identite', 'numero_secu'],
    },
    paymentRules: {
      methods:         ['card', 'virement', 'paypal', 'lydia'],
      defaultMethod:   'card',
      escrowSupported: true,
      refundWindowDays: 14,
      currency:        'EUR',
      minTransactionAmount: 1,
    },
    taxRules: {
      vatRate:          0.20,
      servicesTaxRate:  0.20,
      incomeTaxBrackets: [
        { upTo: 10_777,  rate: 0 },
        { upTo: 27_478,  rate: 0.11 },
        { upTo: 78_570,  rate: 0.30 },
        { upTo: 168_994, rate: 0.41 },
        { upTo: null,    rate: 0.45 },
      ],
      vatRegistrationThreshold: 36_800,
    },
  },
  {
    code:        'CA',
    name:        'Canada',
    language:    'en',
    languages:   ['en', 'fr'],
    currency:    'CAD',
    timezone:    'America/Toronto',
    addressFormat: '{street}, {city}, {province} {postalCode}, Canada',
    phoneFormat:   '+1 (XXX) XXX-XXXX',
    phonePrefix:   '+1',
    serviceZones:  ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Nova Scotia'],
    active:      true,
    laborRules: {
      minAge:          15,
      minWagePerDay:   151,    // CAD (~$18.89/hr × 8hrs Ontario)
      minWageCurrency: 'CAD',
      maxHoursPerWeek: 48,
      overtimeMultiplier: 1.5,
      contractTypes:   ['full_time', 'part_time', 'contract', 'freelance'],
      employmentTypes: ['full_time', 'part_time', 'freelance'],
      requiredDocuments: ['sin'],
    },
    paymentRules: {
      methods:         ['card', 'e-transfer', 'cheque', 'paypal'],
      defaultMethod:   'card',
      escrowSupported: true,
      refundWindowDays: 14,
      currency:        'CAD',
      minTransactionAmount: 1,
    },
    taxRules: {
      vatRate:          0.05,   // GST
      servicesTaxRate:  0.13,   // HST Ontario
      incomeTaxBrackets: [
        { upTo: 53_359,  rate: 0.15 },
        { upTo: 106_717, rate: 0.205 },
        { upTo: 165_430, rate: 0.26 },
        { upTo: 235_675, rate: 0.29 },
        { upTo: null,    rate: 0.33 },
      ],
      vatRegistrationThreshold: 30_000,
    },
  },
  {
    code:        'JM',
    name:        'Jamaica',
    language:    'en',
    languages:   ['en'],
    currency:    'JMD',
    timezone:    'America/Jamaica',
    addressFormat: '{street}, {city}, {parish}, Jamaica',
    phoneFormat:   '+1 (876) XXX-XXXX',
    phonePrefix:   '+1876',
    serviceZones:  ['Kingston', 'Saint Andrew', 'Saint Catherine', 'Clarendon', 'Manchester', 'Saint James'],
    active:      true,
    laborRules: {
      minAge:          15,
      minWagePerDay:   735,    // JMD
      minWageCurrency: 'JMD',
      maxHoursPerWeek: 40,
      overtimeMultiplier: 1.5,
      contractTypes:   ['formal', 'informal', 'casual'],
      employmentTypes: ['full_time', 'part_time', 'freelance'],
      requiredDocuments: ['trn', 'national_id'],
    },
    paymentRules: {
      methods:         ['cash', 'card', 'mobile_money', 'bank_transfer'],
      defaultMethod:   'cash',
      escrowSupported: false,
      refundWindowDays: 3,
      currency:        'JMD',
      minTransactionAmount: 100,
    },
    taxRules: {
      vatRate:          0.15,   // GCT
      servicesTaxRate:  0.15,
      incomeTaxBrackets: [
        { upTo: 1_500_096, rate: 0 },
        { upTo: 6_000_000, rate: 0.25 },
        { upTo: null,      rate: 0.30 },
      ],
      vatRegistrationThreshold: 10_000_000,
    },
  },
];

// ─────────────────────────────────────────────────────────────
// PERMISSION MATRIX
// ─────────────────────────────────────────────────────────────

export const PERMISSION_MATRIX = {
  super_admin: {
    read: true, create: true, update: true, delete: true,
    approve: true, reject: true, suspend: true, moderate: true,
    verify: true, export: true, audit: true,
    featureFlags: true, countryConfig: true, laborRules: true,
    fraudInvestigation: true, disputeResolution: true,
  },
  admin: {
    read: true, create: true, update: true, delete: false,
    approve: true, reject: true, suspend: true, moderate: true,
    verify: true, export: true, audit: true,
    featureFlags: false, countryConfig: false, laborRules: false,
    fraudInvestigation: true, disputeResolution: true,
  },
  enterprise: {
    read: true, create: true, update: true, delete: false,
    approve: true, reject: true, suspend: false, moderate: false,
    verify: false, export: true, audit: false,
    featureFlags: false, countryConfig: false, laborRules: false,
    fraudInvestigation: false, disputeResolution: false,
  },
  company: {
    read: true, create: true, update: true, delete: false,
    approve: true, reject: true, suspend: false, moderate: false,
    verify: false, export: false, audit: false,
    featureFlags: false, countryConfig: false, laborRules: false,
    fraudInvestigation: false, disputeResolution: false,
  },
  worker: {
    read: true, create: false, update: true, delete: false,
    approve: false, reject: false, suspend: false, moderate: false,
    verify: false, export: false, audit: false,
    featureFlags: false, countryConfig: false, laborRules: false,
    fraudInvestigation: false, disputeResolution: false,
  },
  user: {
    read: true, create: false, update: true, delete: false,
    approve: false, reject: false, suspend: false, moderate: false,
    verify: false, export: false, audit: false,
    featureFlags: false, countryConfig: false, laborRules: false,
    fraudInvestigation: false, disputeResolution: false,
  },
  restaurant: {
    read: true, create: true, update: true, delete: false,
    approve: false, reject: false, suspend: false, moderate: false,
    verify: false, export: false, audit: false,
    featureFlags: false, countryConfig: false, laborRules: false,
    fraudInvestigation: false, disputeResolution: false,
  },
};

// Default for roles not explicitly listed
export const DEFAULT_PERMISSIONS = {
  read: true, create: false, update: true, delete: false,
  approve: false, reject: false, suspend: false, moderate: false,
  verify: false, export: false, audit: false,
  featureFlags: false, countryConfig: false, laborRules: false,
  fraudInvestigation: false, disputeResolution: false,
};

export function getPermissionsForRole(role) {
  return PERMISSION_MATRIX[role] ?? DEFAULT_PERMISSIONS;
}

// ─────────────────────────────────────────────────────────────
// CONSENT TYPES
// ─────────────────────────────────────────────────────────────

export const CONSENT_TYPES = [
  { id: 'gps',          label: 'GPS / Lokasyon',     required: false },
  { id: 'notifications',label: 'Notifikasyon App',   required: false },
  { id: 'email',        label: 'Email Maketing',     required: false },
  { id: 'sms',          label: 'SMS',                required: false },
  { id: 'push',         label: 'Push Notifications', required: false },
  { id: 'cookies',      label: 'Cookies Analitik',   required: false },
  { id: 'analytics',    label: 'Analitik Platfòm',   required: false },
  { id: 'documents',    label: 'Telechajman Dokiman', required: true  },
  { id: 'identity',     label: 'Verifikasyon Idantite', required: true },
];

// ─────────────────────────────────────────────────────────────
// PRIVACY VISIBILITY OPTIONS
// ─────────────────────────────────────────────────────────────

export const PRIVACY_VISIBILITY = {
  PUBLIC:         'public',
  PRIVATE:        'private',
  VERIFIED_ONLY:  'verified_only',
  CONTACTS_ONLY:  'contacts_only',
  HIDDEN:         'hidden',
};

export const PRIVACY_FIELDS = [
  { id: 'profile',   label: 'Pwofil',         default: 'public' },
  { id: 'phone',     label: 'Telefòn',        default: 'contacts_only' },
  { id: 'email',     label: 'Imèl',           default: 'private' },
  { id: 'address',   label: 'Adres',          default: 'private' },
  { id: 'portfolio', label: 'Pòtfòlyo',       default: 'public' },
  { id: 'documents', label: 'Dokiman',        default: 'hidden' },
  { id: 'reviews',   label: 'Evalyasyon',     default: 'public' },
  { id: 'listings',  label: 'Lis Sèvis',      default: 'public' },
];

// ─────────────────────────────────────────────────────────────
// FRAUD DETECTION SIGNAL TYPES
// ─────────────────────────────────────────────────────────────

export const FRAUD_SIGNAL_TYPES = [
  { id: 'fake_review',        label: 'Fausse Évaluation',   weight: 3 },
  { id: 'duplicate_account',  label: 'Compte Dupliqué',     weight: 8 },
  { id: 'identity_abuse',     label: 'Abus d\'Identité',    weight: 10 },
  { id: 'gps_abuse',          label: 'GPS Falsifié',        weight: 5 },
  { id: 'spam_applications',  label: 'Spam Candidatures',   weight: 2 },
  { id: 'suspicious_payment', label: 'Paiement Suspect',    weight: 7 },
  { id: 'fake_job_post',      label: 'Offre Factice',       weight: 6 },
  { id: 'rep_manipulation',   label: 'Manipulation Réputation', weight: 8 },
  { id: 'fake_company',       label: 'Entreprise Fictive',  weight: 9 },
];

export const FRAUD_RISK_THRESHOLD = 15; // fraudScore above this = high risk

// ─────────────────────────────────────────────────────────────
// RUNTIME GOVERNANCE STORE (in-memory, resets on restart)
// ─────────────────────────────────────────────────────────────

class GovernanceStore {
  constructor() {
    // Deep clone defaults
    this.featureFlags   = DEFAULT_FEATURE_FLAGS.map(f => ({ ...f }));
    this.countryConfig  = COUNTRY_CONFIG.map(c => ({
      ...c,
      laborRules:   { ...c.laborRules },
      paymentRules: { ...c.paymentRules },
      taxRules:     { ...c.taxRules },
    }));
    this.permissionMatrix = JSON.parse(JSON.stringify(PERMISSION_MATRIX));
    this.consentLogs    = [];  // { userId, type, granted, ip, createdAt }
    this.privacySettings = {}; // { [userId]: { field: visibility } }
  }

  // ── Feature flags ─────────────────────────────────────────

  getFlag(id) {
    return this.featureFlags.find(f => f.id === id) ?? null;
  }

  isEnabled(flagId, { role = null, countryCode = null } = {}) {
    const flag = this.getFlag(flagId);
    if (!flag) return false;
    if (!flag.enabled || flag.emergencyDisabled) return false;
    if (flag.roles.length > 0 && role && !flag.roles.includes(role)) return false;
    if (flag.countries.length > 0 && countryCode && !flag.countries.includes(countryCode)) return false;
    if (flag.rolloutPct < 100) {
      // Deterministic rollout: hash flagId+userId+role
      const hash = Array.from(flagId + (role ?? '')).reduce((a, c) => a + c.charCodeAt(0), 0);
      if ((hash % 100) >= flag.rolloutPct) return false;
    }
    return true;
  }

  updateFlag(id, patch) {
    const idx = this.featureFlags.findIndex(f => f.id === id);
    if (idx >= 0) {
      this.featureFlags[idx] = { ...this.featureFlags[idx], ...patch };
      return this.featureFlags[idx];
    }
    // New flag
    const newFlag = { id: id || `flag_${crypto.randomUUID()}`, ...patch };
    this.featureFlags.push(newFlag);
    return newFlag;
  }

  // ── Country config ────────────────────────────────────────

  getCountry(code) {
    return this.countryConfig.find(c => c.code === code) ?? null;
  }

  updateCountry(code, patch) {
    const idx = this.countryConfig.findIndex(c => c.code === code);
    if (idx >= 0) {
      this.countryConfig[idx] = { ...this.countryConfig[idx], ...patch };
      return this.countryConfig[idx];
    }
    return null;
  }

  // ── Consent ───────────────────────────────────────────────

  recordConsent({ userId, type, granted, ip }) {
    this.consentLogs.unshift({
      id:        `con_${Date.now()}`,
      userId,
      type,
      granted:   !!granted,
      ip:        ip ?? null,
      createdAt: new Date().toISOString(),
    });
    if (this.consentLogs.length > 50_000) this.consentLogs.length = 50_000;
  }

  getUserConsent(userId) {
    const types = {};
    // Take the latest record per type for this user
    for (const log of this.consentLogs) {
      if (log.userId !== userId) continue;
      if (types[log.type] == null) types[log.type] = log.granted;
    }
    return types;
  }

  // ── Privacy ───────────────────────────────────────────────

  getPrivacy(userId) {
    return this.privacySettings[userId] ?? {};
  }

  setPrivacy(userId, field, visibility) {
    if (!this.privacySettings[userId]) this.privacySettings[userId] = {};
    this.privacySettings[userId][field] = visibility;
  }
}

export const governanceStore = new GovernanceStore();