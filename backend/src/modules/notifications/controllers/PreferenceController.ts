import type { Request, Response, NextFunction } from 'express';
import { PreferenceService }                     from '../services/PreferenceService.js';
import { NotifChannel }                          from '../types/notification.types.js';

export const PreferenceController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prefs = await PreferenceService.getAll(req.user!.sub);
      res.json({ data: prefs });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body     = req.body as Record<string, unknown>;
      const channel  = String(body['channel']  ?? '') as NotifChannel;
      const category = String(body['category'] ?? 'general');
      const enabled  = Boolean(body['enabled'] ?? true);
      const pref = await PreferenceService.update(req.user!.sub, channel, category, enabled, {
        quietHoursFrom: body['quietHoursFrom'] ? String(body['quietHoursFrom']) : undefined,
        quietHoursTo:   body['quietHoursTo']   ? String(body['quietHoursTo'])   : undefined,
        timezone:       body['timezone']        ? String(body['timezone'])        : undefined,
      });
      res.json({ data: pref });
    } catch (err) { next(err); }
  },

  async setQuietHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body     = req.body as Record<string, unknown>;
      const channel  = String(body['channel']  ?? 'push') as NotifChannel;
      const from     = String(body['from']     ?? '22:00');
      const to       = String(body['to']       ?? '08:00');
      const timezone = String(body['timezone'] ?? 'America/Port-au-Prince');
      await PreferenceService.setQuietHours(req.user!.sub, channel, from, to, timezone);
      res.json({ success: true });
    } catch (err) { next(err); }
  },
};