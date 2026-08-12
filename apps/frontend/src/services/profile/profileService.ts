import { supabase } from '../../lib/supabase';
import type {
  Profile,
  ProfileType,
  ProfileMetrics,
  ProfileLocation,
  ProfileDemographics,
  AvailabilityStatus,
  ProfileAvailability,
  ProfileWallet,
  ProficiencyLevel,
  ProfileLanguage,
  ProfileExperience,
  ProfileEducation,
  ProfileTraining,
  ProfileSkill,
  ProfileSkillEndorsement,
  ProfileCertification,
  ProfileLicense,
  ProfileAward,
  ProfileReference,
  ProfileBusinessInfo,
  ProfileBranch,
  ProfileDepartment,
  ProfileTeamMember,
  ProfileListingType,
  ListingStatus,
  ProfileListing,
  PortfolioVisibility,
  ProfilePortfolioItem,
  ReviewType,
  ProfileReview,
  FollowStatus,
  ProfileFollower,
  ConnectionStatus,
  ProfileConnection,
  ProfileCommunity,
  CommunityRole,
  ProfileCommunityMember,
  DocumentType,
  DocumentVerificationStatus,
  ProfileDocument,
  VerificationMethod,
  ProfileVerification,
  ProfilePrivacySettings,
  ProfileSecurity,
  ProfileAnalytics,
  ProfileAiInsights,
} from '../../types/profile';

// Backend-only tables — zero frontend code (4 of 38 tables):
//   profile_login_history — ip_address = NEVER (PII); security telemetry
//   profile_embeddings    — embedding vector = NEVER (~12KB; HNSW server-side only)
//   profile_versions      — snapshot_data = internal rollback mechanism
//   profile_audit_logs    — ip_address = NEVER (PII); partitioned compliance log

// ── Column constants ───────────────────────────────────────────────────────

const PROFILE_COLS = [
  'id', 'user_id', 'profile_type', 'username', 'display_name', 'headline',
  'bio', 'about', 'avatar_url', 'cover_photo_url', 'video_intro_url',
  'is_verified', 'verification_tier', 'is_featured', 'is_active',
  'is_suspended', 'suspension_reason', 'deleted_at', 'created_at', 'updated_at',
].join(', ');
// search_vector excluded — GENERATED TSVECTOR; not JSON-serializable; use .textSearch()
// deleted_by excluded — exposes who deleted a profile; admin enumeration risk

const METRICS_COLS = [
  'profile_id', 'rating', 'reviews_count', 'verification_score', 'completion_score',
  'success_rate', 'response_rate', 'response_time_minutes', 'cancellation_rate',
  'job_success_score', 'followers_count', 'following_count', 'listings_count',
  'jobs_completed', 'services_completed', 'products_sold', 'bookings_completed',
  'orders_completed', 'likes_count', 'shares_count', 'posts_count',
  'portfolio_views', 'documents_verified', 'chat_response_score', 'updated_at',
].join(', ');
// ai_score excluded — NEVER (AI behavioral scoring signal; enables gaming)
// trust_score excluded — NEVER (AI behavioral scoring signal; enables gaming)

const LOCATION_COLS = [
  'profile_id', 'country', 'country_code', 'state_province', 'state_code',
  'city', 'city_code', 'postal_code', 'address_line', 'geohash',
  'time_zone', 'location_sharing', 'updated_at',
].join(', ');
// geom excluded — PostGIS GEOGRAPHY type; not JSON-serializable; use geohash/address

