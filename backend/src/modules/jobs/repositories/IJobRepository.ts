import type { UUID } from '@shared-types';
import type { Job } from '../entities/Job.js';
import type { CreateJobDTOType, UpdateJobDTOType, JobFilterDTOType } from '../dto/index.js';
import type { PaginatedResult } from '../../_base/IRepository.js';

export interface IJobRepository {
  findById(id: UUID): Promise<Job | null>;
  findAll(filter: JobFilterDTOType): Promise<PaginatedResult<Job>>;
  create(clientId: UUID, dto: CreateJobDTOType): Promise<Job>;
  update(id: UUID, dto: UpdateJobDTOType): Promise<Job>;
  delete(id: UUID): Promise<void>;
  setStatus(id: UUID, status: Job['status'], extraFields?: Record<string, unknown>): Promise<void>;
  assign(id: UUID, workerId: UUID): Promise<void>;
  exists(id: UUID): Promise<boolean>;
}
