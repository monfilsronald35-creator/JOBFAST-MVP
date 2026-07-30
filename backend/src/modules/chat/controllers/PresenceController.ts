import type { Request, Response, NextFunction } from 'express';
import { PresenceService }  from '../services/PresenceService.js';
import { PresenceStatus }   from '../types/chat.types.js';

export const PresenceController = {
  async getPresence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId   = String(req.params['userId']);
      const presence = await PresenceService.get(userId);
      res.json({ data: presence ?? { userId, status: PresenceStatus.Offline, lastSeen: new Date().toISOString() } });
    } catch (err) { next(err); }
  },

  async getBulkPresence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body    = req.body as unknown as Record<string, unknown>;
      const userIds = (body['userIds'] as string[]) ?? [];
      const presence = await PresenceService.getMany(userIds);
      res.json({ data: presence });
    } catch (err) { next(err); }
  },

  async setStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const body   = req.body as unknown as Record<string, unknown>;
      const status = String(body['status'] ?? 'online') as PresenceStatus;
      await PresenceService.setStatus(userId, status);
      const io = req.app.get('io');
      if (io) io.emit('chat:presence', { userId, status });
      res.status(204).end();
    } catch (err) { next(err); }
  },

  async getTyping(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomId = String(req.params['roomId']);
      const users  = PresenceService.getTypingUsers(roomId);
      res.json({ data: { roomId, users } });
    } catch (err) { next(err); }
  },
};