const DEMOGRAPHICS_COLS = 'profile_id, gender, birthday, nationality, updated_at';
const AVAILABILITY_COLS = 'profile_id, availability_status, working_hours, vacation_mode_enabled, vacation_return_date, updated_at';
// emergency_contact excluded — third-party PII (names/phones of emergency contacts)
const WALLET_COLS = 'profile_id, wallet_status, preferred_currency, escrow_status, updated_at';
// payout_methods excluded — NEVER (may contain bank account / routing numbers)
const LANGUAGE_COLS = 'id, profile_id, language_code, language_name, proficiency_level, is_primary, display_order, can_read, can_write, can_speak, created_at';
const EXPERIENCE_COLS = 'id, profile_id, title, company_name, company_id, location, employment_type, start_date, end_date, is_current, industry, description, key_achievements, deleted_at, created_at';
const EDUCATION_COLS = 'id, profile_id, institution, institution_id, degree, field_of_study, start_date, end_date, grade, activities_and_societies, description, deleted_at, created_at';
const TRAINING_COLS = 'id, profile_id, training_name, provider, completion_date, credential_url, created_at';
const SKILL_COLS = 'id, profile_id, skill_name, proficiency_years, endorsements_count, is_verified_by_assessment, created_at';
const ENDORSEMENT_COLS = 'id, skill_id, endorser_id, created_at';
const CERT_COLS = 'id, profile_id, name, issuing_organization, issue_date, expiration_date, does_not_expire, credential_id, credential_url, verification_status, created_at';
const LICENSE_COLS = 'id, profile_id, license_name, issuing_state_or_country, license_number, issue_date, expiration_date, document_url, created_at';
const AWARD_COLS = 'id, profile_id, title, issuer, date_received, description, created_at';
const REFERENCE_COLS = 'id, profile_id, referee_name, referee_title, referee_company, relationship, recommendation_text, is_verified, created_at';
// referee_email excluded — third-party PII
// referee_phone excluded — third-party PII
const BUSINESS_COLS = [
  'id', 'profile_id', 'company_legal_name', 'trade_name', 'industry', 'business_type',
  'business_size', 'registration_number', 'vat_number', 'employee_count_range',
  'annual_revenue_range', 'founded_year', 'website_url', 'support_email', 'support_phone',
  'opening_hours', 'social_links', 'created_at',
].join(', ');
// tax_number excluded — NEVER (equivalent to EIN; sensitive financial identifier)
const BRANCH_COLS = 'id, business_profile_id, branch_name, branch_code, is_headquarters, country, city, address, phone, email, manager_id, opening_hours, created_at';
const DEPARTMENT_COLS = 'id, business_profile_id, department_name, head_profile_id, description, created_at';
const TEAM_MEMBER_COLS = 'id, business_profile_id, member_profile_id, department_id, branch_id, designation, role_in_company, permissions, joined_at';
const LISTING_COLS = 'id, profile_id, listing_type, title, slug, description, price, currency, status, metadata, deleted_at, created_at, updated_at';
const PORTFOLIO_COLS = 'id, profile_id, title, description, project_type, media_url, thumbnail_url, before_media_url, after_media_url, external_link, sort_order, visibility, is_featured, technologies_used, created_at';
const REVIEW_COLS = [
  'id', 'profile_id', 'reviewer_id', 'service_id', 'job_id', 'order_id', 'booking_id',
  'transaction_id', 'rating', 'review_type', 'title', 'comment', 'language',
  'is_flagged_spam', 'is_verified', 'response_from_owner', 'response_at', 'created_at',
].join(', ');
// ai_spam_score, toxicity_score, fake_review_score excluded — NEVER (AI moderation signals; enable gaming)
// sentiment excluded — internal AI analysis signal
const FOLLOWER_COLS = 'id, follower_id, following_id, status, created_at';
const CONNECTION_COLS = 'id, profile_id_1, profile_id_2, status, created_at';
const COMMUNITY_COLS = 'id, community_name, description, creator_profile_id, is_private, created_at';
const COMMUNITY_MEMBER_COLS = 'id, community_id, profile_id, role, joined_at';
const DOCUMENT_COLS = 'id, profile_id, document_type, document_url, document_number, issuing_country, expiration_date, verification_status, rejection_reason, ocr_status, uploaded_at';
// ocr_text excluded — raw OCR may contain SSN/passport numbers
// ai_validation excluded — internal AI processing state
// face_match_score excluded — internal biometric matching score
const VERIFICATION_COLS = 'id, profile_id, verification_method, is_verified, verified_at';
// metadata excluded — may contain sensitive verification payload details
const PRIVACY_COLS = 'profile_id, profile_visibility, search_visibility, message_permissions, call_permissions, location_sharing, last_seen_visibility, read_receipts, profile_photo_visibility, followers_visibility, reviews_visibility, portfolio_visibility, documents_visibility, updated_at';
const SECURITY_COLS = 'profile_id, two_factor_enabled, two_factor_method, active_sessions_count, last_login_at, security_alerts_enabled, updated_at';
const ANALYTICS_COLS = 'profile_id, profile_views, search_appearances, click_rate, contact_rate, conversion_rate, followers_growth_rate, listing_performance, recorded_date';
const AI_INSIGHTS_COLS = 'profile_id, recommended_skills, career_suggestions, ai_resume_markdown, ai_portfolio_highlights, ai_optimization_tips, optimization_score, updated_at';

// ── Row types ─────────────────────────────────────────────────────────────

