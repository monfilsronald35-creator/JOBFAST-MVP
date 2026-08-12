import { supabase } from '../../lib/supabase';
import type {
  Skill,
  Job,
  JobSkill,
  UserSkill,
  JobLocation,
  JobApplication,
  JobSaved,
  JobMatch,
  JobInterview,
  JobContract,
  JobSchedule,
  JobReport,
  JobOffer,
  JobDocument,
  JobQuestion,
  JobAnswer,
  JobNotification,
  JobHistory,
  ApplicationStatus,
  ReportReason,
  JobStatus,
  RemoteMode,
  CreateJobInput,
  UpdateJobInput,
} from '../../types/jobs';

// ai_embedding (VECTOR 1536) and search_vector (TSVECTOR) are intentionally
// excluded from all selects — they are large and only needed server-side.
const JOB_SELECT_COLS =
  'id, company_id, employer_id, recruiter_id, country_id, city_id, ' +
  'language_id, currency_id, category_id, industry_id, ' +
  'title, slug, description, requirements, benefits, ' +
  'salary, salary_max, salary_type, employment_type, remote_mode, ' +
  'experience_required, education_required, location, expiration, ' +
  'visibility, verification_status, boost_score, status, ' +
  'views_count, applications_count, hires_count, saves_count, shares_count, ' +
  'statistics, metadata, is_deleted, deleted_at, deleted_reason, version, ' +
  'created_at, updated_at';

// ---- Row types (snake_case) ----

type SkillRow = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

