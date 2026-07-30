import type { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../_base/BaseController.js';
import type { JobService } from '../services/JobService.js';

export class JobController extends BaseController {
  constructor(private readonly _service: JobService) { super(); }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._service.listJobs(req.query as never);
      this.paginated(res, result.items, result.nextCursor, result.total);
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this._service.getById(req.params['id']!);
      this.ok(res, job);
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this._service.createJob(req.user!.sub, req.body);
      this.created(res, job);
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this._service.updateJob(req.user!.sub, req.params['id']!, req.body);
      this.ok(res, job);
    } catch (err) { next(err); }
  };

  assign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.assignJob(req.user!.sub, req.params['id']!, req.body.workerId);
      this.noContent(res);
    } catch (err) { next(err); }
  };

  start = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.startJob(req.user!.sub, req.params['id']!);
      this.noContent(res);
    } catch (err) { next(err); }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.completeJob(req.user!.sub, req.params['id']!);
      this.noContent(res);
    } catch (err) { next(err); }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.cancelJob(req.user!.sub, req.params['id']!, req.body.reason);
      this.noContent(res);
    } catch (err) { next(err); }
  };

  dispute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.disputeJob(req.user!.sub, req.params['id']!);
      this.noContent(res);
    } catch (err) { next(err); }
  };
}
