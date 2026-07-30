import type { Request, Response, NextFunction } from 'express';
import { SubscriptionBillingService } from '../services/SubscriptionBillingService.js';
import { SubscriptionInterval, ProviderName } from '../types/payment.types.js';

export const SubscriptionController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const body   = req.body as unknown as Record<string, unknown>;
      const opts: Parameters<typeof SubscriptionBillingService.create>[1] = {
        interval: String(body['interval'] ?? 'monthly') as SubscriptionInterval,
        amount:   Number(body['amount']   ?? 0),
        currency: String(body['currency'] ?? 'HTG'),
      };
      const o = opts as unknown as Record<string, unknown>;
      if (body['provider'])   o['provider']   = String(body['provider']) as ProviderName;
      if (body['planId'])     o['planId']     = String(body['planId']);
      if (body['trialDays'])  o['trialDays']  = Number(body['trialDays']);
      const sub = await SubscriptionBillingService.create(userId, opts);
      res.status(201).json({ data: sub });
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId         = req.user!.sub;
      const subscriptionId = String(req.params['id']);
      const sub            = await SubscriptionBillingService.cancel(subscriptionId, userId);
      res.json({ data: sub });
    } catch (err) { next(err); }
  },

  async renew(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId         = req.user!.sub;
      const subscriptionId = String(req.params['id']);
      const sub            = await SubscriptionBillingService.renew(subscriptionId, userId);
      res.json({ data: sub });
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const subs   = await SubscriptionBillingService.list(userId);
      res.json({ data: subs });
    } catch (err) { next(err); }
  },
};
