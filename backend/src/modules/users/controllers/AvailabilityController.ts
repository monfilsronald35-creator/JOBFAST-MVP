import type { Request, Response, NextFunction } from 'express';
import { AvailabilityService } from '../services/AvailabilityService.js';
import type { AvailabilityStatus } from '../types/profile.types.js';

const VALID_STATUSES: AvailabilityStatus[] = ['online', 'offline', 'busy', 'available', 'vacation', 'emergency_only'];

export const AvailabilityController = {
  get: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const avail = await AvailabilityService.get(req.user!.sub);
      res.json({ success: true, data: avail });
    } catch (err) { next(err); }
  },

  set: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { status?: AvailabilityStatus; message?: string; until?: string; timezone?: string };
      if (!body.status || !VALID_STATUSES.includes(body.status)) {
        res.status(400).json({ success: false, error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
        return;
      }
      const opts: Parameters<typeof AvailabilityService.set>[2] = {};
      const o = opts as Record<string, unknown>;
      if (body.message)  o['message']  = body.message;
      if (body.until)    o['until']    = new Date(body.until);
      if (body.timezone) o['timezone'] = body.timezone;
      const avail = await AvailabilityService.set(req.user!.sub, body.status, opts);
      res.json({ success: true, data: avail });
    } catch (err) { next(err); }
  },
};