type ProfileRow = { id: string; user_id: string | null; profile_type: ProfileType; username: string; display_name: string; headline: string | null; bio: string | null; about: string | null; avatar_url: string | null; cover_photo_url: string | null; video_intro_url: string | null; is_verified: boolean; verification_tier: Profile['verificationTier']; is_featured: boolean; is_active: boolean; is_suspended: boolean; suspension_reason: string | null; deleted_at: string | null; created_at: string; updated_at: string; };
type MetricsRow = { profile_id: string; rating: number; reviews_count: number; verification_score: number; completion_score: number; success_rate: number; response_rate: number; response_time_minutes: number; cancellation_rate: number; job_success_score: number; followers_count: number; following_count: number; listings_count: number; jobs_completed: number; services_completed: number; products_sold: number; bookings_completed: number; orders_completed: number; likes_count: number; shares_count: number; posts_count: number; portfolio_views: number; documents_verified: number; chat_response_score: number; updated_at: string; };
type LocationRow = { profile_id: string; country: string; country_code: string | null; state_province: string | null; state_code: string | null; city: string; city_code: string | null; postal_code: string | null; address_line: string | null; geohash: string | null; time_zone: string; location_sharing: boolean; updated_at: string; };
type DemographicsRow = { profile_id: string; gender: string | null; birthday: string | null; nationality: string | null; updated_at: string; };
type AvailabilityRow = { profile_id: string; availability_status: AvailabilityStatus; working_hours: Record<string, unknown>; vacation_mode_enabled: boolean; vacation_return_date: string | null; updated_at: string; };
type WalletRow = { profile_id: string; wallet_status: string; preferred_currency: string; escrow_status: string; updated_at: string; };
type LanguageRow = { id: string; profile_id: string; language_code: string; language_name: string; proficiency_level: ProficiencyLevel | null; is_primary: boolean; display_order: number; can_read: boolean; can_write: boolean; can_speak: boolean; created_at: string; };
type ExperienceRow = { id: string; profile_id: string; title: string; company_name: string; company_id: string | null; location: string | null; employment_type: ProfileExperience['employmentType']; start_date: string; end_date: string | null; is_current: boolean; industry: string | null; description: string | null; key_achievements: unknown[]; deleted_at: string | null; created_at: string; };
type EducationRow = { id: string; profile_id: string; institution: string; institution_id: string | null; degree: string | null; field_of_study: string | null; start_date: string | null; end_date: string | null; grade: string | null; activities_and_societies: string | null; description: string | null; deleted_at: string | null; created_at: string; };
type TrainingRow = { id: string; profile_id: string; training_name: string; provider: string; completion_date: string | null; credential_url: string | null; created_at: string; };
type SkillRow = { id: string; profile_id: string; skill_name: string; proficiency_years: number; endorsements_count: number; is_verified_by_assessment: boolean; created_at: string; };
type EndorsementRow = { id: string; skill_id: string; endorser_id: string; created_at: string; };
type CertRow = { id: string; profile_id: string; name: string; issuing_organization: string; issue_date: string | null; expiration_date: string | null; does_not_expire: boolean; credential_id: string | null; credential_url: string | null; verification_status: string; created_at: string; };
type LicenseRow = { id: string; profile_id: string; license_name: string; issuing_state_or_country: string | null; license_number: string; issue_date: string | null; expiration_date: string | null; document_url: string | null; created_at: string; };
type AwardRow = { id: string; profile_id: string; title: string; issuer: string; date_received: string | null; description: string | null; created_at: string; };
type ReferenceRow = { id: string; profile_id: string; referee_name: string; referee_title: string | null; referee_company: string | null; relationship: string | null; recommendation_text: string | null; is_verified: boolean; created_at: string; };
type BusinessRow = { id: string; profile_id: string; company_legal_name: string; trade_name: string | null; industry: string; business_type: string; business_size: string | null; registration_number: string; vat_number: string | null; employee_count_range: string | null; annual_revenue_range: string | null; founded_year: number | null; website_url: string | null; support_email: string | null; support_phone: string | null; opening_hours: Record<string, unknown>; social_links: Record<string, unknown>; created_at: string; };
type BranchRow = { id: string; business_profile_id: string; branch_name: string; branch_code: string | null; is_headquarters: boolean; country: string; city: string; address: string; phone: string | null; email: string | null; manager_id: string | null; opening_hours: Record<string, unknown>; created_at: string; };
type DepartmentRow = { id: string; business_profile_id: string; department_name: string; head_profile_id: string | null; description: string | null; created_at: string; };
type TeamMemberRow = { id: string; business_profile_id: string; member_profile_id: string; department_id: string | null; branch_id: string | null; designation: string | null; role_in_company: ProfileTeamMember['roleInCompany']; permissions: Record<string, unknown>; joined_at: string; };
type ListingRow = { id: string; profile_id: string; listing_type: ProfileListingType; title: string; slug: string; description: string; price: number; currency: string; status: ListingStatus; metadata: Record<string, unknown>; deleted_at: string | null; created_at: string; updated_at: string; };
type PortfolioRow = { id: string; profile_id: string; title: string; description: string | null; project_type: ProfilePortfolioItem['projectType']; media_url: string; thumbnail_url: string | null; before_media_url: string | null; after_media_url: string | null; external_link: string | null; sort_order: number; visibility: PortfolioVisibility; is_featured: boolean; technologies_used: unknown[]; created_at: string; };
type ReviewRow = { id: string; profile_id: string; reviewer_id: string | null; service_id: string | null; job_id: string | null; order_id: string | null; booking_id: string | null; transaction_id: string | null; rating: number; review_type: ReviewType | null; title: string | null; comment: string | null; language: string | null; is_flagged_spam: boolean; is_verified: boolean; response_from_owner: string | null; response_at: string | null; created_at: string; };
type FollowerRow = { id: string; follower_id: string; following_id: string; status: FollowStatus; created_at: string; };
type ConnectionRow = { id: string; profile_id_1: string; profile_id_2: string; status: ConnectionStatus; created_at: string; };
type CommunityRow = { id: string; community_name: string; description: string | null; creator_profile_id: string | null; is_private: boolean; created_at: string; };
type CommunityMemberRow = { id: string; community_id: string; profile_id: string; role: CommunityRole; joined_at: string; };
type DocumentRow = { id: string; profile_id: string; document_type: DocumentType; document_url: string; document_number: string | null; issuing_country: string | null; expiration_date: string | null; verification_status: DocumentVerificationStatus; rejection_reason: string | null; ocr_status: string; uploaded_at: string; };
type VerificationRow = { id: string; profile_id: string; verification_method: VerificationMethod; is_verified: boolean; verified_at: string | null; };
type PrivacyRow = { profile_id: string; profile_visibility: string; search_visibility: boolean; message_permissions: string; call_permissions: string; location_sharing: boolean; last_seen_visibility: string; read_receipts: boolean; profile_photo_visibility: string; followers_visibility: string; reviews_visibility: string; portfolio_visibility: string; documents_visibility: string; updated_at: string; };
type SecurityRow = { profile_id: string; two_factor_enabled: boolean; two_factor_method: string; active_sessions_count: number; last_login_at: string | null; security_alerts_enabled: boolean; updated_at: string; };
type AnalyticsRow = { profile_id: string; profile_views: number; search_appearances: number; click_rate: number; contact_rate: number; conversion_rate: number; followers_growth_rate: number; listing_performance: Record<string, unknown>; recorded_date: string; };
type AiInsightsRow = { profile_id: string; recommended_skills: unknown[]; career_suggestions: unknown[]; ai_resume_markdown: string | null; ai_portfolio_highlights: string | null; ai_optimization_tips: unknown[]; optimization_score: number; updated_at: string; };

// ── Mappers ───────────────────────────────────────────────────────────────

