import type { Express } from 'express';
import { createJobsRouter } from './routes/jobs.routes.js';

export function registerJobsModule(app: Express): void {
  app.use('/api/jobs', createJobsRouter());
}

export { JobService }             from './services/JobService.js';
export { SupabaseJobRepository }  from './repositories/SupabaseJobRepository.js';
export { Job }                    from './entities/Job.js';
export {
  JobCreatedEvent, JobAssignedEvent, JobStartedEvent,
  JobCompletedEvent, JobCancelledEvent, JobDisputedEvent,
} from './events/JobEvents.js';
