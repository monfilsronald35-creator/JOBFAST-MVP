import type { Request, Response, NextFunction } from 'express';
import { RoomService }  from '../services/RoomService.js';
import { RoomType }     from '../types/chat.types.js';

export const RoomController = {
  async createDirect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const body   = req.body as unknown as Record<string, unknown>;
      const room   = await RoomService.createDirect(userId, String(body['targetUserId'] ?? ''));
      res.status(201).json({ data: room });
    } catch (err) { next(err); }
  },

  async createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const body   = req.body as unknown as Record<string, unknown>;
      const opts: Parameters<typeof RoomService.createGroup>[0] = {
        createdBy:  userId,
        name:       String(body['name'] ?? ''),
        memberIds:  (body['memberIds'] as string[]) ?? [],
      };
      const o = opts as unknown as Record<string, unknown>;
      if (body['description']) o['description'] = String(body['description']);
      if (body['isEncrypted']) o['isEncrypted'] = Boolean(body['isEncrypted']);
      const room = await RoomService.createGroup(opts);
      res.status(201).json({ data: room });
    } catch (err) { next(err); }
  },

  async createChannel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const body   = req.body as unknown as Record<string, unknown>;
      const room   = await RoomService.createChannel({
        createdBy: userId,
        name:      String(body['name'] ?? ''),
        type:      String(body['type'] ?? RoomType.Channel) as RoomType.Channel,
        description: body['description'] ? String(body['description']) : undefined,
      });
      res.status(201).json({ data: room });
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rooms = await RoomService.listRooms(req.user!.sub);
      res.json({ data: rooms });
    } catch (err) { next(err); }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await RoomService.getRoom(String(req.params['id']), req.user!.sub);
      res.json({ data: room });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body  = req.body as unknown as Record<string, unknown>;
      const patch: Record<string, unknown> = {};
      if (body['name'])        patch['name']        = String(body['name']);
      if (body['description']) patch['description'] = String(body['description']);
      if (body['avatarUrl'])   patch['avatarUrl']   = String(body['avatarUrl']);
      const room = await RoomService.updateRoom(String(req.params['id']), req.user!.sub, patch);
      res.json({ data: room });
    } catch (err) { next(err); }
  },

  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body   = req.body as unknown as Record<string, unknown>;
      const member = await RoomService.addMember(String(req.params['id']), req.user!.sub, String(body['userId'] ?? ''));
      res.status(201).json({ data: member });
    } catch (err) { next(err); }
  },

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await RoomService.removeMember(String(req.params['id']), req.user!.sub, String(req.params['userId']));
      res.status(204).end();
    } catch (err) { next(err); }
  },

  async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await RoomService.listMembers(String(req.params['id']), req.user!.sub);
      res.json({ data: members });
    } catch (err) { next(err); }
  },
};
