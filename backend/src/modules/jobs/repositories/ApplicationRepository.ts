import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import {
  ApplicationStatus, type JobApplication, type PipelineRecord,
} from '../types/application.types.js';

function toApplication(r: Record<string, unknown>): JobApplication {
  const base: JobApplication = {
    id:            r['id'] as string,
    jobId:         (r['posting_id'] ?? r['job_id']) as string,
    applicantId:   r['applicant_id'] as string,
    status:        r['status'] as ApplicationStatus,
    portfolioUrls: (r['portfolio_urls'] as string[]) ?? [],
    appliedAt:     r['applied_at'] as string,
    updatedAt:     r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['cover_letter']) b['coverLetter'] = r['cover_letter'];
  if (r['resume_url'])   b['resumeUrl']   = r['resume_url'];
  if (r['video_url'])    b['videoUrl']    = r['video_url'];
  if (r['match_score'])  b['matchScore']  = r['match_score'];
  if (r['notes'])        b['notes']       = r['notes'];
  return base;
}

function toPipeline(r: Record<string, unknown>): PipelineRecord {
  const base: PipelineRecord = {
    id:            r['id'] as string,
    applicationId: r['application_id'] as string,
    stage:         r['stage'] as PipelineRecord['stage'],
    metadata:      (r['metadata'] as Record<string, unknown>) ?? {},
    createdAt:     r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['scheduled_at']) b['scheduledAt'] = r['scheduled_at'];
  if (r['completed_at']) b['completedAt'] = r['completed_at'];
  if (r['notes'])        b['notes']       = r['notes'];
  return base;
}

export const ApplicationRepository = {
  async apply(jobId: string, applicantId: string, data: Pick<JobApplication, 'coverLetter' | 'resumeUrl' | 'videoUrl' | 'portfolioUrls'>): Promise<JobApplication> {
    const row: Record<string, unknown> = {
      posting_id:    jobId,
      applicant_id:  applicantId,
      portfolio_urls: data.portfolioUrls,
    };
    if (data.coverLetter !== undefined) row['cover_letter'] = data.coverLetter;
    if (data.resumeUrl   !== undefined) row['resume_url']   = data.resumeUrl;
    if (data.videoUrl    !== undefined) row['video_url']    = data.videoUrl;

    const { data: saved, error } = await db.client()
      .from('job_applications').insert(row).select('*').single<Record<string, unknown>>();
    if (error?.code === '23505') throw new AppError('Already applied to this job', 409, 'ALREADY_APPLIED');
    if (error ?? !saved) throw new AppError('Failed to submit application', 500, 'DB_ERROR');
    return toApplication(saved);
  },

  async findById(id: string): Promise<JobApplication | null> {
    const { data, error } = await db.client()
      .from('job_applications').select('*').eq('id', id).single<Record<string, unknown>>();
    if (error?.code === 'PGRST116') return null;
    if (error) throw new AppError('Failed to load application', 500, 'DB_ERROR');
    return data ? toApplication(data) : null;
  },

  async findByJobAndApplicant(jobId: string, applicantId: string): Promise<JobApplication | null> {
    const { data } = await db.client()
      .from('job_applications').select('*')
      .eq('job_id', jobId).eq('applicant_id', applicantId)
      .single<Record<string, unknown>>();
    return data ? toApplication(data) : null;
  },

  async listByJob(jobId: string, status?: ApplicationStatus): Promise<JobApplication[]> {
    let q = db.client().from('job_applications').select('*').eq('job_id', jobId)
      .order('match_score', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q.returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list applications', 500, 'DB_ERROR');
    return (data ?? []).map(toApplication);
  },

  async listByApplicant(applicantId: string): Promise<JobApplication[]> {
    const { data, error } = await db.client()
      .from('job_applications').select('*').eq('applicant_id', applicantId)
      .order('applied_at', { ascending: false }).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list applications', 500, 'DB_ERROR');
    return (data ?? []).map(toApplication);
  },

  async updateStatus(id: string, status: ApplicationStatus, notes?: string): Promise<JobApplication> {
    const row: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (notes !== undefined) row['notes'] = notes;
    const { data, error } = await db.client()
      .from('job_applications').update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update application', 500, 'DB_ERROR');
    return toApplication(data);
  },

  async setMatchScore(id: string, score: number): Promise<void> {
    await db.client().from('job_applications')
      .update({ match_score: score, updated_at: new Date().toISOString() })
      .eq('id', id).select();
  },

  // ——— Pipeline ————————————————————————————————————————————————————————————
  async addPipelineEntry(applicationId: string, stage: string, opts: { scheduledAt?: string; notes?: string; metadata?: Record<string, unknown> } = {}): Promise<PipelineRecord> {
    const row: Record<string, unknown> = {
      application_id: applicationId,
      stage,
      metadata: opts.metadata ?? {},
    };
    if (opts.scheduledAt !== undefined) row['scheduled_at'] = opts.scheduledAt;
    if (opts.notes       !== undefined) row['notes']        = opts.notes;

    const { data, error } = await db.client()
      .from('job_pipeline').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to add pipeline entry', 500, 'DB_ERROR');
    return toPipeline(data);
  },

  async getPipeline(applicationId: string): Promise<PipelineRecord[]> {
    const { data, error } = await db.client()
      .from('job_pipeline').select('*').eq('application_id', applicationId)
      .order('created_at', { ascending: true }).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to get pipeline', 500, 'DB_ERROR');
    return (data ?? []).map(toPipeline);
  },
};
