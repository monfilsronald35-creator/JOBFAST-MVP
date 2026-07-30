import type { Request, Response } from 'express';
import { SessionService } from '../services/SessionService.js';

type AuthReq = Request & { user?: { userId: string; sessionId: string; jti?: string } };

export const SessionController = {
  // GET /identity/sessions
  async list(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthReq).user!;
    const sessions = await SessionService.list(userId);
    res.json({ sessions });
  },

  // DELETE /identity/sessions/:id
  async revoke(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthReq).user!;
    const sessionId  = req.params['id'] as string;

    await SessionService.revoke(sessionId, userId);
    res.json({ message: 'Session revoked' });
  },

  // DELETE /identity/sessions (revoke all except current)
  async revokeOthers(req: Request, res: Response): Promise<void> {
    const { userId, sessionId } = (req as AuthReq).user!;
    await SessionService.revokeAllExcept(userId, sessionId);
    res.json({ message: 'All other sessions revoked' });
  },
};
