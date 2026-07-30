import type { Request, Response } from 'express';
import { ProfileAnalyticsService } from '../services/ProfileAnalyticsService.js';

export const AnalyticsController = {
  async getMyAnalytics(req: Request, res: Response): Promise<void> {
    const userId = (req as Request & { userId?: string }).userId!;
    const data = await ProfileAnalyticsService.getAnalytics(userId);
    res.json({ success: true, data });
  },
};
