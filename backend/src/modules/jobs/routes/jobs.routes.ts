import { Router } from 'express';
import { JobController } from '../controllers/JobController.js';
import { JobService } from '../services/JobService.js';
import { SupabaseJobRepository } from '../repositories/SupabaseJobRepository.js';
import { requireAuth } from '../../../core/middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../../../core/middleware/validate.middleware.js';
import { CreateJobDTO, UpdateJobDTO, JobFilterDTO, AssignJobDTO } from '../dto/index.js';

export function createJobsRouter(): Router {
  const router     = Router();
  const repo       = new SupabaseJobRepository();
  const service    = new JobService(repo);
  const controller = new JobController(service);

  router.get('/',                 validateQuery(JobFilterDTO),                             controller.list);
  router.get('/:id',                                                                       controller.getById);
  router.post('/',                requireAuth, validateBody(CreateJobDTO),                 controller.create);
  router.patch('/:id',            requireAuth, validateBody(UpdateJobDTO),                 controller.update);
  router.post('/:id/assign',      requireAuth, validateBody(AssignJobDTO),                 controller.assign);
  router.post('/:id/start',       requireAuth,                                             controller.start);
  router.post('/:id/complete',    requireAuth,                                             controller.complete);
  router.post('/:id/cancel',      requireAuth,                                             controller.cancel);
  router.post('/:id/dispute',     requireAuth,                                             controller.dispute);

  return router;
}
