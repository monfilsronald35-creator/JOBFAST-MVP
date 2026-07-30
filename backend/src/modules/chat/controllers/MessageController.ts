import type { Request, Response, NextFunction } from 'express';
import { MessageService }   from '../services/MessageService.js';
import { SearchService }    from '../services/SearchService.js';
import { TranslationService } from '../services/TranslationService.js';
import { MessageType }      from '../types/chat.types.js';

export const MessageController = {
  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const roomId = String(req.params['roomId']);
      const body   = req.body as unknown as Record<string, unknown>;
      const input: Parameters<typeof MessageService.send>[0] = {
        roomId, senderId: userId,
        type: String(body['type'] ?? 'text') as MessageType,
      };
      const i = input as unknown as Record<string, unknown>;
      if (body['content'])     i['content']     = String(body['content']);
      if (body['replyToId'])   i['replyToId']   = String(body['replyToId']);
      if (body['metadata'])    i['metadata']    = body['metadata'];
      if (body['attachments']) i['attachments'] = body['attachments'];
      const message = await MessageService.send(input);
      // Push via Socket.IO if available
      const io = req.app.get('io');
      if (io) io.to(`room:${roomId}`).emit('chat:message', message);
      res.status(201).json({ data: message });
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const roomId = String(req.params['roomId']);
      const q      = req.query as unknown as Record<string, unknown>;
      const opts: Record<string, unknown> = {};
      if (q['cursor']) opts['cursor'] = String(q['cursor']);
      if (q['limit'])  opts['limit']  = Number(q['limit']);
      const messages = await MessageService.list(roomId, userId, opts);
      res.json({ data: messages });
    } catch (err) { next(err); }
  },

  async edit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId  = req.user!.sub;
      const body    = req.body as unknown as Record<string, unknown>;
      const updated = await MessageService.edit(String(req.params['id']), userId, String(body['content'] ?? ''));
      const io = req.app.get('io');
      if (io) io.to(`room:${updated.roomId}`).emit('chat:message_edited', updated);
      res.json({ data: updated });
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const roomId = String(req.params['roomId']);
      const msgId  = String(req.params['id']);
      await MessageService.delete(msgId, userId, roomId);
      const io = req.app.get('io');
      if (io) io.to(`room:${roomId}`).emit('chat:message_deleted', { messageId: msgId, roomId });
      res.status(204).end();
    } catch (err) { next(err); }
  },

  async react(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const body   = req.body as unknown as Record<string, unknown>;
      await MessageService.react(String(req.params['id']), userId, String(body['emoji'] ?? ''));
      res.status(204).end();
    } catch (err) { next(err); }
  },

  async translate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as unknown as Record<string, unknown>;
      const text = await TranslationService.translate(
        String(req.params['id']), String(body['content'] ?? ''), String(body['targetLang'] ?? 'en')
      );
      res.json({ data: { translated: text } });
    } catch (err) { next(err); }
  },

  async getPinned(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messages = await MessageService.getPinned(String(req.params['roomId']), req.user!.sub);
      res.json({ data: messages });
    } catch (err) { next(err); }
  },

  async pin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MessageService.pin(String(req.params['roomId']), String(req.params['id']), req.user!.sub);
      res.status(204).end();
    } catch (err) { next(err); }
  },

  async unpin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MessageService.unpin(String(req.params['roomId']), String(req.params['id']), req.user!.sub);
      res.status(204).end();
    } catch (err) { next(err); }
  },

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const q      = req.query as unknown as Record<string, unknown>;
      const opts: Parameters<typeof SearchService.search>[0] = {
        query:  String(q['q'] ?? ''),
        userId,
      };
      const o = opts as unknown as Record<string, unknown>;
      if (q['roomId']) o['roomId'] = String(q['roomId']);
      if (q['limit'])  o['limit']  = Number(q['limit']);
      const result = await SearchService.search(opts);
      res.json({ data: result });
    } catch (err) { next(err); }
  },
};
