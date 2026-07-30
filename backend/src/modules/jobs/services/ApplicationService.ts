import { ApplicationRepository } from '../repositories/ApplicationRepository.js';
import { JobRepository } from '../repositories/JobRepository.js';
import { AppError } from '../../../core/errors/AppError.js';
import {
  ApplicationStatus, VALID_TRANSITIONS,
  type JobApplication, type PipelineRecord,
} from '../types/application.types.js';
import { JobStatus } from '../types/job.types.js';

export const ApplicationService = {
  async apply(jobId: string, applicantId: string, data: { coverLetter?: string; resumeUrl?: string; videoUrl?: string; portfolioUrls?: string[] }): Promise<JobApplication> {
    const job = await JobRepository.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    if (job.status !== JobStatus.Published && job.status !== JobStatus.Distributed) {
      throw new AppError('Job is not accepting applications', 400, 'JOB_CLOSED');
    }
    if (job.employerId === applicantId) throw new AppError('Cannot apply to your own job', 400, 'SELF_APPLY');

    const application = await ApplicationRepository.apply(jobId, applicantId, {
      portfolioUrls: data.portfolioUrls ?? [],
      ...(data.coverLetter ? { coverLetter: data.coverLetter } : {}),
      ...(data.resumeUrl   ? { resumeUrl:   data.resumeUrl   } : {}),
      ...(data.videoUrl    ? { videoUrl:    data.videoUrl    } : {}),
    });
    return application;
  },

  async getById(id: string): Promise<JobApplication> {
    const app = await ApplicationRepository.findById(id);
    if (!app) throw new AppError('Application not found', 404, 'APP_NOT_FOUND');
    return app;
  },

  async listByJob(jobId: string, status?: ApplicationStatus): Promise<JobApplication[]> {
    return ApplicationRepository.listByJob(jobId, status);
  },

  async listByApplicant(applicantId: string): Promise<JobApplication[]> {
    return ApplicationRepository.listByApplicant(applicantId);
  },

  async advance(id: string, nextStatus: ApplicationStatus, actorId: string, notes?: string): Promise<JobApplication> {
    const app = await ApplicationService.getById(id);
    const job = await JobRepository.findById(app.jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    const isEmployer = job.employerId === actorId;
    const isApplicant = app.applicantId === actorId;
    if (!isEmployer && !isApplicant) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const allowed = VALID_TRANSITIONS[app.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(`Cannot transition from ${app.status} to ${nextStatus}`, 400, 'INVALID_TRANSITION');
    }

    const updated = await ApplicationRepository.updateStatus(id, nextStatus, notes);
    await ApplicationRepository.addPipelineEntry(id, nextStatus, notes ? { notes } : {});
    return updated;
  },

  async withdraw(id: string, applicantId: string): Promise<JobApplication> {
    const app = await ApplicationService.getById(id);
    if (app.applicantId !== applicantId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    const terminal: ApplicationStatus[] = [ApplicationStatus.Hired, ApplicationStatus.Completed, ApplicationStatus.Withdrawn];
    if (terminal.includes(app.status)) throw new AppError('Cannot withdraw in this state', 400, 'INVALID_TRANSITION');
    return ApplicationRepository.updateStatus(id, ApplicationStatus.Withdrawn);
  },

  async getPipeline(applicationId: string): Promise<PipelineRecord[]> {
    return ApplicationRepository.getPipeline(applicationId);
  },

  async scheduleInterview(id: string, employerId: string, scheduledAt: string, notes?: string): Promise<JobApplication> {
    const app = await ApplicationService.getById(id);
    const job = await JobRepository.findById(app.jobId);
    if (job?.employerId !== employerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const updated = await ApplicationRepository.updateStatus(id, ApplicationStatus.InterviewScheduled);
    const opts: Parameters<typeof ApplicationRepository.addPipelineEntry>[2] = { scheduledAt };
    if (notes) opts.notes = notes;
    await ApplicationRepository.addPipelineEntry(id, ApplicationStatus.InterviewScheduled, opts);
    return updated;
  },
};
