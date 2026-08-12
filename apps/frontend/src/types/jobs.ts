export const JOB_STATUSES = [
  'draft',
  'published',
  'paused',
  'closed',
  'archived',
  'expired',
  'cancelled',
] as const;

export type JobStatus = typeof JOB_STATUSES[number];

export const APPLICATION_STATUSES = [
  'applied',
  'under_review',
  'ai_shortlisted',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export const INTERVIEW_TYPES = [
  'video',
  'phone',
  'physical',
  'ai_interview',
] as const;

export type InterviewType = typeof INTERVIEW_TYPES[number];

export const INTERVIEW_STATUSES = [
  'scheduled',
  'completed',
  'cancelled',
  'missed',
  'rescheduled',
] as const;

export type InterviewStatus = typeof INTERVIEW_STATUSES[number];

export const CONTRACT_TYPES = [
  'freelance',
  'full_time',
  'part_time',
  'temporary',
  'seasonal',
] as const;

export type ContractType = typeof CONTRACT_TYPES[number];

export const CONTRACT_STATUSES = [
  'draft',
  'pending_signature',
  'active',
  'terminated',
  'completed',
] as const;

export type ContractStatus = typeof CONTRACT_STATUSES[number];

export const REPORT_REASONS = [
  'spam',
  'fake_job',
  'scam',
  'duplicate',
  'offensive',
  'discrimination',
] as const;

export type ReportReason = typeof REPORT_REASONS[number];

export const REPORT_STATUSES = [
  'pending',
  'reviewed',
  'resolved',
  'dismissed',
] as const;

export type ReportStatus = typeof REPORT_STATUSES[number];

export const SALARY_TYPES = [
  'hourly',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'yearly',
  'project',
  'commission',
] as const;

export type SalaryType = typeof SALARY_TYPES[number];

export const REMOTE_MODES = ['onsite', 'remote', 'hybrid'] as const;

export type RemoteMode = typeof REMOTE_MODES[number];

export const JOB_VISIBILITIES = [
  'public',
  'private',
  'internal',
  'invite_only',
] as const;

export type JobVisibility = typeof JOB_VISIBILITIES[number];

// ---- Entity interfaces ----

export interface Skill {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  companyId: string;
  employerId: string;
  recruiterId: string | null;
  countryId: string;
  cityId: string | null;
  languageId: string | null;
  currencyId: string | null;
  categoryId: string | null;
  industryId: string | null;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  salary: number | null;
  salaryMax: number | null;
  salaryType: SalaryType;
  employmentType: ContractType;
  remoteMode: RemoteMode;
  experienceRequired: number;
  educationRequired: string | null;
  aiEmbedding: number[] | null;
  searchVector: string | null;
  location: string | null;
  expiration: string | null;
  visibility: JobVisibility;
  verificationStatus: boolean;
  boostScore: number;
  status: JobStatus;
  viewsCount: number;
  applicationsCount: number;
  hiresCount: number;
  savesCount: number;
  sharesCount: number;
  statistics: Record<string, unknown>;
  metadata: Record<string, unknown>;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobSkill {
  id: string;
  jobId: string;
  skillId: string;
  required: boolean;
  importance: number;
  minimumLevel: number;
  weight: number;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  proficiencyLevel: number;
  verified: boolean;
  createdAt: string;
}

export interface JobLocation {
  id: string;
  jobId: string;
  country: string | null;
  state: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  zipcode: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinates: string | null;
  timezone: string | null;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  aiScore: number;
  recruiterScore: number;
  notes: string | null;
  attachments: unknown[];
  isDeleted: boolean;
  deletedAt: string | null;
  deletedReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobSaved {
  id: string;
  userId: string;
  jobId: string;
  savedAt: string;
}

export interface JobMatch {
  id: string;
  userId: string;
  jobId: string;
  overallScore: number;
  skillsScore: number;
  distanceScore: number;
  salaryScore: number;
  languageScore: number;
  experienceScore: number;
  availabilityScore: number;
  cultureScore: number;
  embeddingSimilarity: number;
  reason: string | null;
  version: number;
  createdAt: string;
}

export interface JobInterview {
  id: string;
  applicationId: string;
  interviewType: InterviewType;
  meetingLink: string | null;
  calendarProvider: string | null;
  timezone: string | null;
  duration: number;
  scheduledAt: string;
  status: InterviewStatus;
  feedback: string | null;
  recordingUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobContract {
  id: string;
  applicationId: string;
  contractType: ContractType;
  salary: number;
  currencyId: string | null;
  paymentSchedule: string | null;
  startDate: string;
  endDate: string | null;
  signature: Record<string, unknown>;
  pdfUrl: string | null;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JobSchedule {
  id: string;
  jobId: string;
  scheduleType: string;
  details: Record<string, unknown>;
  holidaysPolicy: string | null;
  createdAt: string;
}

export interface JobReport {
  id: string;
  jobId: string;
  userId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
}

export interface JobOffer {
  id: string;
  applicationId: string;
  salary: number;
  currencyId: string | null;
  benefits: string | null;
  expiresAt: string | null;
  status: string;
  createdAt: string;
}

export interface JobDocument {
  id: string;
  userId: string;
  documentType: string;
  fileUrl: string;
  metadata: Record<string, unknown>;
  isVerified: boolean;
  createdAt: string;
}

export interface JobQuestion {
  id: string;
  jobId: string;
  question: string;
  questionType: string;
  options: unknown[];
  isRequired: boolean;
  createdAt: string;
}

export interface JobAnswer {
  id: string;
  applicationId: string;
  questionId: string;
  answerText: string;
  createdAt: string;
}

export interface JobView {
  id: string;
  jobId: string;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  viewedAt: string;
}

export interface JobNotification {
  id: string;
  userId: string;
  jobId: string | null;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface JobAiLog {
  id: string;
  jobId: string | null;
  userId: string | null;
  actionType: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown>;
  createdAt: string;
}

export interface JobHistory {
  id: string;
  jobId: string;
  actorId: string;
  action: string;
  oldState: Record<string, unknown>;
  newState: Record<string, unknown>;
  createdAt: string;
}

// ---- Input types ----

export type CreateJobInput = {
  companyId: string;
  countryId: string;
  title: string;
  slug: string;
  description: string;
  cityId?: string;
  languageId?: string;
  currencyId?: string;
  categoryId?: string;
  industryId?: string;
  requirements?: string;
  benefits?: string;
  salary?: number;
  salaryMax?: number;
  salaryType?: SalaryType;
  employmentType?: ContractType;
  remoteMode?: RemoteMode;
  experienceRequired?: number;
  educationRequired?: string;
  location?: string;
  expiration?: string;
  visibility?: JobVisibility;
  status?: JobStatus;
  metadata?: Record<string, unknown>;
};

export type UpdateJobInput = Partial<
  Omit<CreateJobInput, 'companyId' | 'countryId' | 'slug'>
>;