const mapProfile = (r: ProfileRow): Profile => ({ id: r.id, userId: r.user_id, profileType: r.profile_type, username: r.username, displayName: r.display_name, headline: r.headline, bio: r.bio, about: r.about, avatarUrl: r.avatar_url, coverPhotoUrl: r.cover_photo_url, videoIntroUrl: r.video_intro_url, isVerified: r.is_verified, verificationTier: r.verification_tier, isFeatured: r.is_featured, isActive: r.is_active, isSuspended: r.is_suspended, suspensionReason: r.suspension_reason, deletedAt: r.deleted_at, createdAt: r.created_at, updatedAt: r.updated_at });
const mapMetrics = (r: MetricsRow): ProfileMetrics => ({ profileId: r.profile_id, rating: r.rating, reviewsCount: r.reviews_count, verificationScore: r.verification_score, completionScore: r.completion_score, successRate: r.success_rate, responseRate: r.response_rate, responseTimeMinutes: r.response_time_minutes, cancellationRate: r.cancellation_rate, jobSuccessScore: r.job_success_score, followersCount: r.followers_count, followingCount: r.following_count, listingsCount: r.listings_count, jobsCompleted: r.jobs_completed, servicesCompleted: r.services_completed, productsSold: r.products_sold, bookingsCompleted: r.bookings_completed, ordersCompleted: r.orders_completed, likesCount: r.likes_count, sharesCount: r.shares_count, postsCount: r.posts_count, portfolioViews: r.portfolio_views, documentsVerified: r.documents_verified, chatResponseScore: r.chat_response_score, updatedAt: r.updated_at });
const mapLocation = (r: LocationRow): ProfileLocation => ({ profileId: r.profile_id, country: r.country, countryCode: r.country_code, stateProvince: r.state_province, stateCode: r.state_code, city: r.city, cityCode: r.city_code, postalCode: r.postal_code, addressLine: r.address_line, geohash: r.geohash, timeZone: r.time_zone, locationSharing: r.location_sharing, updatedAt: r.updated_at });
const mapDemographics = (r: DemographicsRow): ProfileDemographics => ({ profileId: r.profile_id, gender: r.gender, birthday: r.birthday, nationality: r.nationality, updatedAt: r.updated_at });
const mapAvailability = (r: AvailabilityRow): ProfileAvailability => ({ profileId: r.profile_id, availabilityStatus: r.availability_status, workingHours: r.working_hours, vacationModeEnabled: r.vacation_mode_enabled, vacationReturnDate: r.vacation_return_date, updatedAt: r.updated_at });
const mapWallet = (r: WalletRow): ProfileWallet => ({ profileId: r.profile_id, walletStatus: r.wallet_status, preferredCurrency: r.preferred_currency, escrowStatus: r.escrow_status, updatedAt: r.updated_at });
const mapLanguage = (r: LanguageRow): ProfileLanguage => ({ id: r.id, profileId: r.profile_id, languageCode: r.language_code, languageName: r.language_name, proficiencyLevel: r.proficiency_level, isPrimary: r.is_primary, displayOrder: r.display_order, canRead: r.can_read, canWrite: r.can_write, canSpeak: r.can_speak, createdAt: r.created_at });
const mapExperience = (r: ExperienceRow): ProfileExperience => ({ id: r.id, profileId: r.profile_id, title: r.title, companyName: r.company_name, companyId: r.company_id, location: r.location, employmentType: r.employment_type, startDate: r.start_date, endDate: r.end_date, isCurrent: r.is_current, industry: r.industry, description: r.description, keyAchievements: r.key_achievements, deletedAt: r.deleted_at, createdAt: r.created_at });
const mapEducation = (r: EducationRow): ProfileEducation => ({ id: r.id, profileId: r.profile_id, institution: r.institution, institutionId: r.institution_id, degree: r.degree, fieldOfStudy: r.field_of_study, startDate: r.start_date, endDate: r.end_date, grade: r.grade, activitiesAndSocieties: r.activities_and_societies, description: r.description, deletedAt: r.deleted_at, createdAt: r.created_at });
const mapTraining = (r: TrainingRow): ProfileTraining => ({ id: r.id, profileId: r.profile_id, trainingName: r.training_name, provider: r.provider, completionDate: r.completion_date, credentialUrl: r.credential_url, createdAt: r.created_at });
const mapSkill = (r: SkillRow): ProfileSkill => ({ id: r.id, profileId: r.profile_id, skillName: r.skill_name, proficiencyYears: r.proficiency_years, endorsementsCount: r.endorsements_count, isVerifiedByAssessment: r.is_verified_by_assessment, createdAt: r.created_at });
const mapEndorsement = (r: EndorsementRow): ProfileSkillEndorsement => ({ id: r.id, skillId: r.skill_id, endorserId: r.endorser_id, createdAt: r.created_at });
const mapCert = (r: CertRow): ProfileCertification => ({ id: r.id, profileId: r.profile_id, name: r.name, issuingOrganization: r.issuing_organization, issueDate: r.issue_date, expirationDate: r.expiration_date, doesNotExpire: r.does_not_expire, credentialId: r.credential_id, credentialUrl: r.credential_url, verificationStatus: r.verification_status, createdAt: r.created_at });
const mapLicense = (r: LicenseRow): ProfileLicense => ({ id: r.id, profileId: r.profile_id, licenseName: r.license_name, issuingStateOrCountry: r.issuing_state_or_country, licenseNumber: r.license_number, issueDate: r.issue_date, expirationDate: r.expiration_date, documentUrl: r.document_url, createdAt: r.created_at });
const mapAward = (r: AwardRow): ProfileAward => ({ id: r.id, profileId: r.profile_id, title: r.title, issuer: r.issuer, dateReceived: r.date_received, description: r.description, createdAt: r.created_at });
const mapReference = (r: ReferenceRow): ProfileReference => ({ id: r.id, profileId: r.profile_id, refereeName: r.referee_name, refereeTitle: r.referee_title, refereeCompany: r.referee_company, relationship: r.relationship, recommendationText: r.recommendation_text, isVerified: r.is_verified, createdAt: r.created_at });
const mapBusiness = (r: BusinessRow): ProfileBusinessInfo => ({ id: r.id, profileId: r.profile_id, companyLegalName: r.company_legal_name, tradeName: r.trade_name, industry: r.industry, businessType: r.business_type, businessSize: r.business_size, registrationNumber: r.registration_number, vatNumber: r.vat_number, employeeCountRange: r.employee_count_range, annualRevenueRange: r.annual_revenue_range, foundedYear: r.founded_year, websiteUrl: r.website_url, supportEmail: r.support_email, supportPhone: r.support_phone, openingHours: r.opening_hours, socialLinks: r.social_links, createdAt: r.created_at });
const mapBranch = (r: BranchRow): ProfileBranch => ({ id: r.id, businessProfileId: r.business_profile_id, branchName: r.branch_name, branchCode: r.branch_code, isHeadquarters: r.is_headquarters, country: r.country, city: r.city, address: r.address, phone: r.phone, email: r.email, managerId: r.manager_id, openingHours: r.opening_hours, createdAt: r.created_at });
const mapDepartment = (r: DepartmentRow): ProfileDepartment => ({ id: r.id, businessProfileId: r.business_profile_id, departmentName: r.department_name, headProfileId: r.head_profile_id, description: r.description, createdAt: r.created_at });
const mapTeamMember = (r: TeamMemberRow): ProfileTeamMember => ({ id: r.id, businessProfileId: r.business_profile_id, memberProfileId: r.member_profile_id, departmentId: r.department_id, branchId: r.branch_id, designation: r.designation, roleInCompany: r.role_in_company, permissions: r.permissions, joinedAt: r.joined_at });
const mapListing = (r: ListingRow): ProfileListing => ({ id: r.id, profileId: r.profile_id, listingType: r.listing_type, title: r.title, slug: r.slug, description: r.description, price: r.price, currency: r.currency, status: r.status, metadata: r.metadata, deletedAt: r.deleted_at, createdAt: r.created_at, updatedAt: r.updated_at });
const mapPortfolio = (r: PortfolioRow): ProfilePortfolioItem => ({ id: r.id, profileId: r.profile_id, title: r.title, description: r.description, projectType: r.project_type, mediaUrl: r.media_url, thumbnailUrl: r.thumbnail_url, beforeMediaUrl: r.before_media_url, afterMediaUrl: r.after_media_url, externalLink: r.external_link, sortOrder: r.sort_order, visibility: r.visibility, isFeatured: r.is_featured, technologiesUsed: r.technologies_used, createdAt: r.created_at });
const mapReview = (r: ReviewRow): ProfileReview => ({ id: r.id, profileId: r.profile_id, reviewerId: r.reviewer_id, serviceId: r.service_id, jobId: r.job_id, orderId: r.order_id, bookingId: r.booking_id, transactionId: r.transaction_id, rating: r.rating, reviewType: r.review_type, title: r.title, comment: r.comment, language: r.language, isFlaggedSpam: r.is_flagged_spam, isVerified: r.is_verified, responseFromOwner: r.response_from_owner, responseAt: r.response_at, createdAt: r.created_at });
const mapFollower = (r: FollowerRow): ProfileFollower => ({ id: r.id, followerId: r.follower_id, followingId: r.following_id, status: r.status, createdAt: r.created_at });
const mapConnection = (r: ConnectionRow): ProfileConnection => ({ id: r.id, profileId1: r.profile_id_1, profileId2: r.profile_id_2, status: r.status, createdAt: r.created_at });
const mapCommunity = (r: CommunityRow): ProfileCommunity => ({ id: r.id, communityName: r.community_name, description: r.description, creatorProfileId: r.creator_profile_id, isPrivate: r.is_private, createdAt: r.created_at });
const mapCommunityMember = (r: CommunityMemberRow): ProfileCommunityMember => ({ id: r.id, communityId: r.community_id, profileId: r.profile_id, role: r.role, joinedAt: r.joined_at });
const mapDocument = (r: DocumentRow): ProfileDocument => ({ id: r.id, profileId: r.profile_id, documentType: r.document_type, documentUrl: r.document_url, documentNumber: r.document_number, issuingCountry: r.issuing_country, expirationDate: r.expiration_date, verificationStatus: r.verification_status, rejectionReason: r.rejection_reason, ocrStatus: r.ocr_status, uploadedAt: r.uploaded_at });
const mapVerification = (r: VerificationRow): ProfileVerification => ({ id: r.id, profileId: r.profile_id, verificationMethod: r.verification_method, isVerified: r.is_verified, verifiedAt: r.verified_at });
const mapPrivacy = (r: PrivacyRow): ProfilePrivacySettings => ({ profileId: r.profile_id, profileVisibility: r.profile_visibility as ProfilePrivacySettings['profileVisibility'], searchVisibility: r.search_visibility, messagePermissions: r.message_permissions, callPermissions: r.call_permissions, locationSharing: r.location_sharing, lastSeenVisibility: r.last_seen_visibility, readReceipts: r.read_receipts, profilePhotoVisibility: r.profile_photo_visibility, followersVisibility: r.followers_visibility, reviewsVisibility: r.reviews_visibility, portfolioVisibility: r.portfolio_visibility, documentsVisibility: r.documents_visibility, updatedAt: r.updated_at });
const mapSecurity = (r: SecurityRow): ProfileSecurity => ({ profileId: r.profile_id, twoFactorEnabled: r.two_factor_enabled, twoFactorMethod: r.two_factor_method, activeSessionsCount: r.active_sessions_count, lastLoginAt: r.last_login_at, securityAlertsEnabled: r.security_alerts_enabled, updatedAt: r.updated_at });
const mapAnalytics = (r: AnalyticsRow): ProfileAnalytics => ({ profileId: r.profile_id, profileViews: r.profile_views, searchAppearances: r.search_appearances, clickRate: r.click_rate, contactRate: r.contact_rate, conversionRate: r.conversion_rate, followersGrowthRate: r.followers_growth_rate, listingPerformance: r.listing_performance, recordedDate: r.recorded_date });
const mapAiInsights = (r: AiInsightsRow): ProfileAiInsights => ({ profileId: r.profile_id, recommendedSkills: r.recommended_skills, careerSuggestions: r.career_suggestions, aiResumeMarkdown: r.ai_resume_markdown, aiPortfolioHighlights: r.ai_portfolio_highlights, aiOptimizationTips: r.ai_optimization_tips, optimizationScore: r.optimization_score, updatedAt: r.updated_at });

