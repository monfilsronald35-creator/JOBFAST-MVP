import type { Request, Response, NextFunction } from 'express';
import { ApplicationService } from '../services/ApplicationService.js';
import { ApplicationStatus } from '../types/application.types.js';
import { AppError } from '../../../core/errors/AppError.js';

export const ApplicationController = {
  apply: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: jobId } = req.params as { id: string };
      const body = req.body as { coverLetter?: string; resumeUrl?: string; videoUrl?: string; portfolioUrls?: string[] };
      const app = await ApplicationService.apply(jobId, req.user!.sub, body);
      res.status(201).json({ success: true, data: app });
    } catch (err) { next(err); }
  },

  myApplications: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apps = await ApplicationService.listByApplicant(req.user!.sub);
      res.json({ success: true, data: apps, count: apps.length });
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { appId } = req.params as { appId: string };
      const app = await ApplicationService.getById(appId);
      if (app.applicantId !== req.user!.sub) throw new AppError('Forbidden', 403, 'FORBIDDEN');
      res.json({ success: true, data: app });
    } catch (err) { next(err); }
  },

  listForJob: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: jobId } = req.params as { id: string };
      const { status } = req.query as { status?: string };
      const apps = await ApplicationService.listByJob(jobId, status as ApplicationStatus | undefined);
      res.json({ success: true, data: apps, count: apps.length });
    } catch (err) { next(err); }
  },

  advance: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { appId } = req.params as { appId: string };
      const body = req.body as { status: ApplicationStatus; notes?: string };
      if (!body.status) throw new AppError('status is required', 400, 'MISSING_STATUS');
      const app = await ApplicationService.advance(appId, body.status, req.user!.sub, body.notes);
      res.json({ success: true, data: app });
    } catch (err) { next(err); }
  },

  withdraw: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { appId } = req.params as { appId: string };
      const app = await ApplicationService.withdraw(appId, req.user!.sub);
      res.json({ success: true, data: app });
    } catch (err) { next(err); }
  },

  scheduleInterview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { appId } = req.params as { appId: string };
      const body = req.body as { scheduledAt: string; notes?: string };
      if (!body.scheduledAt) throw new AppError('scheduledAt is required', 400, 'MISSING_FIELD');
      const app = await ApplicationService.scheduleInterview(appId, req.user!.sub, body.scheduledAt, body.notes);
      res.json({ success: true, data: app });
    } catch (err) { next(err); }
  },

  getPipeline: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { appId } = req.params as { appId: string };
      const pipeline = await ApplicationService.getPipeline(appId);
      res.json({ success: true, data: pipeline });
    } catch (err) { next(err); }
  },
};