type JobRow = {
  id: string;
  company_id: string;
  employer_id: string;
  recruiter_id: string | null;
  country_id: string;
  city_id: string | null;
  language_id: string | null;
  currency_id: string | null;
  category_id: string | null;
  industry_id: string | null;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  salary: number | null;
  salary_max: number | null;
  salary_type: string;
  employment_type: string;
  remote_mode: string;
  experience_required: number;
  education_required: string | null;
  location: string | null;
  expiration: string | null;
  visibility: string;
  verification_status: boolean;
  boost_score: number;
  status: string;
  views_count: number;
  applications_count: number;
  hires_count: number;
  saves_count: number;
  shares_count: number;
  statistics: Record<string, unknown>;
  metadata: Record<string, unknown>;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

type JobSkillRow = {
  id: string;
  job_id: string;
  skill_id: string;
  required: boolean;
  importance: number;
  minimum_level: number;
  weight: number;
};

type UserSkillRow = {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level: number;
  verified: boolean;
  created_at: string;
};

type JobLocationRow = {
  id: string;
  job_id: string;
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
  created_at: string;
};

type JobApplicationRow = {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  ai_score: number;
  recruiter_score: number;
  notes: string | null;
  attachments: unknown[];
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_reason: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

type JobSavedRow = {
  id: string;
  user_id: string;
  job_id: string;
  saved_at: string;
};

type JobMatchRow = {
  id: string;
  user_id: string;
  job_id: string;
  overall_score: number;
  skills_score: number;
  distance_score: number;
  salary_score: number;
  language_score: number;
  experience_score: number;
  availability_score: number;
  culture_score: number;
  embedding_similarity: number;
  reason: string | null;
  version: number;
  created_at: string;
};

type JobInterviewRow = {
  id: string;
  application_id: string;
  interview_type: string;
  meeting_link: string | null;
  calendar_provider: string | null;
  timezone: string | null;
  duration: number;
  scheduled_at: string;
  status: string;
  feedback: string | null;
  recording_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type JobContractRow = {
  id: string;
  application_id: string;
  contract_type: string;
  salary: number;
  currency_id: string | null;
  payment_schedule: string | null;
  start_date: string;
  end_date: string | null;
  signature: Record<string, unknown>;
  pdf_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type JobScheduleRow = {
  id: string;
  job_id: string;
  schedule_type: string;
  details: Record<string, unknown>;
  holidays_policy: string | null;
  created_at: string;
};

type JobReportRow = {
  id: string;
  job_id: string;
  user_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
};

type JobOfferRow = {
  id: string;
  application_id: string;
  salary: number;
  currency_id: string | null;
  benefits: string | null;
  expires_at: string | null;
  status: string;
  created_at: string;
};

type JobDocumentRow = {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  metadata: Record<string, unknown>;
  is_verified: boolean;
  created_at: string;
};

type JobQuestionRow = {
  id: string;
  job_id: string;
  question: string;
  question_type: string;
  options: unknown[];
  is_required: boolean;
  created_at: string;
};

type JobAnswerRow = {
  id: string;
  application_id: string;
  question_id: string;
  answer_text: string;
  created_at: string;
};

type JobNotificationRow = {
  id: string;
  user_id: string;
  job_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type JobHistoryRow = {
  id: string;
  job_id: string;
  actor_id: string;
  action: string;
  old_state: Record<string, unknown>;
  new_state: Record<string, unknown>;
  created_at: string;
};

// ---- Mappers ----

function mapSkill(r: SkillRow): Skill {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    category: r.category,
    isActive: r.is_active,
    isDeleted: r.is_deleted,
    deletedAt: r.deleted_at,
    deletedReason: r.deleted_reason,
    version: r.version,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapJob(r: JobRow): Job {
  return {
    id: r.id,
    companyId: r.company_id,
    employerId: r.employer_id,
    recruiterId: r.recruiter_id,
    countryId: r.country_id,
    cityId: r.city_id,
    languageId: r.language_id,
    currencyId: r.currency_id,
    categoryId: r.category_id,
    industryId: r.industry_id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    requirements: r.requirements,
    benefits: r.benefits,
    salary: r.salary,
    salaryMax: r.salary_max,
    salaryType: r.salary_type as Job['salaryType'],
    employmentType: r.employment_type as Job['employmentType'],
    remoteMode: r.remote_mode as Job['remoteMode'],
    experienceRequired: r.experience_required,
    educationRequired: r.education_required,
    aiEmbedding: null,
    searchVector: null,
    location: r.location,
    expiration: r.expiration,
    visibility: r.visibility as Job['visibility'],
    verificationStatus: r.verification_status,
    boostScore: r.boost_score,
    status: r.status as Job['status'],
    viewsCount: r.views_count,
    applicationsCount: r.applications_count,
    hiresCount: r.hires_count,
    savesCount: r.saves_count,
    sharesCount: r.shares_count,
    statistics: r.statistics,
    metadata: r.metadata,
    isDeleted: r.is_deleted,
    deletedAt: r.deleted_at,
    deletedReason: r.deleted_reason,
    version: r.version,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapJobSkill(r: JobSkillRow): JobSkill {
  return {
    id: r.id,
    jobId: r.job_id,
    skillId: r.skill_id,
    required: r.required,
    importance: r.importance,
    minimumLevel: r.minimum_level,
    weight: r.weight,
  };
}

function mapUserSkill(r: UserSkillRow): UserSkill {
  return {
    id: r.id,
    userId: r.user_id,
    skillId: r.skill_id,
    proficiencyLevel: r.proficiency_level,
    verified: r.verified,
    createdAt: r.created_at,
  };
}

function mapJobLocation(r: JobLocationRow): JobLocation {
  return {
    id: r.id,
    jobId: r.job_id,
    country: r.country,
    state: r.state,
    province: r.province,
    city: r.city,
    district: r.district,
    zipcode: r.zipcode,
    latitude: r.latitude,
    longitude: r.longitude,
    coordinates: r.coordinates,
    timezone: r.timezone,
    createdAt: r.created_at,
  };
}

function mapJobApplication(r: JobApplicationRow): JobApplication {
  return {
    id: r.id,
    jobId: r.job_id,
    userId: r.user_id,
    status: r.status as ApplicationStatus,
    aiScore: r.ai_score,
    recruiterScore: r.recruiter_score,
    notes: r.notes,
    attachments: r.attachments,
    isDeleted: r.is_deleted,
    deletedAt: r.deleted_at,
    deletedReason: r.deleted_reason,
    version: r.version,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapJobSaved(r: JobSavedRow): JobSaved {
  return {
    id: r.id,
    userId: r.user_id,
    jobId: r.job_id,
    savedAt: r.saved_at,
  };
}

function mapJobMatch(r: JobMatchRow): JobMatch {
  return {
    id: r.id,
    userId: r.user_id,
    jobId: r.job_id,
    overallScore: r.overall_score,
    skillsScore: r.skills_score,
    distanceScore: r.distance_score,
    salaryScore: r.salary_score,
    languageScore: r.language_score,
    experienceScore: r.experience_score,
    availabilityScore: r.availability_score,
    cultureScore: r.culture_score,
    embeddingSimilarity: r.embedding_similarity,
    reason: r.reason,
    version: r.version,
    createdAt: r.created_at,
  };
}

function mapJobInterview(r: JobInterviewRow): JobInterview {
  return {
    id: r.id,
    applicationId: r.application_id,
    interviewType: r.interview_type as JobInterview['interviewType'],
    meetingLink: r.meeting_link,
    calendarProvider: r.calendar_provider,
    timezone: r.timezone,
    duration: r.duration,
    scheduledAt: r.scheduled_at,
    status: r.status as JobInterview['status'],
    feedback: r.feedback,
    recordingUrl: r.recording_url,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapJobContract(r: JobContractRow): JobContract {
  return {
    id: r.id,
    applicationId: r.application_id,
    contractType: r.contract_type as JobContract['contractType'],
    salary: r.salary,
    currencyId: r.currency_id,
    paymentSchedule: r.payment_schedule,
    startDate: r.start_date,
    endDate: r.end_date,
    signature: r.signature,
    pdfUrl: r.pdf_url,
    status: r.status as JobContract['status'],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapJobSchedule(r: JobScheduleRow): JobSchedule {
  return {
    id: r.id,
    jobId: r.job_id,
    scheduleType: r.schedule_type,
    details: r.details,
    holidaysPolicy: r.holidays_policy,
    createdAt: r.created_at,
  };
}

function mapJobReport(r: JobReportRow): JobReport {
  return {
    id: r.id,
    jobId: r.job_id,
    userId: r.user_id,
    reason: r.reason as ReportReason,
    description: r.description,
    status: r.status as JobReport['status'],
    createdAt: r.created_at,
  };
}

function mapJobOffer(r: JobOfferRow): JobOffer {
  return {
    id: r.id,
    applicationId: r.application_id,
    salary: r.salary,
    currencyId: r.currency_id,
    benefits: r.benefits,
    expiresAt: r.expires_at,
    status: r.status,
    createdAt: r.created_at,
  };
}

function mapJobDocument(r: JobDocumentRow): JobDocument {
  return {
    id: r.id,
    userId: r.user_id,
    documentType: r.document_type,
    fileUrl: r.file_url,
    metadata: r.metadata,
    isVerified: r.is_verified,
    createdAt: r.created_at,
  };
}

function mapJobQuestion(r: JobQuestionRow): JobQuestion {
  return {
    id: r.id,
    jobId: r.job_id,
    question: r.question,
    questionType: r.question_type,
    options: r.options,
    isRequired: r.is_required,
    createdAt: r.created_at,
  };
}

function mapJobAnswer(r: JobAnswerRow): JobAnswer {
  return {
    id: r.id,
    applicationId: r.application_id,
    questionId: r.question_id,
    answerText: r.answer_text,
    createdAt: r.created_at,
  };
}

function mapJobNotification(r: JobNotificationRow): JobNotification {
  return {
    id: r.id,
    userId: r.user_id,
    jobId: r.job_id,
    title: r.title,
    message: r.message,
    isRead: r.is_read,
    createdAt: r.created_at,
  };
}

function mapJobHistory(r: JobHistoryRow): JobHistory {
  return {
    id: r.id,
    jobId: r.job_id,
    actorId: r.actor_id,
    action: r.action,
    oldState: r.old_state,
    newState: r.new_state,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Skills
// ================================================================

export async function getSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as SkillRow[]).map(mapSkill);
}

export async function searchSkills(query: string): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false)
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(30);
  if (error) throw error;
  return (data as SkillRow[]).map(mapSkill);
}

export async function getJobSkills(jobId: string): Promise<JobSkill[]> {
  const { data, error } = await supabase
    .from('job_skills')
    .select('*')
    .eq('job_id', jobId)
    .order('importance', { ascending: false });
  if (error) throw error;
  return (data as JobSkillRow[]).map(mapJobSkill);
}

// ================================================================
// === Jobs
// ================================================================

type GetPublishedJobsOptions = {
  countryId?: string;
  categoryId?: string;
  industryId?: string;
  remoteMode?: RemoteMode;
  limit?: number;
};

export async function getPublishedJobs(
  options: GetPublishedJobsOptions = {}
): Promise<Job[]> {
  let q = supabase
    .from('jobs')
    .select(JOB_SELECT_COLS)
    .eq('status', 'published')
    .eq('is_deleted', false);

  if (options.countryId) q = q.eq('country_id', options.countryId);
  if (options.categoryId) q = q.eq('category_id', options.categoryId);
  if (options.industryId) q = q.eq('industry_id', options.industryId);
  if (options.remoteMode) q = q.eq('remote_mode', options.remoteMode);

  const { data, error } = await q
    .order('boost_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);

  if (error) throw error;
  return (data as JobRow[]).map(mapJob);
}

export async function getJobBySlug(
  countryId: string,
  slug: string
): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_SELECT_COLS)
    .eq('country_id', countryId)
    .eq('slug', slug)
    .eq('is_deleted', false)
    .maybeSingle();
  if (error) throw error;
  return data ? mapJob(data as JobRow) : null;
}

export async function searchJobs(
  query: string,
  countryId?: string
): Promise<Job[]> {
  let q = supabase
    .from('jobs')
    .select(JOB_SELECT_COLS)
    .eq('status', 'published')
    .eq('is_deleted', false)
    .textSearch('search_vector', query, { type: 'plain' });

  if (countryId) q = q.eq('country_id', countryId);

  const { data, error } = await q
    .order('boost_score', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as JobRow[]).map(mapJob);
}

export async function getMyPostedJobs(status?: JobStatus): Promise<Job[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('jobs')
    .select(JOB_SELECT_COLS)
    .eq('employer_id', user.id)
    .eq('is_deleted', false);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as JobRow[]).map(mapJob);
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const payload: Record<string, unknown> = {
    company_id: input.companyId,
    employer_id: user.id,
    country_id: input.countryId,
    title: input.title,
    slug: input.slug,
    description: input.description,
  };

  if (input.cityId !== undefined) payload['city_id'] = input.cityId;
  if (input.languageId !== undefined) payload['language_id'] = input.languageId;
  if (input.currencyId !== undefined) payload['currency_id'] = input.currencyId;
  if (input.categoryId !== undefined) payload['category_id'] = input.categoryId;
  if (input.industryId !== undefined) payload['industry_id'] = input.industryId;
  if (input.requirements !== undefined) payload['requirements'] = input.requirements;
  if (input.benefits !== undefined) payload['benefits'] = input.benefits;
  if (input.salary !== undefined) payload['salary'] = input.salary;
  if (input.salaryMax !== undefined) payload['salary_max'] = input.salaryMax;
  if (input.salaryType !== undefined) payload['salary_type'] = input.salaryType;
  if (input.employmentType !== undefined) payload['employment_type'] = input.employmentType;
  if (input.remoteMode !== undefined) payload['remote_mode'] = input.remoteMode;
  if (input.experienceRequired !== undefined) payload['experience_required'] = input.experienceRequired;
  if (input.educationRequired !== undefined) payload['education_required'] = input.educationRequired;
  if (input.location !== undefined) payload['location'] = input.location;
  if (input.expiration !== undefined) payload['expiration'] = input.expiration;
  if (input.visibility !== undefined) payload['visibility'] = input.visibility;
  if (input.status !== undefined) payload['status'] = input.status;
  if (input.metadata !== undefined) payload['metadata'] = input.metadata;

  const { data, error } = await supabase
    .from('jobs')
    .insert(payload)
    .select(JOB_SELECT_COLS)
    .single();
  if (error) throw error;
  return mapJob(data as JobRow);
}

export async function updateJob(
  jobId: string,
  input: UpdateJobInput
): Promise<Job> {
  const payload: Record<string, unknown> = {};

  if (input.cityId !== undefined) payload['city_id'] = input.cityId;
  if (input.languageId !== undefined) payload['language_id'] = input.languageId;
  if (input.currencyId !== undefined) payload['currency_id'] = input.currencyId;
  if (input.categoryId !== undefined) payload['category_id'] = input.categoryId;
  if (input.industryId !== undefined) payload['industry_id'] = input.industryId;
  if (input.title !== undefined) payload['title'] = input.title;
  if (input.description !== undefined) payload['description'] = input.description;
  if (input.requirements !== undefined) payload['requirements'] = input.requirements;
  if (input.benefits !== undefined) payload['benefits'] = input.benefits;
  if (input.salary !== undefined) payload['salary'] = input.salary;
  if (input.salaryMax !== undefined) payload['salary_max'] = input.salaryMax;
  if (input.salaryType !== undefined) payload['salary_type'] = input.salaryType;
  if (input.employmentType !== undefined) payload['employment_type'] = input.employmentType;
  if (input.remoteMode !== undefined) payload['remote_mode'] = input.remoteMode;
  if (input.experienceRequired !== undefined) payload['experience_required'] = input.experienceRequired;
  if (input.educationRequired !== undefined) payload['education_required'] = input.educationRequired;
  if (input.location !== undefined) payload['location'] = input.location;
  if (input.expiration !== undefined) payload['expiration'] = input.expiration;
  if (input.visibility !== undefined) payload['visibility'] = input.visibility;
  if (input.status !== undefined) payload['status'] = input.status;
  if (input.metadata !== undefined) payload['metadata'] = input.metadata;

  const { data, error } = await supabase
    .from('jobs')
    .update(payload)
    .eq('id', jobId)
    .select(JOB_SELECT_COLS)
    .single();
  if (error) throw error;
  return mapJob(data as JobRow);
}

export async function softDeleteJob(
  jobId: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('jobs')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      status: 'archived',
      ...(reason ? { deleted_reason: reason } : {}),
    })
    .eq('id', jobId);
  if (error) throw error;
}

// ================================================================
// === User Skills
// ================================================================

export async function getMySkills(): Promise<UserSkill[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', user.id)
    .order('proficiency_level', { ascending: false });
  if (error) throw error;
  return (data as UserSkillRow[]).map(mapUserSkill);
}

export async function addMySkill(
  skillId: string,
  proficiencyLevel = 1
): Promise<UserSkill> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('user_skills')
    .upsert({ user_id: user.id, skill_id: skillId, proficiency_level: proficiencyLevel })
    .select('*')
    .single();
  if (error) throw error;
  return mapUserSkill(data as UserSkillRow);
}

export async function removeMySkill(skillId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('user_skills')
    .delete()
    .eq('user_id', user.id)
    .eq('skill_id', skillId);
  if (error) throw error;
}

// ================================================================
// === Job Locations
// ================================================================

export async function getJobLocation(jobId: string): Promise<JobLocation | null> {
  const { data, error } = await supabase
    .from('job_locations')
    .select('id, job_id, country, state, province, city, district, zipcode, latitude, longitude, coordinates, timezone, created_at')
    .eq('job_id', jobId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapJobLocation(data as JobLocationRow) : null;
}

// ================================================================
// === Job Applications
// ================================================================

export async function applyToJob(
  jobId: string,
  notes?: string,
  attachments: unknown[] = []
): Promise<JobApplication> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const payload: Record<string, unknown> = {
    job_id: jobId,
    user_id: user.id,
    attachments,
  };
  if (notes !== undefined) payload['notes'] = notes;

  const { data, error } = await supabase
    .from('job_applications')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return mapJobApplication(data as JobApplicationRow);
}

export async function getMyApplications(
  status?: ApplicationStatus
): Promise<JobApplication[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false);

  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as JobApplicationRow[]).map(mapJobApplication);
}

export async function getJobApplications(
  jobId: string
): Promise<JobApplication[]> {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('job_id', jobId)
    .eq('is_deleted', false)
    .order('ai_score', { ascending: false });
  if (error) throw error;
  return (data as JobApplicationRow[]).map(mapJobApplication);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<JobApplication> {
  const { data, error } = await supabase
    .from('job_applications')
    .update({ status })
    .eq('id', applicationId)
    .select('*')
    .single();
  if (error) throw error;
  return mapJobApplication(data as JobApplicationRow);
}

// ================================================================
// === Saved Jobs
// ================================================================

export async function saveJob(jobId: string): Promise<JobSaved> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('job_saved')
    .upsert({ user_id: user.id, job_id: jobId })
    .select('*')
    .single();
  if (error) throw error;
  return mapJobSaved(data as JobSavedRow);
}

export async function unsaveJob(jobId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('job_saved')
    .delete()
    .eq('user_id', user.id)
    .eq('job_id', jobId);
  if (error) throw error;
}

export async function getMySavedJobs(): Promise<JobSaved[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('job_saved')
    .select('*')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return (data as JobSavedRow[]).map(mapJobSaved);
}

// ================================================================
// === Job Matches
// ================================================================

export async function getMyJobMatches(limit = 20): Promise<JobMatch[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('job_matches')
    .select('*')
    .eq('user_id', user.id)
    .order('overall_score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as JobMatchRow[]).map(mapJobMatch);
}

// ================================================================
// === Interviews
// ================================================================

export async function getInterviewsByApplication(
  applicationId: string
): Promise<JobInterview[]> {
  const { data, error } = await supabase
    .from('job_interviews')
    .select('*')
    .eq('application_id', applicationId)
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  return (data as JobInterviewRow[]).map(mapJobInterview);
}

// ================================================================
// === Contracts
// ================================================================

export async function getContractByApplication(
  applicationId: string
): Promise<JobContract | null> {
  const { data, error } = await supabase
    .from('job_contracts')
    .select('*')
    .eq('application_id', applicationId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapJobContract(data as JobContractRow) : null;
}

// ================================================================
// === Job Schedules
// ================================================================

export async function getJobSchedule(jobId: string): Promise<JobSchedule | null> {
  const { data, error } = await supabase
    .from('job_schedules')
    .select('*')
    .eq('job_id', jobId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapJobSchedule(data as JobScheduleRow) : null;
}

// ================================================================
// === Questions & Answers
// ================================================================

export async function getJobQuestions(jobId: string): Promise<JobQuestion[]> {
  const { data, error } = await supabase
    .from('job_questions')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as JobQuestionRow[]).map(mapJobQuestion);
}

export async function submitJobAnswers(
  applicationId: string,
  answers: Array<{ questionId: string; answerText: string }>
): Promise<JobAnswer[]> {
  const rows = answers.map((a) => ({
    application_id: applicationId,
    question_id: a.questionId,
    answer_text: a.answerText,
  }));

  const { data, error } = await supabase
    .from('job_answers')
    .insert(rows)
    .select('*');
  if (error) throw error;
  return (data as JobAnswerRow[]).map(mapJobAnswer);
}

// ================================================================
// === Reports
// ================================================================

export async function reportJob(
  jobId: string,
  reason: ReportReason,
  description?: string
): Promise<JobReport> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const payload: Record<string, unknown> = {
    job_id: jobId,
    user_id: user.id,
    reason,
  };
  if (description !== undefined) payload['description'] = description;

  const { data, error } = await supabase
    .from('job_reports')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return mapJobReport(data as JobReportRow);
}

// ================================================================
// === Offers
// ================================================================

export async function getOffersByApplication(
  applicationId: string
): Promise<JobOffer[]> {
  const { data, error } = await supabase
    .from('job_offers')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as JobOfferRow[]).map(mapJobOffer);
}

// ================================================================
// === Notifications
// ================================================================

export async function getMyJobNotifications(limit = 30): Promise<JobNotification[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('job_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as JobNotificationRow[]).map(mapJobNotification);
}

export async function markJobNotificationRead(
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from('job_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  if (error) throw error;
}

// ================================================================
// === Documents
// ================================================================

export async function getMyDocuments(): Promise<JobDocument[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('job_documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as JobDocumentRow[]).map(mapJobDocument);
}

// ================================================================
// === History (employer / admin)
// ================================================================

export async function getJobHistory(jobId: string): Promise<JobHistory[]> {
  const { data, error } = await supabase
    .from('job_history')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as JobHistoryRow[]).map(mapJobHistory);
}
