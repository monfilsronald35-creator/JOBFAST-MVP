import type { UUID } from '@shared-types';
import type { IJobRepository } from '../repositories/IJobRepository.js';
import type { Job } from '../entities/Job.js';
import type { CreateJobDTOType, UpdateJobDTOType, JobFilterDTOType } from '../dto/index.js';
import type { PaginatedResult } from '../../_base/IRepository.js';
import { NotFoundError, ForbiddenError } from '../../../core/errors/AppError.js';
import { TypedEventBus } from '../../../core/events/TypedEventBus.js';
import {
  JobCreatedEvent, JobAssignedEvent, JobStartedEvent,
  JobCompletedEvent, JobCancelledEvent, JobDisputedEvent,
} from '../events/JobEvents.js';
import { Cache, CacheKeys } from '../../../core/cache/Cache.js';

export class JobService {
  constructor(private readonly _repo: IJobRepository) {}

  async getById(id: UUID): Promise<Job> {
    return Cache.getOrSet(CacheKeys.job(id), async () => {
      const job = await this._repo.findById(id);
      if (!job) throw new NotFoundError('Travay', id);
      return job;
    }, 60);
  }

  async listJobs(filter: JobFilterDTOType): Promise<PaginatedResult<Job>> {
    return this._repo.findAll(filter);
  }

  async createJob(clientId: UUID, dto: CreateJobDTOType): Promise<Job> {
    const job = await this._repo.create(clientId, dto);
    TypedEventBus.publish(new JobCreatedEvent(job.id, clientId, job.title, job.category, job.budget, job.currency));
    return job;
  }

  async updateJob(requesterId: UUID, jobId: UUID, dto: UpdateJobDTOType): Promise<Job> {
    const existing = await this.getById(jobId);
    if (existing.clientId !== requesterId) throw new ForbiddenError('Sèlman kliyan an ka modifye travay sa a');
    if (!['open', 'draft'].includes(existing.status)) {
      throw new ForbiddenError('Travay la pa ka modifye nan eta sa a');
    }

    const job = await this._repo.update(jobId, dto);
    Cache.del(CacheKeys.job(jobId));
    return job;
  }

  async assignJob(assignerId: UUID, jobId: UUID, workerId: UUID): Promise<void> {
    const job = await this.getById(jobId);
    if (job.clientId !== assignerId) throw new ForbiddenError('Sèlman kliyan an ka asiye travay la');

    await this._repo.assign(jobId, workerId);
    Cache.del(CacheKeys.job(jobId));

    TypedEventBus.publish(new JobAssignedEvent(jobId, job.clientId, workerId));
  }

  async startJob(workerId: UUID, jobId: UUID): Promise<void> {
    const job = await this.getById(jobId);
    if (job.workerId !== workerId) throw new ForbiddenError('Sèlman travayè a ka kòmanse travay la');

    await this._repo.setStatus(jobId, 'in_progress', { started_at: new Date().toISOString() });
    Cache.del(CacheKeys.job(jobId));

    TypedEventBus.publish(new JobStartedEvent(jobId, workerId));
  }

  async completeJob(clientId: UUID, jobId: UUID): Promise<void> {
    const job = await this.getById(jobId);
    if (job.clientId !== clientId) throw new ForbiddenError('Sèlman kliyan an ka konfime travay la fini');

    await this._repo.setStatus(jobId, 'completed', { completed_at: new Date().toISOString() });
    Cache.del(CacheKeys.job(jobId));

    TypedEventBus.publish(new JobCompletedEvent(jobId, clientId, job.workerId!, job.budget, job.currency));
  }

  async cancelJob(requesterId: UUID, jobId: UUID, reason?: string): Promise<void> {
    const job = await this.getById(jobId);
    if (job.clientId !== requesterId) throw new ForbiddenError('Sèlman kliyan an ka kanpe travay la');

    await this._repo.setStatus(jobId, 'cancelled', { cancelled_at: new Date().toISOString() });
    Cache.del(CacheKeys.job(jobId));

    TypedEventBus.publish(new JobCancelledEvent(jobId, clientId, reason));
  }

  async disputeJob(reporterId: UUID, jobId: UUID): Promise<void> {
    await this._repo.setStatus(jobId, 'disputed');
    Cache.del(CacheKeys.job(jobId));
    TypedEventBus.publish(new JobDisputedEvent(jobId, reporterId));
  }

  async deleteJob(clientId: UUID, jobId: UUID): Promise<void> {
    const job = await this.getById(jobId);
    if (job.clientId !== clientId) throw new ForbiddenError('Aksès refize');
    if (job.status !== 'draft') throw new ForbiddenError('Sèlman travay brouyon ka efase');

    await this._repo.delete(jobId);
    Cache.del(CacheKeys.job(jobId));
  }
}
