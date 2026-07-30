import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import type { JobPosting, JobMatchScore, JobSearchQuery } from '../types/job.types.js';
import { JobStatus } from '../types/job.types.js';

function toJob(r: Record<string, unknown>): JobPosting {
  const base: JobPosting = {
    id:               r['id'] as string,
    employerId:       r['employer_id'] as string,
    title:            r['title'] as string,
    description:      r['description'] as string,
    skills:           (r['skills'] as string[]) ?? [],
    languages:        (r['languages'] as string[]) ?? [],
    currency:         r['currency'] as string,
    benefits:         (r['benefits'] as string[]) ?? [],
    industry:         r['industry'] as string,
    jobType:          r['job_type'] as JobPosting['jobType'],
    workMode:         r['work_mode'] as JobPosting['workMode'],
    positions:        r['positions'] as number,
    status:           r['status'] as JobStatus,
    isUrgent:         r['is_urgent'] as boolean,
    isVerified:       r['is_verified'] as boolean,
    isSponsored:      r['is_sponsored'] as boolean,
    isInternational:  r['is_international'] as boolean,
    isRemoteOk:       r['is_remote_ok'] as boolean,
    viewsCount:       r['views_count'] as number,
    applicationsCount:r['applications_count'] as number,
    hiredCount:       r['hired_count'] as number,
    createdAt:        r['created_at'] as string,
    updatedAt:        r['updated_at'] as string,
  };
  const b = base as Record<string, unknown>;
  if (r['responsibilities']) b['responsibilities']  = r['responsibilities'];
  if (r['requirements'])     b['requirements']      = r['requirements'];
  if (r['experience_years']) b['experienceYears']   = r['experience_years'];
  if (r['education_level'])  b['educationLevel']    = r['education_level'];
  if (r['salary_min'])       b['salaryMin']         = r['salary_min'];
  if (r['salary_max'])       b['salaryMax']         = r['salary_max'];
  if (r['salary_period'])    b['salaryPeriod']      = r['salary_period'];
  if (r['category'])         b['category']          = r['category'];
  if (r['country'])          b['country']           = r['country'];
  if (r['city'])             b['city']              = r['city'];
  if (r['address'])          b['address']           = r['address'];
  if (r['lat'])              b['lat']               = r['lat'];
  if (r['lng'])              b['lng']               = r['lng'];
  if (r['deadline'])         b['deadline']          = r['deadline'];
  if (r['published_at'])     b['publishedAt']       = r['published_at'];
  if (r['expires_at'])       b['expiresAt']         = r['expires_at'];
  return base;
}

