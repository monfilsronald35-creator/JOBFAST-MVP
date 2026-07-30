import type { Request, Response, NextFunction } from 'express';
import { RefundService } from '../services/RefundService.js';

export const RefundController = {
  async request(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId   = req.user!.sub;
      const body     = req.body as unknown as Record<string, unknown>;
      const intentId = String(body['intentId'] ?? '');
      const amount   = Number(body['amount']   ?? 0);
      const reason   = String(body['reason']   ?? '');
      const refund   = await RefundService.request(intentId, userId, amount, reason);
      res.status(201).json({ data: refund });
    } catch (err) { next(err); }
  },

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refundId = String(req.params['id']);
      const body     = req.body as unknown as Record<string, unknown>;
      const intentId = String(body['intentId'] ?? '');
      const refund   = await RefundService.approve(refundId, intentId);
      res.json({ data: refund });
    } catch (err) { next(err); }
  },
};
