import type { Request, Response } from 'express';
import { DeviceService } from '../services/DeviceService.js';

type AuthReq = Request & { user?: { userId: string } };

export const DeviceController = {
  // GET /identity/devices
  async list(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthReq).user!;
    const devices = await DeviceService.list(userId);
    res.json({ devices });
  },

  // POST /identity/devices/:id/trust
  async trust(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthReq).user!;
    const id         = req.params['id'] as string;
    const days       = Number((req.body as Record<string, unknown>)['days'] ?? 30);

    const devices = await DeviceService.trust(id, userId, days);
    res.json({ message: 'Device trusted', devices });
  },

  // PATCH /identity/devices/:id
  async rename(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthReq).user!;
    const id         = req.params['id'] as string;
    const name       = String((req.body as Record<string, unknown>)['name'] ?? '').trim();

    if (!name) { res.status(400).json({ error: 'name is required' }); return; }

    await DeviceService.rename(id, userId, name);
    res.json({ message: 'Device renamed' });
  },

  // DELETE /identity/devices/:id
  async remove(req: Request, res: Response): Promise<void> {
    const { userId } = (req as AuthReq).user!;
    const id         = req.params['id'] as string;

    await DeviceService.remove(id, userId);
    res.json({ message: 'Device removed' });
  },
};
