import type { Express } from 'express';
import { createJobsRouter }       from './routes/jobs.routes.js';
import { createEmploymentRouter } from './routes/employment.routes.js';

export function registerJobsModule(app: Express): void {
  app.use('/api/jobs', createJobsRouter());
  app.use('/api/employment', createEmploymentRouter());
}

export { JobService }             from './services/JobService.js';
export { SupabaseJobRepository }  from './repositories/SupabaseJobRepository.js';
export { Job }                    from './entities/Job.js';
export {
  JobCreatedEvent, JobAssignedEvent, JobStartedEvent,
  JobCompletedEvent, JobCancelledEvent, JobDisputedEvent,
} from './events/JobEvents.js';