// ── Profile functions ─────────────────────────────────────────────────────

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLS).eq('id', id).eq('is_active', true).single();
  if (error) throw error;
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLS).eq('username', username).eq('is_active', true).single();
  if (error) throw error;
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function searchProfiles(query: string, options: { profileType?: ProfileType; limit?: number } = {}): Promise<Profile[]> {
  let q = supabase.from('profiles').select(PROFILE_COLS).textSearch('search_vector', query, { type: 'websearch' }).eq('is_active', true);
  if (options.profileType) q = q.eq('profile_type', options.profileType);
  const { data, error } = await q.limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ProfileRow[]).map(mapProfile);
}

export async function getFeaturedProfiles(profileType?: ProfileType): Promise<Profile[]> {
  let q = supabase.from('profiles').select(PROFILE_COLS).eq('is_featured', true).eq('is_active', true).eq('is_verified', true);
  if (profileType) q = q.eq('profile_type', profileType);
  const { data, error } = await q.order('updated_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data as ProfileRow[]).map(mapProfile);
}

// ── Metrics functions ─────────────────────────────────────────────────────

export async function getProfileMetrics(profileId: string): Promise<ProfileMetrics | null> {
  const { data, error } = await supabase.from('profile_metrics').select(METRICS_COLS).eq('profile_id', profileId).single();
  if (error) throw error;
  return data ? mapMetrics(data as MetricsRow) : null;
}

// ── Location functions ────────────────────────────────────────────────────

export async function getProfileLocation(profileId: string): Promise<ProfileLocation | null> {
  const { data, error } = await supabase.from('profile_locations').select(LOCATION_COLS).eq('profile_id', profileId).single();
  if (error) throw error;
  return data ? mapLocation(data as LocationRow) : null;
}

export async function getProfilesByCity(city: string, profileType?: ProfileType): Promise<Profile[]> {
  let q = supabase.from('profile_locations').select(`${LOCATION_COLS}, profiles!inner(${PROFILE_COLS})`).eq('city', city).eq('location_sharing', true);
  if (profileType) q = q.eq('profiles.profile_type', profileType);
  const { data, error } = await q.limit(100);
  if (error) throw error;
  return ((data as { profiles: ProfileRow }[]).map(r => mapProfile(r.profiles)));
}

// ── Demographics & Availability functions ─────────────────────────────────

export async function getProfileDemographics(profileId: string): Promise<ProfileDemographics | null> {
  const { data, error } = await supabase.from('profile_demographics').select(DEMOGRAPHICS_COLS).eq('profile_id', profileId).single();
  if (error) throw error;
  return data ? mapDemographics(data as DemographicsRow) : null;
}

export async function getProfileAvailability(profileId: string): Promise<ProfileAvailability | null> {
  const { data, error } = await supabase.from('profile_availability').select(AVAILABILITY_COLS).eq('profile_id', profileId).single();
  if (error) throw error;
  return data ? mapAvailability(data as AvailabilityRow) : null;
}

export async function getAvailableProfiles(status: AvailabilityStatus, options: { limit?: number } = {}): Promise<ProfileAvailability[]> {
  const { data, error } = await supabase.from('profile_availability').select(AVAILABILITY_COLS).eq('availability_status', status).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as AvailabilityRow[]).map(mapAvailability);
}

