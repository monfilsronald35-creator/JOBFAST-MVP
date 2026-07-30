import { Router } from 'express';
import { PostingController }     from '../controllers/PostingController.js';
import { ApplicationController } from '../controllers/ApplicationController.js';
import { ContractController }    from '../controllers/ContractController.js';
import { requireAuth, requireRole } from '../../../core/middleware/auth.middleware.js';

export function createEmploymentRouter(): Router {
  const r = Router();

  // ——— Public discovery ——————————————————————————————————————————————————
  r.get('/postings/search',              PostingController.search);
  r.get('/postings/:id',                 PostingController.getById);

  // ——— Employer: job posting management ————————————————————————————————
  r.post  ('/postings',          requireAuth, PostingController.create);
  r.patch ('/postings/:id',      requireAuth, PostingController.update);
  r.post  ('/postings/:id/publish', requireAuth, PostingController.publish);
  r.post  ('/postings/:id/close',   requireAuth, PostingController.close);
  r.get   ('/postings/my',       requireAuth, PostingController.myPostings);
  r.get   ('/postings/:id/candidates', requireAuth, PostingController.getTopCandidates);

  // ——— Worker: recommended jobs ————————————————————————————————————————
  r.get('/postings/recommended', requireAuth, PostingController.getRecommended);
  r.get('/postings/:id/my-score', requireAuth, PostingController.getMatchScore);

  // ——— Applications —————————————————————————————————————————————————————
  r.post('/postings/:id/apply',          requireAuth, ApplicationController.apply);
  r.get ('/postings/:id/applications',   requireAuth, ApplicationController.listForJob);
  r.get ('/applications',                requireAuth, ApplicationController.myApplications);
  r.get ('/applications/:appId',         requireAuth, ApplicationController.getById);
  r.patch('/applications/:appId/advance',requireAuth, ApplicationController.advance);
  r.post ('/applications/:appId/withdraw',requireAuth, ApplicationController.withdraw);
  r.post ('/applications/:appId/interview',requireAuth, ApplicationController.scheduleInterview);
  r.get  ('/applications/:appId/pipeline',requireAuth, ApplicationController.getPipeline);

  // ——— Contracts ————————————————————————————————————————————————————————
  r.get  ('/contracts',          requireAuth, ContractController.myContracts);
  r.post ('/contracts',          requireAuth, ContractController.create);
  r.get  ('/contracts/:id',      requireAuth, ContractController.getById);
  r.post ('/contracts/:id/sign', requireAuth, ContractController.sign);
  r.post ('/contracts/:id/terminate', requireAuth, ContractController.terminate);

  // ——— Schedules ————————————————————————————————————————————————————————
  r.get ('/contracts/:id/shifts',      requireAuth, ContractController.listShifts);
  r.post('/contracts/:id/shifts',      requireAuth, ContractController.addShift);
  r.post('/contracts/:id/clock-in',    requireAuth, ContractController.clockIn);
  r.post('/attendance/:attendanceId/clock-out', requireAuth, ContractController.clockOut);

  // ——— Payroll ——————————————————————————————————————————————————————————
  r.get ('/payslips',            requireAuth, ContractController.myPayslips);
  r.post('/payroll',             requireAuth, ContractController.createPayroll);

  return r;
}
