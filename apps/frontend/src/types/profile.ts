// ── Profile & Identity Engine V3.1 ───────────────────────────────────────
//
// Backend-only tables (zero frontend types or functions):
//   profile_login_history — ip_address = NEVER (PII); security telemetry only
//   profile_embeddings    — embedding vector = NEVER (~12KB payload; HNSW server-side only)
//   profile_versions      — snapshot_data = full profile rollback dump; internal only
//   profile_audit_logs    — ip_address = NEVER (PII); partitioned compliance log
//
// NEVER fields:
//   profile_metrics.ai_score           — AI behavioral scoring signal; enables gaming
//   profile_metrics.trust_score        — AI behavioral scoring signal; enables gaming
//   profile_wallets.payout_methods     — may contain bank account / routing numbers
//   profile_reviews.ai_spam_score      — AI moderation signal
//   profile_reviews.toxicity_score     — AI moderation signal
//   profile_reviews.fake_review_score  — AI moderation signal
//   profile_business_info.tax_number   — sensitive financial identifier (EIN equivalent)
//
// Excluded (non-NEVER, still internal):
//   profiles.search_vector      — GENERATED TSVECTOR; not JSON-serializable; client uses .textSearch()
//   profiles.deleted_by         — exposes who deleted a profile; admin enumeration risk
//   profile_locations.geom      — PostGIS geography type; not JSON-serializable; use geohash/address
//   profile_availability.emergency_contact — third-party PII (names/phones of emergency contacts)
//   profile_references.referee_email   — third-party PII
//   profile_references.referee_phone   — third-party PII
//   profile_documents.ocr_text         — raw OCR may contain SSN/passport numbers
//   profile_documents.ai_validation    — internal AI processing state
//   profile_documents.face_match_score — internal biometric matching score
//   profile_verifications.metadata     — may contain sensitive verification payload
//   profile_reviews.sentiment          — internal AI analysis signal

// ── Core Identity ─────────────────────────────────────────────────────────

export const PROFILE_TYPES = [
  'personal', 'professional', 'freelancer', 'worker',
  'business', 'company', 'organization', 'government',
  'school', 'healthcare', 'ngo', 'creator',
  'hotel', 'restaurant', 'real_estate_agency', 'driver', 'vendor',
] as const;
export type ProfileType = typeof PROFILE_TYPES[number];

export const VERIFICATION_TIERS = ['none', 'bronze', 'silver', 'gold', 'platinum', 'government_certified'] as const;
export type VerificationTier = typeof VERIFICATION_TIERS[number];

export interface Profile {
  id: string;
  userId: string | null;
  profileType: ProfileType;
  username: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  about: string | null;
  avatarUrl: string | null;
  coverPhotoUrl: string | null;
  videoIntroUrl: string | null;
  // search_vector excluded — GENERATED TSVECTOR; not JSON-serializable; use textSearch()
  isVerified: boolean;
  verificationTier: VerificationTier;
  isFeatured: boolean;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  deletedAt: string | null;
  // deleted_by excluded — exposes who performed the deletion; admin enumeration risk
  complianceKycStatus: string; // 'pending' | 'approved' | 'rejected' — added by Migration 030; DEFAULT 'pending' fills existing rows
  createdAt: string;
  updatedAt: string;
}

// ── Metrics ───────────────────────────────────────────────────────────────

export interface ProfileMetrics {
  profileId: string;
  rating: number;
  reviewsCount: number;
  // trust_score excluded — NEVER (AI behavioral scoring signal; enables gaming)
  // ai_score excluded — NEVER (AI behavioral scoring signal; enables gaming)
  verificationScore: number;
  completionScore: number;
  successRate: number;
  responseRate: number;
  responseTimeMinutes: number;
  cancellationRate: number;
  jobSuccessScore: number;
  followersCount: number;
  followingCount: number;
  listingsCount: number;
  jobsCompleted: number;
  servicesCompleted: number;
  productsSold: number;
  bookingsCompleted: number;
  ordersCompleted: number;
  likesCount: number;
  sharesCount: number;
  postsCount: number;
  portfolioViews: number;
  documentsVerified: number;
  chatResponseScore: number;
  updatedAt: string;
}

// ── Location ──────────────────────────────────────────────────────────────

