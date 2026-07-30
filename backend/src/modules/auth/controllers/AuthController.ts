import type { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../_base/BaseController.js';
import type { AuthService } from '../services/AuthService.js';

export class AuthController extends BaseController {
  constructor(private readonly _service: AuthService) {
    super();
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip     = req.ip ?? req.socket.remoteAddress;
      const result = await this._service.login(req.body, ip);
      this.ok(res, result);
    } catch (err) { next(err); }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._service.register(req.body);
      this.created(res, result);
    } catch (err) { next(err); }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._service.refreshToken(req.body.refreshToken);
      this.ok(res, result);
    } catch (err) { next(err); }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { next(new Error('Unauthorized')); return; }
      this.ok(res, { id: req.user.sub, role: req.user.role });
    } catch (err) { next(err); }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { next(new Error('Unauthorized')); return; }
      await this._service.changePassword(req.user.sub, req.body);
      this.noContent(res);
    } catch (err) { next(err); }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.requestPasswordReset(req.body.email);
      this.ok(res, { message: 'Si email la egziste, ou pral resevwa yon lyen' });
    } catch (err) { next(err); }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this._service.resetPassword(req.body.token, req.body.newPassword);
      this.noContent(res);
    } catch (err) { next(err); }
  };
}