// ── Wallet functions ──────────────────────────────────────────────────────

export async function getProfileWallet(profileId: string): Promise<ProfileWallet | null> {
  const { data, error } = await supabase.from('profile_wallets').select(WALLET_COLS).eq('profile_id', profileId).single();
  if (error) throw error;
  return data ? mapWallet(data as WalletRow) : null;
}

// ── Language functions ────────────────────────────────────────────────────

export async function getProfileLanguages(profileId: string): Promise<ProfileLanguage[]> {
  const { data, error } = await supabase.from('profile_languages').select(LANGUAGE_COLS).eq('profile_id', profileId).order('display_order', { ascending: true });
  if (error) throw error;
  return (data as LanguageRow[]).map(mapLanguage);
}

export async function getProfilesByLanguage(languageCode: string, proficiencyLevel?: ProficiencyLevel): Promise<ProfileLanguage[]> {
  let q = supabase.from('profile_languages').select(LANGUAGE_COLS).eq('language_code', languageCode);
  if (proficiencyLevel) q = q.eq('proficiency_level', proficiencyLevel);
  const { data, error } = await q.limit(100);
  if (error) throw error;
  return (data as LanguageRow[]).map(mapLanguage);
}

// ── Experience functions ──────────────────────────────────────────────────

export async function getProfileExperiences(profileId: string): Promise<ProfileExperience[]> {
  const { data, error } = await supabase.from('profile_experience').select(EXPERIENCE_COLS).eq('profile_id', profileId).is('deleted_at', null).order('start_date', { ascending: false });
  if (error) throw error;
  return (data as ExperienceRow[]).map(mapExperience);
}

export async function getCurrentPositions(profileId: string): Promise<ProfileExperience[]> {
  const { data, error } = await supabase.from('profile_experience').select(EXPERIENCE_COLS).eq('profile_id', profileId).eq('is_current', true).is('deleted_at', null);
  if (error) throw error;
  return (data as ExperienceRow[]).map(mapExperience);
}

// ── Education functions ───────────────────────────────────────────────────

export async function getProfileEducation(profileId: string): Promise<ProfileEducation[]> {
  const { data, error } = await supabase.from('profile_education').select(EDUCATION_COLS).eq('profile_id', profileId).is('deleted_at', null).order('end_date', { ascending: false });
  if (error) throw error;
  return (data as EducationRow[]).map(mapEducation);
}

// ── Training functions ────────────────────────────────────────────────────

export async function getProfileTrainings(profileId: string): Promise<ProfileTraining[]> {
  const { data, error } = await supabase.from('profile_trainings').select(TRAINING_COLS).eq('profile_id', profileId).order('completion_date', { ascending: false });
  if (error) throw error;
  return (data as TrainingRow[]).map(mapTraining);
}

// ── Skill functions ───────────────────────────────────────────────────────

export async function getProfileSkills(profileId: string): Promise<ProfileSkill[]> {
  const { data, error } = await supabase.from('profile_skills').select(SKILL_COLS).eq('profile_id', profileId).order('endorsements_count', { ascending: false });
  if (error) throw error;
  return (data as SkillRow[]).map(mapSkill);
}

export async function getSkillEndorsements(skillId: string): Promise<ProfileSkillEndorsement[]> {
  const { data, error } = await supabase.from('profile_skill_endorsements').select(ENDORSEMENT_COLS).eq('skill_id', skillId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as EndorsementRow[]).map(mapEndorsement);
}

// ── Certification & License functions ─────────────────────────────────────

export async function getProfileCertifications(profileId: string): Promise<ProfileCertification[]> {
  const { data, error } = await supabase.from('profile_certifications').select(CERT_COLS).eq('profile_id', profileId).order('issue_date', { ascending: false });
  if (error) throw error;
  return (data as CertRow[]).map(mapCert);
}