export interface ProfileLocation {
  profileId: string;
  country: string;
  countryCode: string | null;
  stateProvince: string | null;
  stateCode: string | null;
  city: string;
  cityCode: string | null;
  postalCode: string | null;
  addressLine: string | null;
  geohash: string | null;
  // geom excluded — PostGIS GEOGRAPHY type; not JSON-serializable; use geohash/address for display
  timeZone: string;
  locationSharing: boolean;
  updatedAt: string;
}

// ── Demographics & Availability ───────────────────────────────────────────

export interface ProfileDemographics {
  profileId: string;
  gender: string | null;
  birthday: string | null;
  nationality: string | null;
  updatedAt: string;
}

export const AVAILABILITY_STATUSES = [
  'online', 'offline', 'busy', 'available', 'vacation', 'emergency', 'hiring', 'in_contract',
] as const;
export type AvailabilityStatus = typeof AVAILABILITY_STATUSES[number];

export interface ProfileAvailability {
  profileId: string;
  availabilityStatus: AvailabilityStatus;
  workingHours: Record<string, unknown>;
  // emergency_contact excluded — third-party PII (names/phones of emergency contacts)
  vacationModeEnabled: boolean;
  vacationReturnDate: string | null;
  updatedAt: string;
}

// ── Wallet ────────────────────────────────────────────────────────────────

export interface ProfileWallet {
  profileId: string;
  walletStatus: string;
  preferredCurrency: string;
  escrowStatus: string;
  // payout_methods excluded — NEVER (may contain bank account / routing numbers)
  updatedAt: string;
}

// ── Languages ─────────────────────────────────────────────────────────────

export const PROFICIENCY_LEVELS = ['basic', 'conversational', 'fluent', 'native', 'bilingual'] as const;
export type ProficiencyLevel = typeof PROFICIENCY_LEVELS[number];

export interface ProfileLanguage {
  id: string;
  profileId: string;
  languageCode: string;
  languageName: string;
  proficiencyLevel: ProficiencyLevel | null;
  isPrimary: boolean;
  displayOrder: number;
  canRead: boolean;
  canWrite: boolean;
  canSpeak: boolean;
  createdAt: string;
}

// ── Experience, Education & Training ─────────────────────────────────────

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'freelance', 'internship', 'seasonal'] as const;
export type EmploymentType = typeof EMPLOYMENT_TYPES[number];

export interface ProfileExperience {
  id: string;
  profileId: string;
  title: string;
  companyName: string;
  companyId: string | null;
  location: string | null;
  employmentType: EmploymentType | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  industry: string | null;
  description: string | null;
  keyAchievements: unknown[];
  deletedAt: string | null;
  createdAt: string;
}

