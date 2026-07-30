import type { Request, Response, NextFunction } from 'express';
import { CardService }                          from '../services/CardService.js';

export const CardController = {
  async issue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const opts: Parameters<typeof CardService.issue>[1] = {};
      const o = opts as unknown as Record<string, unknown>;
      if (body['currency'])                   o['currency']    = String(body['currency']);
      if (body['spendLimit'] !== undefined)   o['spendLimit']  = Number(body['spendLimit']);
      if (body['isDisposable'] !== undefined) o['isDisposable'] = Boolean(body['isDisposable']);
      if (body['nickname'])                   o['nickname']    = String(body['nickname']);
      const card = await CardService.issue(req.user!.sub, opts);
      res.status(201).json({ success: true, data: card });
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cards = await CardService.list(req.user!.sub);
      res.json({ success: true, data: cards });
    } catch (err) { next(err); }
  },

  async block(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const card = await CardService.block(String(req.params['id']), req.user!.sub);
      res.json({ success: true, data: card });
    } catch (err) { next(err); }
  },

  async unblock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const card = await CardService.unblock(String(req.params['id']), req.user!.sub);
      res.json({ success: true, data: card });
    } catch (err) { next(err); }
  },

  async setLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      const card = await CardService.setLimit(String(req.params['id']), req.user!.sub, Number(body['spendLimit'] ?? 0));
      res.json({ success: true, data: card });
    } catch (err) { next(err); }
  },
};