export async function getVerifiedCertifications(profileId: string): Promise<ProfileCertification[]> {
  const { data, error } = await supabase.from('profile_certifications').select(CERT_COLS).eq('profile_id', profileId).eq('verification_status', 'verified');
  if (error) throw error;
  return (data as CertRow[]).map(mapCert);
}

export async function getProfileLicenses(profileId: string): Promise<ProfileLicense[]> {
  const { data, error } = await supabase.from('profile_licenses').select(LICENSE_COLS).eq('profile_id', profileId).order('issue_date', { ascending: false });
  if (error) throw error;
  return (data as LicenseRow[]).map(mapLicense);
}

// ── Awards & References functions ─────────────────────────────────────────

export async function getProfileAwards(profileId: string): Promise<ProfileAward[]> {
  const { data, error } = await supabase.from('profile_awards').select(AWARD_COLS).eq('profile_id', profileId).order('date_received', { ascending: false });
  if (error) throw error;
  return (data as AwardRow[]).map(mapAward);
}

export async function getProfileReferences(profileId: string): Promise<ProfileReference[]> {
  const { data, error } = await supabase.from('profile_references').select(REFERENCE_COLS).eq('profile_id', profileId);
  if (error) throw error;
  return (data as ReferenceRow[]).map(mapReference);
}

// ── Business functions ────────────────────────────────────────────────────

export async function getProfileBusinessInfo(profileId: string): Promise<ProfileBusinessInfo | null> {
  const { data, error } = await supabase.from('profile_business_info').select(BUSINESS_COLS).eq('profile_id', profileId).single();
  if (error) throw error;
  return data ? mapBusiness(data as BusinessRow) : null;
}

export async function getProfileBranches(businessProfileId: string): Promise<ProfileBranch[]> {
  const { data, error } = await supabase.from('profile_branches').select(BRANCH_COLS).eq('business_profile_id', businessProfileId).order('is_headquarters', { ascending: false });
  if (error) throw error;
  return (data as BranchRow[]).map(mapBranch);
}

export async function getProfileDepartments(businessProfileId: string): Promise<ProfileDepartment[]> {
  const { data, error } = await supabase.from('profile_departments').select(DEPARTMENT_COLS).eq('business_profile_id', businessProfileId);
  if (error) throw error;
  return (data as DepartmentRow[]).map(mapDepartment);
}

export async function getTeamMembers(businessProfileId: string): Promise<ProfileTeamMember[]> {
  const { data, error } = await supabase.from('profile_team_members').select(TEAM_MEMBER_COLS).eq('business_profile_id', businessProfileId).order('joined_at', { ascending: true });
  if (error) throw error;
  return (data as TeamMemberRow[]).map(mapTeamMember);
}

// ── Listing functions ─────────────────────────────────────────────────────

export async function getProfileListings(profileId: string, options: { listingType?: ProfileListingType; status?: ListingStatus; limit?: number } = {}): Promise<ProfileListing[]> {
  let q = supabase.from('profile_listings').select(LISTING_COLS).eq('profile_id', profileId).is('deleted_at', null);
  if (options.listingType) q = q.eq('listing_type', options.listingType);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q.order('updated_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ListingRow[]).map(mapListing);
}

export async function getListing(id: string): Promise<ProfileListing | null> {
  const { data, error } = await supabase.from('profile_listings').select(LISTING_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapListing(data as ListingRow) : null;
}

export async function getActiveListingsByType(listingType: ProfileListingType, options: { limit?: number } = {}): Promise<ProfileListing[]> {
  const { data, error } = await supabase.from('profile_listings').select(LISTING_COLS).eq('listing_type', listingType).eq('status', 'active').is('deleted_at', null).order('updated_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ListingRow[]).map(mapListing);
}

// ── Portfolio functions ───────────────────────────────────────────────────

export async function getProfilePortfolio(profileId: string, options: { visibility?: PortfolioVisibility; isFeatured?: boolean } = {}): Promise<ProfilePortfolioItem[]> {
  let q = supabase.from('profile_portfolio').select(PORTFOLIO_COLS).eq('profile_id', profileId);
  if (options.visibility) q = q.eq('visibility', options.visibility);
  if (options.isFeatured !== undefined) q = q.eq('is_featured', options.isFeatured);
  const { data, error } = await q.order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as PortfolioRow[]).map(mapPortfolio);
}

// ── Review functions ──────────────────────────────────────────────────────

export async function getProfileReviews(profileId: string, options: { reviewType?: ReviewType; minRating?: number; limit?: number } = {}): Promise<ProfileReview[]> {
  let q = supabase.from('profile_reviews').select(REVIEW_COLS).eq('profile_id', profileId).eq('is_flagged_spam', false);
  if (options.reviewType) q = q.eq('review_type', options.reviewType);
  if (options.minRating) q = q.gte('rating', options.minRating);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ReviewRow[]).map(mapReview);
}

export async function getVerifiedReviews(profileId: string): Promise<ProfileReview[]> {
  const { data, error } = await supabase.from('profile_reviews').select(REVIEW_COLS).eq('profile_id', profileId).eq('is_verified', true).eq('is_flagged_spam', false).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ReviewRow[]).map(mapReview);
}

export async function getReviewsByReviewer(reviewerId: string, options: { limit?: number } = {}): Promise<ProfileReview[]> {
  const { data, error } = await supabase.from('profile_reviews').select(REVIEW_COLS).eq('reviewer_id', reviewerId).order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as ReviewRow[]).map(mapReview);
}

// ── Follower functions ────────────────────────────────────────────────────

export async function getFollowers(profileId: string, options: { limit?: number } = {}): Promise<ProfileFollower[]> {
  const { data, error } = await supabase.from('profile_followers').select(FOLLOWER_COLS).eq('following_id', profileId).eq('status', 'accepted').order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as FollowerRow[]).map(mapFollower);
}

