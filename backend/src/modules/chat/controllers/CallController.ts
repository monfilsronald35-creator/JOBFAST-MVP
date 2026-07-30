import type { Request, Response, NextFunction } from 'express';
import { CallService }  from '../services/CallService.js';
import type { CallType } from '../types/chat.types.js';

export const CallController = {
  async initiate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const body   = req.body as unknown as Record<string, unknown>;
      const roomId = String(req.params['roomId']);
      const call   = await CallService.initiate(roomId, userId, String(body['type'] ?? 'voice') as CallType);
      const io     = req.app.get('io');
      if (io) io.to(`room:${roomId}`).emit('chat:call_offer', { callId: call.id, callerId: userId, type: call.type });
      res.status(201).json({ data: call });
    } catch (err) { next(err); }
  },

  async answer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const call = await CallService.answer(String(req.params['id']), req.user!.sub);
      const io   = req.app.get('io');
      if (io && call) io.to(`room:${call.roomId}`).emit('chat:call_answer', { callId: call.id, userId: req.user!.sub });
      res.json({ data: call });
    } catch (err) { next(err); }
  },

  async end(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const callId = String(req.params['id']);
      const call   = await CallService.get(callId);
      await CallService.end(callId, req.user!.sub);
      const io = req.app.get('io');
      if (io && call) io.to(`room:${call.roomId}`).emit('chat:call_end', { callId });
      res.status(204).end();
    } catch (err) { next(err); }
  },

  async decline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const callId = String(req.params['id']);
      const call   = await CallService.get(callId);
      await CallService.decline(callId, req.user!.sub);
      const io = req.app.get('io');
      if (io && call) io.to(`room:${call.roomId}`).emit('chat:call_end', { callId, declined: true });
      res.status(204).end();
    } catch (err) { next(err); }
  },

  async getCall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const call = await CallService.get(String(req.params['id']));
      res.json({ data: call });
    } catch (err) { next(err); }
  },
};
