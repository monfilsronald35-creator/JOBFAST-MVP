import type { Request, Response, NextFunction } from 'express';
import { EnterpriseService }                     from '../services/EnterpriseService.js';
import { NotifEventType, NotifChannel }          from '../types/notification.types.js';

export const EnterpriseController = {
  async createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const campaign = await EnterpriseService.createCampaign({
        name:            String(body['name'] ?? ''),
        eventType:       String(body['eventType'] ?? '') as NotifEventType,
        channels:        (body['channels'] as NotifChannel[]) ?? [NotifChannel.Push],
        title:           String(body['title'] ?? ''),
        body:            String(body['body']  ?? ''),
        createdBy:       req.user!.sub,
        targetRoles:     body['targetRoles']    as string[] | undefined,
        targetCountries: body['targetCountries'] as string[] | undefined,
        targetLangs:     body['targetLangs']    as string[] | undefined,
        scheduledAt:     body['scheduledAt']    ? String(body['scheduledAt']) : undefined,
      });
      res.status(201).json({ data: campaign });
    } catch (err) { next(err); }
  },

  async broadcast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const result = await EnterpriseService.broadcast({
        title:           String(body['title']     ?? ''),
        body:            String(body['body']      ?? ''),
        eventType:       String(body['eventType'] ?? 'promotion') as NotifEventType,
        channels:        (body['channels'] as NotifChannel[]) ?? [NotifChannel.Push],
        createdBy:       req.user!.sub,
        targetRoles:     body['targetRoles']     as string[] | undefined,
        targetCountries: body['targetCountries'] as string[] | undefined,
        targetLangs:     body['targetLangs']     as string[] | undefined,
      });
      res.json(result);
    } catch (err) { next(err); }
  },

  async listCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit     = Number(req.query['limit'] ?? 20);
      const campaigns = await EnterpriseService.listCampaigns(limit);
      res.json({ data: campaigns });
    } catch (err) { next(err); }
  },
};