export const JobRepository = {
  async create(employerId: string, data: Omit<JobPosting, 'id' | 'employerId' | 'viewsCount' | 'applicationsCount' | 'hiredCount' | 'createdAt' | 'updatedAt'>): Promise<JobPosting> {
    const row: Record<string, unknown> = {
      employer_id:  employerId,
      title:        data.title,
      description:  data.description,
      skills:       data.skills,
      languages:    data.languages,
      currency:     data.currency,
      benefits:     data.benefits,
      industry:     data.industry,
      job_type:     data.jobType,
      work_mode:    data.workMode,
      positions:    data.positions,
      status:       data.status,
      is_urgent:    data.isUrgent,
      is_verified:  data.isVerified,
      is_sponsored: data.isSponsored,
      is_international: data.isInternational,
      is_remote_ok: data.isRemoteOk,
    };
    if (data.responsibilities !== undefined) row['responsibilities']  = data.responsibilities;
    if (data.requirements     !== undefined) row['requirements']      = data.requirements;
    if (data.experienceYears  !== undefined) row['experience_years']  = data.experienceYears;
    if (data.educationLevel   !== undefined) row['education_level']   = data.educationLevel;
    if (data.salaryMin        !== undefined) row['salary_min']        = data.salaryMin;
    if (data.salaryMax        !== undefined) row['salary_max']        = data.salaryMax;
    if (data.salaryPeriod     !== undefined) row['salary_period']     = data.salaryPeriod;
    if (data.category         !== undefined) row['category']          = data.category;
    if (data.country          !== undefined) row['country']           = data.country;
    if (data.city             !== undefined) row['city']              = data.city;
    if (data.address          !== undefined) row['address']           = data.address;
    if (data.lat              !== undefined) row['lat']               = data.lat;
    if (data.lng              !== undefined) row['lng']               = data.lng;
    if (data.deadline         !== undefined) row['deadline']          = data.deadline;
    if (data.publishedAt      !== undefined) row['published_at']      = data.publishedAt;
    if (data.expiresAt        !== undefined) row['expires_at']        = data.expiresAt;

    const { data: saved, error } = await db.client()
      .from('job_postings').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create job', 500, 'DB_ERROR');
    return toJob(saved);
  },

  async findById(id: string): Promise<JobPosting | null> {
    const { data, error } = await db.client()
      .from('job_postings').select('*').eq('id', id).single<Record<string, unknown>>();
    if (error?.code === 'PGRST116') return null;
    if (error) throw new AppError('Failed to load job', 500, 'DB_ERROR');
    return data ? toJob(data) : null;
  },

  async update(id: string, data: Partial<JobPosting>): Promise<JobPosting> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title           !== undefined) row['title']           = data.title;
    if (data.description     !== undefined) row['description']     = data.description;
    if (data.responsibilities!== undefined) row['responsibilities']= data.responsibilities;
    if (data.requirements    !== undefined) row['requirements']    = data.requirements;
    if (data.skills          !== undefined) row['skills']          = data.skills;
    if (data.experienceYears !== undefined) row['experience_years']= data.experienceYears;
    if (data.educationLevel  !== undefined) row['education_level'] = data.educationLevel;
    if (data.languages       !== undefined) row['languages']       = data.languages;
    if (data.salaryMin       !== undefined) row['salary_min']      = data.salaryMin;
    if (data.salaryMax       !== undefined) row['salary_max']      = data.salaryMax;
    if (data.salaryPeriod    !== undefined) row['salary_period']   = data.salaryPeriod;
    if (data.currency        !== undefined) row['currency']        = data.currency;
    if (data.benefits        !== undefined) row['benefits']        = data.benefits;
    if (data.category        !== undefined) row['category']        = data.category;
    if (data.industry        !== undefined) row['industry']        = data.industry;
    if (data.jobType         !== undefined) row['job_type']        = data.jobType;
    if (data.workMode        !== undefined) row['work_mode']       = data.workMode;
    if (data.country         !== undefined) row['country']         = data.country;
    if (data.city            !== undefined) row['city']            = data.city;
    if (data.address         !== undefined) row['address']         = data.address;
    if (data.lat             !== undefined) row['lat']             = data.lat;
    if (data.lng             !== undefined) row['lng']             = data.lng;
    if (data.positions       !== undefined) row['positions']       = data.positions;
    if (data.deadline        !== undefined) row['deadline']        = data.deadline;
    if (data.status          !== undefined) row['status']          = data.status;
    if (data.isUrgent        !== undefined) row['is_urgent']       = data.isUrgent;
    if (data.isSponsored     !== undefined) row['is_sponsored']    = data.isSponsored;
    if (data.publishedAt     !== undefined) row['published_at']    = data.publishedAt;
    if (data.expiresAt       !== undefined) row['expires_at']      = data.expiresAt;

    const { data: saved, error } = await db.client()
      .from('job_postings').update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to update job', 500, 'DB_ERROR');
    return toJob(saved);
  },

  async listByEmployer(employerId: string, status?: JobStatus): Promise<JobPosting[]> {
    let q = db.client().from('job_postings').select('*').eq('employer_id', employerId).order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q.returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list jobs', 500, 'DB_ERROR');
    return (data ?? []).map(toJob);
  },

  async search(query: JobSearchQuery): Promise<JobPosting[]> {
    let q = db.client().from('job_postings').select('*').eq('status', 'published');
    if (query.industry)    q = q.eq('industry', query.industry);
    if (query.jobType)     q = q.eq('job_type', query.jobType);
    if (query.workMode)    q = q.eq('work_mode', query.workMode);
    if (query.country)     q = q.eq('country', query.country);
    if (query.city)        q = q.eq('city', query.city);
    if (query.isUrgent)    q = q.eq('is_urgent', true);
    if (query.isRemoteOk)  q = q.eq('is_remote_ok', true);
    if (query.isVerified)  q = q.eq('is_verified', true);
    if (query.isSponsored) q = q.eq('is_sponsored', true);
    if (query.isInternational) q = q.eq('is_international', true);
    if (query.salaryMin)   q = q.gte('salary_min', query.salaryMin);
    if (query.salaryMax)   q = q.lte('salary_max', query.salaryMax);
    if (query.skills?.length) q = q.overlaps('skills', query.skills);
    q = q.order('is_sponsored', { ascending: false })
         .order('published_at', { ascending: false })
         .limit(query.limit ?? 20);
    const { data, error } = await q.returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Search failed', 500, 'DB_ERROR');
    return (data ?? []).map(toJob);
  },

  async incrementViews(id: string): Promise<void> {
    await db.client().rpc('increment_job_views', { job_id: id }).throwOnError();
  },

  // ——— AI Match Scores ——————————————————————————————————————————————————
  async saveMatchScore(score: Omit<JobMatchScore, 'id'>): Promise<JobMatchScore> {
    const { data, error } = await db.client().from('job_ai_scores').upsert({
      job_id:       score.jobId,
      worker_id:    score.workerId,
      match_score:  score.matchScore,
      skills_score: score.skillsScore,
      exp_score:    score.expScore,
      dist_score:   score.distScore,
      salary_score: score.salaryScore,
      lang_score:   score.langScore,
      avail_score:  score.availScore,
      rep_score:    score.repScore,
      breakdown:    score.breakdown,
      computed_at:  score.computedAt,
    }, { onConflict: 'job_id,worker_id' }).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to save match score', 500, 'DB_ERROR');
    return {
      id:          data['id'] as string,
      jobId:       data['job_id'] as string,
      workerId:    data['worker_id'] as string,
      matchScore:  Number(data['match_score']),
      skillsScore: Number(data['skills_score']),
      expScore:    Number(data['exp_score']),
      distScore:   Number(data['dist_score']),
      salaryScore: Number(data['salary_score']),
      langScore:   Number(data['lang_score']),
      availScore:  Number(data['avail_score']),
      repScore:    Number(data['rep_score']),
      breakdown:   (data['breakdown'] as Record<string, unknown>) ?? {},
      computedAt:  data['computed_at'] as string,
    };
  },

  async getMatchScore(jobId: string, workerId: string): Promise<JobMatchScore | null> {
    const { data } = await db.client().from('job_ai_scores')
      .select('*').eq('job_id', jobId).eq('worker_id', workerId)
      .single<Record<string, unknown>>();
    if (!data) return null;
    return {
      id:          data['id'] as string,
      jobId:       data['job_id'] as string,
      workerId:    data['worker_id'] as string,
      matchScore:  Number(data['match_score']),
      skillsScore: Number(data['skills_score']),
      expScore:    Number(data['exp_score']),
      distScore:   Number(data['dist_score']),
      salaryScore: Number(data['salary_score']),
      langScore:   Number(data['lang_score']),
      availScore:  Number(data['avail_score']),
      repScore:    Number(data['rep_score']),
      breakdown:   (data['breakdown'] as Record<string, unknown>) ?? {},
      computedAt:  data['computed_at'] as string,
    };
  },

  async getTopMatchesForWorker(workerId: string, limit = 10): Promise<JobMatchScore[]> {
    const { data, error } = await db.client().from('job_ai_scores')
      .select('*').eq('worker_id', workerId)
      .order('match_score', { ascending: false }).limit(limit)
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to get matches', 500, 'DB_ERROR');
    return (data ?? []).map(r => ({
      id:          r['id'] as string,
      jobId:       r['job_id'] as string,
      workerId:    r['worker_id'] as string,
      matchScore:  Number(r['match_score']),
      skillsScore: Number(r['skills_score']),
      expScore:    Number(r['exp_score']),
      distScore:   Number(r['dist_score']),
      salaryScore: Number(r['salary_score']),
      langScore:   Number(r['lang_score']),
      availScore:  Number(r['avail_score']),
      repScore:    Number(r['rep_score']),
      breakdown:   (r['breakdown'] as Record<string, unknown>) ?? {},
      computedAt:  r['computed_at'] as string,
    }));
  },
};
