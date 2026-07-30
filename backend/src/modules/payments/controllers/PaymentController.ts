import type { Request, Response, NextFunction } from 'express';
import { PaymentOrchestratorService } from '../services/PaymentOrchestratorService.js';
import { ThreeDSecureService }        from '../services/ThreeDSecureService.js';
import { PaymentMethod }              from '../types/payment.types.js';

export const PaymentController = {
  async createIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const body   = req.body as unknown as Record<string, unknown>;
      const input: Parameters<typeof PaymentOrchestratorService.createIntent>[1] = {
        amount:      Number(body['amount']      ?? 0),
        currency:    String(body['currency']    ?? 'HTG'),
        method:      String(body['method']      ?? 'card') as PaymentMethod,
        description: String(body['description'] ?? ''),
      };
      const i = input as unknown as Record<string, unknown>;
      if (body['country'])     i['country']     = String(body['country']);
      if (body['splitRuleId']) i['splitRuleId'] = String(body['splitRuleId']);
      if (body['escrowId'])    i['escrowId']    = String(body['escrowId']);
      if (body['orderId'])     i['orderId']     = String(body['orderId']);
      if (body['jobId'])       i['jobId']       = String(body['jobId']);
      if (body['kycLevel'])    i['kycLevel']    = Number(body['kycLevel']);
      if (body['metadata'])    i['metadata']    = body['metadata'];
      if (req.ip)              i['ipAddress']   = req.ip;
      if (req.headers['x-device-id']) i['deviceId'] = String(req.headers['x-device-id']);

      const intent = await PaymentOrchestratorService.createIntent(userId, input);
      res.status(201).json({ data: intent });
    } catch (err) { next(err); }
  },

  async confirmIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId   = req.user!.sub;
      const intentId = String(req.params['id']);
      const intent   = await PaymentOrchestratorService.confirmIntent(intentId, userId);
      res.json({ data: intent });
    } catch (err) { next(err); }
  },

  async listIntents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const q      = req.query as unknown as Record<string, unknown>;
      const opts: Record<string, unknown> = {};
      if (q['status']) opts['status'] = String(q['status']);
      if (q['limit'])  opts['limit']  = Number(q['limit']);
      if (q['cursor']) opts['cursor'] = String(q['cursor']);
      const result = await PaymentOrchestratorService.listIntents(userId, opts);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId   = req.user!.sub;
      const intentId = String(req.params['id']);
      const intent   = await PaymentOrchestratorService.getIntent(intentId, userId);
      res.json({ data: intent });
    } catch (err) { next(err); }
  },

  // 3DS
  async initiate3DS(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId   = req.user!.sub;
      const intentId = String(req.params['id']);
      const body     = req.body as unknown as Record<string, unknown>;
      const challenge = String(body['challenge'] ?? 'OTP') as 'OTP' | 'FaceID' | 'Fingerprint' | 'PIN';
      const session  = await ThreeDSecureService.initiate(intentId, userId, challenge);
      res.json({ data: session });
    } catch (err) { next(err); }
  },

  async verify3DS(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId    = req.user!.sub;
      const sessionId = String(req.params['sessionId']);
      const body      = req.body as unknown as Record<string, unknown>;
      const code      = String(body['code'] ?? '');
      const verified  = await ThreeDSecureService.verify(sessionId, code, userId);
      res.json({ data: { verified } });
    } catch (err) { next(err); }
  },
};
