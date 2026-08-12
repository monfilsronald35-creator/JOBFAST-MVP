export const PROFILE_TYPES = [
  'worker', 'company', 'hotel', 'restaurant', 'doctor', 'clinic',
  'hospital', 'lawyer', 'seller', 'store', 'enterprise', 'school',
  'university', 'ngo', 'government', 'freelancer', 'technician',
  'driver', 'agent', 'admin', 'super_admin',
] as const;

export type ProfileType = typeof PROFILE_TYPES[number];

export const DOCUMENT_TYPES = [
  'resume', 'driver_license', 'passport', 'national_id', 'business_license',
  'medical_license', 'engineering_license', 'tax_certificate', 'insurance',
  'work_permit', 'other',
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];

export const VERIFICATION_TYPES = [
  'email', 'phone', 'identity', 'passport', 'government_id', 'business',
  'company', 'address', 'bank', 'license', 'face_verification',
  'selfie_match', 'manual_review',
] as const;

export type VerificationType = typeof VERIFICATION_TYPES[number];

export const VERIFICATION_STATUSES = [
  'pending', 'approved', 'rejected', 'expired',
] as const;

export type VerificationStatus = typeof VERIFICATION_STATUSES[number];

export const AVAILABILITY_STATES = [
  'available', 'busy', 'offline', 'vacation', 'do_not_disturb',
  'hiring', 'open_for_projects', 'closed',
] as const;

export type AvailabilityState = typeof AVAILABILITY_STATES[number];

export const VISIBILITY_OPTIONS = [
  'public', 'private', 'connections_only',
] as const;

export type Visibility = typeof VISIBILITY_OPTIONS[number];

export interface Profile {
  id: string;
  profileCode: string;
  profileType: ProfileType;
  displayName: string;
  headline: string | null;
  biography: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  emailPublic: string | null;
  phonePublic: string | null;
  countryId: string | null;
  stateId: string | null;
  cityId: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  timezone: string | null;
  preferredLanguage: string | null;
  currencyCode: string | null;
  completedPercentage: number;
  verificationLevel: number;
  visibility: Visibility;
  followersCount: number;
  followingCount: number;
  ratingAverage: number;
  ratingTotal: number;
  reviewsTotal: number;
  jobsCompleted: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
}

export interface ProfileLanguage {
  id: string;
  profileId: string;
  languageCode: string;
  proficiencyLevel: string | null;
  createdAt: string;
}

export interface ProfileSkill {
  id: string;
  profileId: string;
  skillName: string;
  yearsExperience: number;
  createdAt: string;
}

export interface ProfileExperience {
  id: string;
  profileId: string;
  title: string;
  companyName: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  createdAt: string;
}

export interface ProfileCertificate {
  id: string;
  profileId: string;
  name: string;
  issuingOrganization: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  createdAt: string;
}

export interface ProfileDocument {
  id: string;
  profileId: string;
  documentType: DocumentType;
  fileUrl: string;
  fileName: string | null;
  storageBucket: string | null;
  storagePath: string | null;
  mimeType: string | null;
  fileSize: number | null;
  checksum: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePortfolio {
  id: string;
  profileId: string;
  title: string;
  description: string | null;
  mediaUrls: string[] | null;
  projectUrl: string | null;
  createdAt: string;
}

export interface ProfileVerification {
  id: string;
  profileId: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  verifiedAt: string | null;
  verifierNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRating {
  id: string;
  profileId: string;
  professionalism: number;
  communication: number;
  quality: number;
  punctuality: number;
  cleanliness: number;
  hospitality: number;
  recommendation: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileReview {
  id: string;
  profileId: string;
  reviewerUserId: string | null;
  reviewerProfileId: string | null;
  text: string | null;
  stars: number | null;
  isAnonymous: boolean;
  verifiedPurchase: boolean;
  images: Record<string, unknown> | null;
  videos: Record<string, unknown> | null;
  ownerReply: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityStatus {
  id: string;
  profileId: string;
  status: AvailabilityState;
  customMessage: string | null;
  updatedAt: string;
}

export interface ProfileSocialLink {
  id: string;
  profileId: string;
  platformName: string;
  profileUrl: string;
  createdAt: string;
}

export interface ProfileContact {
  id: string;
  profileId: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileStatistics {
  id: string;
  profileId: string;
  profileViewsCount: number;
  searchAppearancesCount: number;
  responseRate: number;
  completionScore: number;
  followers: number;
  following: number;
  shares: number;
  bookmarks: number;
  favorites: number;
  clicks: number;
  impressions: number;
  updatedAt: string;
}

export interface ProfilePrivacySettings {
  id: string;
  profileId: string;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowMessagesFromStrangers: boolean;
  updatedAt: string;
}

export interface ProfileCategory {
  id: string;
  profileId: string;
  categoryName: string;
  subCategory: string | null;
  createdAt: string;
}

export interface ProfileBadge {
  id: string;
  profileId: string;
  badgeName: string;
  badgeDescription: string | null;
  awardedAt: string;
}

export interface ProfilePreference {
  id: string;
  profileId: string;
  jobTypes: string[] | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  currencyCode: string | null;
  openToRelocation: boolean;
  serviceRadiusKm: number;
  remoteOnly: boolean;
  availableWeekends: boolean;
  availableEvenings: boolean;
  travelRadius: number;
  preferredJobTypes: string[] | null;
  updatedAt: string;
}
