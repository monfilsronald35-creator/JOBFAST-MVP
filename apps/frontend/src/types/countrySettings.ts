export const PROVIDER_TYPES = [
  'gateway',
  'mobile_money',
  'bank_transfer',
  'crypto',
] as const;

export type ProviderType = typeof PROVIDER_TYPES[number];

export const MEASUREMENT_SYSTEMS = ['metric', 'imperial', 'both'] as const;

export type MeasurementSystem = typeof MEASUREMENT_SYSTEMS[number];

export const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;

export type DateFormat = typeof DATE_FORMATS[number];

export const NUMBER_FORMATS = ['1,000.00', '1.000,00'] as const;

export type NumberFormat = typeof NUMBER_FORMATS[number];

export const CURRENCY_DISPLAY_FORMATS = ['$100', '100$', '100 USD'] as const;

export type CurrencyDisplayFormat = typeof CURRENCY_DISPLAY_FORMATS[number];

export interface PaymentProvider {
  id: string;
  name: string;
  displayName: string;
  providerType: ProviderType;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationProvider {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TaxAuthority {
  id: string;
  name: string;
  countryId: string;
  portalUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CountrySettings {
  id: string;
  countryId: string;

  isOperational: boolean;
  maintenanceMode: boolean;
  measurementSystem: MeasurementSystem;

  dataRegion: string;
  storageRegion: string;
  backupRegion: string;
  replicationRegion: string;

  gdprEnabled: boolean;
  ccpaEnabled: boolean;
  lgpdEnabled: boolean;
  pipedaEnabled: boolean;
  hipaaEnabled: boolean;

  aiEnabled: boolean;
  aiFaceRecognition: boolean;
  aiVoice: boolean;
  aiRecommendations: boolean;
  aiScoring: boolean;

  cryptoEnabled: boolean;
  btcAllowed: boolean;
  ethAllowed: boolean;
  usdtAllowed: boolean;
  stablecoinsAllowed: boolean;
  defiAllowed: boolean;

  ibanRequired: boolean;
  swiftRequired: boolean;
  routingRequired: boolean;
  sortCodeRequired: boolean;

  libphonenumberRegion: string;
  examplePhone: string | null;
  minimumDigits: number;
  maximumDigits: number;

  addressTemplate: Record<string, unknown>;

  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  currencyFormat: CurrencyDisplayFormat;

  weekendDays: string[];

  apiRegion: string;
  cdnRegion: string;
  edgeRegion: string;

  metadata: Record<string, unknown>;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountrySupportedFeature {
  id: string;
  countryId: string;
  featureKey: string;
  isSupported: boolean;
  requiresKyc: boolean;
  minAgeRequirement: number;
  rolloutPercentage: number;
  isBeta: boolean;
  internalOnly: boolean;
  enterpriseOnly: boolean;
  launchDate: string | null;
  featureConfig: Record<string, unknown>;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CountryPaymentSettings {
  id: string;
  countryId: string;
  providerId: string;
  isDefault: boolean;
  supportsPayouts: boolean;
  supportsDeposits: boolean;
  refundSupported: boolean;
  partialRefund: boolean;
  chargebackSupported: boolean;
  escrowSupported: boolean;
  instantPayout: boolean;
  supportedCurrencies: string[];
  processingFeePercentage: number;
  processingFeeFixed: number;
  minTransactionAmount: number;
  maxTransactionAmount: number;
  gatewayConfig: Record<string, unknown>;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CountryTaxSettings {
  id: string;
  countryId: string;
  taxAuthorityId: string | null;
  taxName: string;
  taxRate: number;
  appliesToServices: boolean;
  appliesToGoods: boolean;
  vatNumberRequired: boolean;
  companyRegistrationRequired: boolean;
  taxIdFormatRegex: string | null;
  invoicePrefix: string;
  invoiceTemplate: Record<string, unknown>;
  isInclusive: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CountryVerificationRule {
  id: string;
  countryId: string;
  verificationProviderId: string;
  idType: string;
  isMandatory: boolean;
  requiresAddressProof: boolean;
  requiresBiometrics: boolean;
  faceMatchRequired: boolean;
  livenessCheck: boolean;
  documentExpiryCheck: boolean;
  minimumAge: number;
  sanctionsCheck: boolean;
  pepCheck: boolean;
  amlCheck: boolean;
  allowedIssuingAuthorities: string[] | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CountryEmergencyContact {
  id: string;
  countryId: string;
  serviceName: string;
  emergencyNumber: string;
  website: string | null;
  smsNumber: string | null;
  email: string | null;
  availableLanguages: string[];
  gpsSupported: boolean;
  description: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CountryPermission {
  id: string;
  countryId: string;
  permissionKey: string;
  isAllowed: boolean;
  requiresLocalEntity: boolean;
  requiresLicense: boolean;
  requiresBusinessRegistration: boolean;
  requiresInsurance: boolean;
  complianceNotes: string | null;
  legalBasis: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
