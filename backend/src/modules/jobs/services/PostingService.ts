import { JobRepository }                                          from '../repositories/JobRepository.js';
import { AppError }                                              from '../../../core/errors/AppError.js';
import { JobStatus, type JobPosting, type JobSearchQuery }       from '../types/job.types.js';

async function requirePosting(id: string, employerId: string): Promise<JobPosting> {
  const posting = await JobRepository.findById(id);
  if (!posting) throw new AppError('Job posting not found', 404, 'NOT_FOUND');
  if (posting.employerId !== employerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  return posting;
}

export const PostingService = {
  async create(
    employerId: string,
    data: Omit<JobPosting, 'id' | 'employerId' | 'viewsCount' | 'applicationsCount' | 'hiredCount' | 'createdAt' | 'updatedAt'>,
  ): Promise<JobPosting> {
    return JobRepository.create(employerId, data);
  },

  async getById(id: string): Promise<JobPosting> {
    const posting = await JobRepository.findById(id);
    if (!posting) throw new AppError('Job posting not found', 404, 'NOT_FOUND');
    return posting;
  },

  async update(id: string, employerId: string, data: Partial<JobPosting>): Promise<JobPosting> {
    const posting = await requirePosting(id, employerId);
    if (![JobStatus.Draft, JobStatus.Review].includes(posting.status)) {
      throw new AppError('Cannot update a published or archived posting', 400, 'INVALID_STATUS');
    }
    return JobRepository.update(id, data);
  },

  async publish(id: string, employerId: string): Promise<JobPosting> {
    await requirePosting(id, employerId);
    return JobRepository.update(id, {
      status:      JobStatus.Published,
      publishedAt: new Date().toISOString(),
    });
  },

  async close(id: string, employerId: string): Promise<JobPosting> {
    await requirePosting(id, employerId);
    return JobRepository.update(id, { status: JobStatus.Archived });
  },

  async listByEmployer(employerId: string, status?: JobStatus): Promise<JobPosting[]> {
    return JobRepository.listByEmployer(employerId, status);
  },

  async search(query: JobSearchQuery): Promise<JobPosting[]> {
    return JobRepository.search(query);
  },

  async trackView(id: string): Promise<void> {
    return JobRepository.incrementViews(id);
  },
};