export interface ProfileEducation {
  id: string;
  profileId: string;
  institution: string;
  institutionId: string | null;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  grade: string | null;
  activitiesAndSocieties: string | null;
  description: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface ProfileTraining {
  id: string;
  profileId: string;
  trainingName: string;
  provider: string;
  completionDate: string | null;
  credentialUrl: string | null;
  createdAt: string;
}

// ── Skills ────────────────────────────────────────────────────────────────

export interface ProfileSkill {
  id: string;
  profileId: string;
  skillName: string;
  proficiencyYears: number;
  endorsementsCount: number;
  isVerifiedByAssessment: boolean;
  createdAt: string;
}

export interface ProfileSkillEndorsement {
  id: string;
  skillId: string;
  endorserId: string;
  createdAt: string;
}

export interface ProfileCertification {
  id: string;
  profileId: string;
  name: string;
  issuingOrganization: string;
  issueDate: string | null;
  expirationDate: string | null;
  doesNotExpire: boolean;
  credentialId: string | null;
  credentialUrl: string | null;
  verificationStatus: string;
  createdAt: string;
}

export interface ProfileLicense {
  id: string;
  profileId: string;
  licenseName: string;
  issuingStateOrCountry: string | null;
  licenseNumber: string;
  issueDate: string | null;
  expirationDate: string | null;
  documentUrl: string | null;
  createdAt: string;
}

// ── Awards & References ───────────────────────────────────────────────────

export interface ProfileAward {
  id: string;
  profileId: string;
  title: string;
  issuer: string;
  dateReceived: string | null;
  description: string | null;
  createdAt: string;
}

export interface ProfileReference {
  id: string;
  profileId: string;
  refereeName: string;
  refereeTitle: string | null;
  refereeCompany: string | null;
  // referee_email excluded — third-party PII
  // referee_phone excluded — third-party PII
  relationship: string | null;
  recommendationText: string | null;
  isVerified: boolean;
  createdAt: string;
}

// ── Business & Enterprise ─────────────────────────────────────────────────

export interface ProfileBusinessInfo {
  id: string;
  profileId: string;
  companyLegalName: string;
  tradeName: string | null;
  industry: string;
  businessType: string;
  businessSize: string | null;
  registrationNumber: string;
  // tax_number excluded — NEVER (equivalent to EIN; sensitive financial identifier)
  vatNumber: string | null;
  employeeCountRange: string | null;
  annualRevenueRange: string | null;
  foundedYear: number | null;
  websiteUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  openingHours: Record<string, unknown>;
  socialLinks: Record<string, unknown>;
  createdAt: string;
}

export interface ProfileBranch {
  id: string;
  businessProfileId: string;
  branchName: string;
  branchCode: string | null;
  isHeadquarters: boolean;
  country: string;
  city: string;
  address: string;
  phone: string | null;
  email: string | null;
  managerId: string | null;
  openingHours: Record<string, unknown>;
  createdAt: string;
}

export interface ProfileDepartment {
  id: string;
  businessProfileId: string;
  departmentName: string;
  headProfileId: string | null;
  description: string | null;
  createdAt: string;
}

export const COMPANY_ROLES = ['owner', 'admin', 'manager', 'member', 'contractor'] as const;
export type CompanyRole = typeof COMPANY_ROLES[number];

export interface ProfileTeamMember {
  id: string;
  businessProfileId: string;
  memberProfileId: string;
  departmentId: string | null;
  branchId: string | null;
  designation: string | null;
  roleInCompany: CompanyRole;
  permissions: Record<string, unknown>;
  joinedAt: string;
}

// ── Listings & Portfolio ──────────────────────────────────────────────────

export const LISTING_TYPES = [
  'job', 'service', 'product', 'property', 'vehicle', 'event', 'offer', 'hotel_room', 'restaurant_menu',
] as const;
export type ProfileListingType = typeof LISTING_TYPES[number];

export const LISTING_STATUSES = ['active', 'paused', 'sold', 'expired', 'closed'] as const;
export type ListingStatus = typeof LISTING_STATUSES[number];

export interface ProfileListing {
  id: string;
  profileId: string;
  listingType: ProfileListingType;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  status: ListingStatus;
  metadata: Record<string, unknown>;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PROJECT_TYPES = ['image', 'video', 'document', 'before_after', 'case_study', 'project'] as const;
export type ProjectType = typeof PROJECT_TYPES[number];

export const PORTFOLIO_VISIBILITY = ['public', 'private', 'connections_only'] as const;
export type PortfolioVisibility = typeof PORTFOLIO_VISIBILITY[number];

export interface ProfilePortfolioItem {
  id: string;
  profileId: string;
  title: string;
  description: string | null;
  projectType: ProjectType | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
  beforeMediaUrl: string | null;
  afterMediaUrl: string | null;
  externalLink: string | null;
  sortOrder: number;
  visibility: PortfolioVisibility;
  isFeatured: boolean;
  technologiesUsed: unknown[];
  createdAt: string;
}

// ── Reviews ───────────────────────────────────────────────────────────────

export const REVIEW_TYPES = ['customer', 'employer', 'employee', 'verified', 'peer'] as const;
export type ReviewType = typeof REVIEW_TYPES[number];

export interface ProfileReview {
  id: string;
  profileId: string;
  reviewerId: string | null;
  serviceId: string | null;
  jobId: string | null;
  orderId: string | null;
  bookingId: string | null;
  transactionId: string | null;
  rating: number;
  reviewType: ReviewType | null;
  title: string | null;
  comment: string | null;
  // ai_spam_score excluded — NEVER (AI moderation signal; enables review gaming)
  // toxicity_score excluded — NEVER (AI moderation signal)
  // fake_review_score excluded — NEVER (AI moderation signal)
  // sentiment excluded — internal AI analysis signal
  language: string | null;
  isFlaggedSpam: boolean;
  isVerified: boolean;
  responseFromOwner: string | null;
  responseAt: string | null;
  createdAt: string;
}

// ── Social Graph ──────────────────────────────────────────────────────────

export const FOLLOW_STATUSES = ['requested', 'accepted', 'blocked'] as const;
export type FollowStatus = typeof FOLLOW_STATUSES[number];

export interface ProfileFollower {
  id: string;
  followerId: string;
  followingId: string;
  status: FollowStatus;
  createdAt: string;
}

export const CONNECTION_STATUSES = ['pending', 'connected', 'blocked'] as const;
export type ConnectionStatus = typeof CONNECTION_STATUSES[number];

export interface ProfileConnection {
  id: string;
  profileId1: string;
  profileId2: string;
  status: ConnectionStatus;
  createdAt: string;
}

export interface ProfileCommunity {
  id: string;
  communityName: string;
  description: string | null;
  creatorProfileId: string | null;
  isPrivate: boolean;
  createdAt: string;
}

export const COMMUNITY_ROLES = ['admin', 'moderator', 'member'] as const;
export type CommunityRole = typeof COMMUNITY_ROLES[number];

export interface ProfileCommunityMember {
  id: string;
  communityId: string;
  profileId: string;
  role: CommunityRole;
  joinedAt: string;
}

// ── Documents & Verifications ─────────────────────────────────────────────

export const DOCUMENT_TYPES = [
  'identity_card', 'passport', 'driver_license', 'business_license',
  'certificate', 'insurance', 'tax_document', 'proof_of_address',
  'police_record', 'bank_statement',
] as const;
export type DocumentType = typeof DOCUMENT_TYPES[number];

export const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'] as const;
export type DocumentVerificationStatus = typeof VERIFICATION_STATUSES[number];

export interface ProfileDocument {
  id: string;
  profileId: string;
  documentType: DocumentType;
  documentUrl: string;
  documentNumber: string | null;
  issuingCountry: string | null;
  expirationDate: string | null;
  verificationStatus: DocumentVerificationStatus;
  rejectionReason: string | null;
  ocrStatus: string;
  // ocr_text excluded — raw OCR may contain SSN/passport numbers
  // ai_validation excluded — internal AI processing state
  // face_match_score excluded — internal biometric matching score
  uploadedAt: string;
}

export const VERIFICATION_METHODS = [
  'email', 'phone', 'government_id', 'face_verification', 'address', 'business', 'bank', 'payment',
] as const;
export type VerificationMethod = typeof VERIFICATION_METHODS[number];

export interface ProfileVerification {
  id: string;
  profileId: string;
  verificationMethod: VerificationMethod;
  isVerified: boolean;
  verifiedAt: string | null;
  // metadata excluded — may contain sensitive verification payload details
}

// ── Privacy & Security ────────────────────────────────────────────────────

export const PROFILE_VISIBILITY_OPTIONS = ['public', 'private', 'connections_only'] as const;
export type ProfileVisibility = typeof PROFILE_VISIBILITY_OPTIONS[number];

export interface ProfilePrivacySettings {
  profileId: string;
  profileVisibility: ProfileVisibility;
  searchVisibility: boolean;
  messagePermissions: string;
  callPermissions: string;
  locationSharing: boolean;
  lastSeenVisibility: string;
  readReceipts: boolean;
  profilePhotoVisibility: string;
  followersVisibility: string;
  reviewsVisibility: string;
  portfolioVisibility: string;
  documentsVisibility: string;
  updatedAt: string;
}

export interface ProfileSecurity {
  profileId: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: string;
  activeSessionsCount: number;
  lastLoginAt: string | null;
  securityAlertsEnabled: boolean;
  updatedAt: string;
}

// ── Analytics & AI Insights ───────────────────────────────────────────────

export interface ProfileAnalytics {
  profileId: string;
  profileViews: number;
  searchAppearances: number;
  clickRate: number;
  contactRate: number;
  conversionRate: number;
  followersGrowthRate: number;
  listingPerformance: Record<string, unknown>;
  recordedDate: string;
}

export interface ProfileAiInsights {
  profileId: string;
  recommendedSkills: unknown[];
  careerSuggestions: unknown[];
  aiResumeMarkdown: string | null;
  aiPortfolioHighlights: string | null;
  aiOptimizationTips: unknown[];
  optimizationScore: number;
  updatedAt: string;
}
