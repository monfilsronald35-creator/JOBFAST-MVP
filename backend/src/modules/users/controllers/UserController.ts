import type { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../_base/BaseController.js';
import type { UserService } from '../services/UserService.js';

export class UserController extends BaseController {
  constructor(private readonly _service: UserService) { super(); }

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this._service.getById(req.user!.sub);
      this.ok(res, user);
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this._service.getById(req.params['id']!);
      this.ok(res, user);
    } catch (err) { next(err); }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._service.listUsers(req.query as never);
      this.paginated(res, result.items, result.nextCursor, result.total);
    } catch (err) { next(err); }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this._service.updateProfile(req.user!.sub, req.user!.sub, req.body);
      this.ok(res, user);
    } catch (err) { next(err); }
  };

  deleteMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.deleteAccount(req.user!.sub, req.user!.sub);
      this.noContent(res);
    } catch (err) { next(err); }
  };

  // Admin-only actions
  suspend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.suspendUser(req.user!.sub, req.params['id']!, req.body.reason);
      this.noContent(res);
    } catch (err) { next(err); }
  };

  activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.activateUser(req.user!.sub, req.params['id']!);
      this.noContent(res);
    } catch (err) { next(err); }
  };
}
