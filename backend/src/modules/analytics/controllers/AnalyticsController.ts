import type { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/AnalyticsService.js';

function bv(req: Request): Record<string, unknown> { return req.body as Record<string, unknown>; }
function qv(req: Request): Record<string, unknown> { return req.query as Record<string, unknown>; }
function uid(req: Request): string                  { return req.user!.sub; }

export const AnalyticsController = {
  async trackEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const events = Array.isArray(b['events']) ? b['events'] as Record<string, unknown>[] : [b];
      await AnalyticsService.trackBatch(events);
      res.status(202).end();
    } catch (err) { next(err); }
  },

  async getKPIs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q      = qv(req);
      const period = q['period'] ? String(q['period']) : new Date().toISOString().slice(0, 7);
      res.json({ data: await AnalyticsService.getKPIs(period) });
    } catch (err) { next(err); }
  },

  async getRealtime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await AnalyticsService.getRealtimeMetrics() }); } catch (err) { next(err); }
  },

  async getUserBehavior(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q   = qv(req);
      const id  = req.params['userId'] ?? uid(req);
      res.json({ data: await AnalyticsService.getUserBehavior(String(id), q['days'] ? Number(q['days']) : 30) });
    } catch (err) { next(err); }
  },

  async getFunnel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b      = bv(req);
      const steps  = (b['steps'] as string[]) ?? [];
      const period = b['period'] ? String(b['period']) : new Date().toISOString().slice(0, 7);
      const result = await AnalyticsService.getFunnelAnalysis(steps, period);
      const total  = result[0]?.count ?? 0;
      const last   = result[result.length - 1]?.count ?? 0;
      res.json({ data: { steps: result, totalEntered: total, totalCompleted: last, overallRate: total > 0 ? Math.round(last / total * 1000) / 10 : 0 } });
    } catch (err) { next(err); }
  },

  async getCohort(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = qv(req);
      const p = q['period'] ? String(q['period']) : new Date().toISOString().slice(0, 7);
      res.json({ data: await AnalyticsService.getCohortRetention(p) });
    } catch (err) { next(err); }
  },

  async saveReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = bv(req);
      const r = await AnalyticsService.saveReport(uid(req), {
        name:    String(b['name']    ?? ''),
        type:    String(b['type']    ?? 'custom'),
        period:  String(b['period']  ?? ''),
        filters: b['filters'] as Record<string, unknown> | undefined,
        data:    b['data']    as Record<string, unknown> | undefined,
      });
      res.status(201).json({ data: r });
    } catch (err) { next(err); }
  },

  async listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await AnalyticsService.listReports(uid(req)) }); } catch (err) { next(err); }
  },
};