export async function getFollowing(profileId: string, options: { limit?: number } = {}): Promise<ProfileFollower[]> {
  const { data, error } = await supabase.from('profile_followers').select(FOLLOWER_COLS).eq('follower_id', profileId).eq('status', 'accepted').order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as FollowerRow[]).map(mapFollower);
}

export async function getFollowStatus(followerId: string, followingId: string): Promise<ProfileFollower | null> {
  const { data, error } = await supabase.from('profile_followers').select(FOLLOWER_COLS).eq('follower_id', followerId).eq('following_id', followingId).maybeSingle();
  if (error) throw error;
  return data ? mapFollower(data as FollowerRow) : null;
}

// ── Connection functions ──────────────────────────────────────────────────

export async function getConnections(profileId: string, options: { status?: ConnectionStatus; limit?: number } = {}): Promise<ProfileConnection[]> {
  let q = supabase.from('profile_connections').select(CONNECTION_COLS).or(`profile_id_1.eq.${profileId},profile_id_2.eq.${profileId}`);
  if (options.status) q = q.eq('status', options.status);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as ConnectionRow[]).map(mapConnection);
}

export async function getConnectionBetween(profileId1: string, profileId2: string): Promise<ProfileConnection | null> {
  const { data, error } = await supabase.from('profile_connections').select(CONNECTION_COLS).or(`and(profile_id_1.eq.${profileId1},profile_id_2.eq.${profileId2}),and(profile_id_1.eq.${profileId2},profile_id_2.eq.${profileId1})`).maybeSingle();
  if (error) throw error;
  return data ? mapConnection(data as ConnectionRow) : null;
}

// ── Community functions ───────────────────────────────────────────────────

export async function getPublicCommunities(options: { limit?: number } = {}): Promise<ProfileCommunity[]> {
  const { data, error } = await supabase.from('profile_communities').select(COMMUNITY_COLS).eq('is_private', false).order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as CommunityRow[]).map(mapCommunity);
}

export async function getCommunityMembers(communityId: string, options: { role?: CommunityRole } = {}): Promise<ProfileCommunityMember[]> {
  let q = supabase.from('profile_community_members').select(COMMUNITY_MEMBER_COLS).eq('community_id', communityId);
  if (options.role) q = q.eq('role', options.role);
  const { data, error } = await q.order('joined_at', { ascending: true });
  if (error) throw error;
  return (data as CommunityMemberRow[]).map(mapCommunityMember);
}

export async function getMyCommunitiesForProfile(profileId: string): Promise<ProfileCommunityMember[]> {
  const { data, error } = await supabase.from('profile_community_members').select(COMMUNITY_MEMBER_COLS).eq('profile_id', profileId);
  if (error) throw error;
  return (data as CommunityMemberRow[]).map(mapCommunityMember);
}

// ── Document functions ────────────────────────────────────────────────────

export async function getProfileDocuments(profileId: string, options: { documentType?: DocumentType; verificationStatus?: DocumentVerificationStatus } = {}): Promise<ProfileDocument[]> {
  let q = supabase.from('profile_documents').select(DOCUMENT_COLS).eq('profile_id', profileId);
  if (options.documentType) q = q.eq('document_type', options.documentType);
  if (options.verificationStatus) q = q.eq('verification_status', options.verificationStatus);
  const { data, error } = await q.order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data as DocumentRow[]).map(mapDocument);
}

// ── Verification functions ────────────────────────────────────────────────

export async function getProfileVerifications(profileId: string): Promise<ProfileVerification[]> {
  const { data, error } = await supabase.from('profile_verifications').select(VERIFICATION_COLS).eq('profile_id', profileId);
  if (error) throw error;
  return (data as VerificationRow[]).map(mapVerification);
}

export async function getVerificationStatus(profileId: string, method: VerificationMethod): Promise<ProfileVerification | null> {
  const { data, error } = await supabase.from('profile_verifications').select(VERIFICATION_COLS).eq('profile_id', profileId).eq('verification_method', method).maybeSingle();
  if (error) throw error;
  return data ? mapVerification(data as VerificationRow) : null;
}

// ── Privacy & Security functions ──────────────────────────────────────────

export async function getPrivacySettings(profileId: string): Promise<ProfilePrivacySettings | null> {
  const { data, error } = await supabase.from('profile_privacy_settings').select(PRIVACY_COLS).eq('profile_id', profileId).single();
  if (error) throw error;
  return data ? mapPrivacy(data as PrivacyRow) : null;
}

export async function getSecuritySettings(profileId: string): Promise<ProfileSecurity | null> {
  const { data, error } = await supabase.from('profile_security').select(SECURITY_COLS).eq('profile_id', profileId).single();
  if (error) throw error;
  return data ? mapSecurity(data as SecurityRow) : null;
}

// ── Analytics functions ───────────────────────────────────────────────────

export async function getProfileAnalytics(profileId: string, options: { from?: string; to?: string; limit?: number } = {}): Promise<ProfileAnalytics[]> {
  let q = supabase.from('profile_analytics').select(ANALYTICS_COLS).eq('profile_id', profileId);
  if (options.from) q = q.gte('recorded_date', options.from);
  if (options.to) q = q.lte('recorded_date', options.to);
  const { data, error } = await q.order('recorded_date', { ascending: false }).limit(options.limit ?? 90);
  if (error) throw error;
  return (data as AnalyticsRow[]).map(mapAnalytics);
}

export async function getLatestAnalytics(profileId: string): Promise<ProfileAnalytics | null> {
  const { data, error } = await supabase.from('profile_analytics').select(ANALYTICS_COLS).eq('profile_id', profileId).order('recorded_date', { ascending: false }).limit(1).single();
  if (error) throw error;
  return data ? mapAnalytics(data as AnalyticsRow) : null;
}

// ── AI Insights functions ─────────────────────────────────────────────────

export async function getProfileAiInsights(profileId: string): Promise<ProfileAiInsights | null> {
  const { data, error } = await supabase.from('profile_ai_insights').select(AI_INSIGHTS_COLS).eq('profile_id', profileId).single();
  if (error) throw error;
  return data ? mapAiInsights(data as AiInsightsRow) : null;
}
