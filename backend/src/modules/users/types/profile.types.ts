// ——— Individual Profile Types ——————————————————————————————————————————————
export enum IndividualProfileType {
  Worker      = 'worker',
  Freelancer  = 'freelancer',
  Customer    = 'customer',
  Driver      = 'driver',
  Courier     = 'courier',
  Tourist     = 'tourist',
  Student     = 'student',
  Teacher     = 'teacher',
  Doctor      = 'doctor',
  Nurse       = 'nurse',
  Lawyer      = 'lawyer',
  Engineer    = 'engineer',
  Accountant  = 'accountant',
  Artist      = 'artist',
  Influencer  = 'influencer',
  Consultant  = 'consultant',
}

// ——— Business Profile Types ———————————————————————————————————————————————
export enum BusinessProfileType {
  Company          = 'company',
  Startup          = 'startup',
  Enterprise       = 'enterprise',
  MarketplaceSeller= 'marketplace_seller',
  Store            = 'store',
  Supermarket      = 'supermarket',
  Restaurant       = 'restaurant',
  Hotel            = 'hotel',
  Resort           = 'resort',
  Hospital         = 'hospital',
  Clinic           = 'clinic',
  Pharmacy         = 'pharmacy',
  TelecomOperator  = 'telecom_operator',
  Bank             = 'bank',
  InsuranceCompany = 'insurance_company',
  LogisticsCompany = 'logistics_company',
  ConstructionCompany = 'construction_company',
  ManufacturingCompany = 'manufacturing_company',
}

// ——— Public Organization Profile Types ——————————————————————————————————————
export enum OrgProfileType {
  Government   = 'government',
  Municipality = 'municipality',
  Embassy      = 'embassy',
  School       = 'school',
  University   = 'university',
  NGO          = 'ngo',
  Foundation   = 'foundation',
  Church       = 'church',
  Association  = 'association',
}

// ——— Financial Profile Types ——————————————————————————————————————————————
export enum FinancialProfileType {
  WalletOwner   = 'wallet_owner',
  Merchant      = 'merchant',
  PaymentAgent  = 'payment_agent',
  BankBranch    = 'bank_branch',
  ATMNetwork    = 'atm_network',
}

// ——— Internal Profile Types ———————————————————————————————————————————————
export enum InternalProfileType {
  Moderator    = 'moderator',
  Admin        = 'admin',
  SuperAdmin   = 'super_admin',
  AIOperator   = 'ai_operator',
  SupportAgent = 'support_agent',
  Auditor      = 'auditor',
}

export type AnyProfileType =
  | IndividualProfileType
  | BusinessProfileType
  | OrgProfileType
  | FinancialProfileType
  | InternalProfileType;

// Profile type categories
export const INDIVIDUAL_TYPES = new Set<string>(Object.values(IndividualProfileType));
export const BUSINESS_TYPES   = new Set<string>(Object.values(BusinessProfileType));
export const ORG_TYPES        = new Set<string>(Object.values(OrgProfileType));
export const FINANCIAL_TYPES  = new Set<string>(Object.values(FinancialProfileType));
export const INTERNAL_TYPES   = new Set<string>(Object.values(InternalProfileType));

export function profileCategory(type: string): 'individual' | 'business' | 'organization' | 'financial' | 'internal' | 'unknown' {
  if (INDIVIDUAL_TYPES.has(type)) return 'individual';
  if (BUSINESS_TYPES.has(type))   return 'business';
  if (ORG_TYPES.has(type))        return 'organization';
  if (FINANCIAL_TYPES.has(type))  return 'financial';
  if (INTERNAL_TYPES.has(type))   return 'internal';
  return 'unknown';
}

// ——— Profile data shapes ——————————————————————————————————————————————————

export interface ExperienceEntry {
  company:     string;
  title:       string;
  from:        string;  // YYYY-MM
  to?:         string;  // YYYY-MM or omitted if current
  current?:    boolean;
  description?: string;
  location?:   string;
}

export interface EducationEntry {
  institution: string;
  degree:      string;
  field?:      string;
  from?:       string;
  to?:         string;
  grade?:      string;
}

export interface CertificationEntry {
  name:       string;
  issuer:     string;
  date?:      string;
  expiresAt?: string;
  url?:       string;
  credentialId?: string;
}

export interface BusinessHours {
  monday?:    string;
  tuesday?:   string;
  wednesday?: string;
  thursday?:  string;
  friday?:    string;
  saturday?:  string;
  sunday?:    string;
}

export interface EmergencyContact {
  name:         string;
  relationship: string;
  phone:        string;
}

export interface SocialLinks {
  twitter?:   string;
  instagram?: string;
  facebook?:  string;
  linkedin?:  string;
  github?:    string;
  youtube?:   string;
  tiktok?:    string;
  website?:   string;
}

export interface ProfileExtended {
  userId:         string;
  profileType:    string;
  // Identity
  username?:      string;
  displayName?:   string;
  businessName?:  string;
  legalName?:     string;
  publicId?:      string;
  headline?:      string;
  bio?:           string;
  // Personal
  birthDate?:     string;
  gender?:        string;
  nationality?:   string;
  timezone?:      string;
  currency?:      string;
  languages?:     string[];
  // Contact
  whatsapp?:      string;
  website?:       string;
  emergencyContact?: EmergencyContact;
  socialLinks?:   SocialLinks;
  // Professional (individual)
  jobTitle?:      string;
  profession?:    string;
  skills?:        string[];
  experience?:    ExperienceEntry[];
  education?:     EducationEntry[];
  certifications?: CertificationEntry[];
  licenses?:      Record<string, string>[];
  awards?:        Record<string, string>[];
  // Business
  registrationNumber?: string;
  taxNumber?:     string;
  industry?:      string;
  employeeCount?: number;
  businessHours?: BusinessHours;
  branches?:      Record<string, unknown>[];
  services?:      string[];
  products?:      string[];
  // Status
  isPublic:       boolean;
  createdAt:      string;
  updatedAt:      string;
}

export type AvailabilityStatus = 'online' | 'offline' | 'busy' | 'available' | 'vacation' | 'emergency_only';

export interface AvailabilityRecord {
  userId:   string;
  status:   AvailabilityStatus;
  message?: string;
  until?:   string;
  timezone?: string;
  schedule?: Record<string, unknown>;
  updatedAt: string;
}

export interface PrivacySettings {
  userId:           string;
  profileVisibility:'public' | 'connections' | 'private';
  contactVisibility:'public' | 'connections' | 'private';
  documentVisibility:'private' | 'verified_only';
  showEmail:        boolean;
  showPhone:        boolean;
  showBirthDate:    boolean;
  showAddress:      boolean;
  allowMessages:    'everyone' | 'connections' | 'none';
  searchable:       boolean;
  updatedAt:        string;
}
