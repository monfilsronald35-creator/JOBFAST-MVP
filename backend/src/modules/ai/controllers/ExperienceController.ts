import type { Request, Response, NextFunction } from 'express';
import { DailyBriefingEngine }    from '../services/DailyBriefingEngine.js';
import { SmartHomeEngine }        from '../services/SmartHomeEngine.js';
import { DecisionEngine }         from '../services/DecisionEngine.js';
import { PersonalizationEngine }  from '../services/PersonalizationEngine.js';
import { OpportunityEngine }      from '../services/OpportunityEngine.js';
import { CityIntelligenceService } from '../services/CityIntelligenceService.js';
import { TravelConciergeService }  from '../services/TravelConciergeService.js';
import { BusinessConciergeService } from '../services/BusinessConciergeService.js';
import { ExperienceScoreService }  from '../services/ExperienceScoreService.js';
import { ExperienceRepository }   from '../repositories/ExperienceRepository.js';
import { db }                     from '../../../core/database/SupabaseClient.js';

export const ExperienceController = {
  // ── Load (first screen after login) ───────────────────────────────────────
  async load(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId  = req.user!.sub;
      const headers = req.headers as Record<string, string | undefined>;
      const ctx     = await PersonalizationEngine.buildContext(userId, headers);

      // Get user full name
      const { data: profile } = await db.client()
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      const fullName = String((profile as Record<string, unknown> | null)?.['full_name'] ?? 'ou');

      const [briefing, homeConfig] = await Promise.all([
        DailyBriefingEngine.generate(ctx, fullName),
        Promise.resolve(SmartHomeEngine.buildConfig(ctx)),
      ]);

      const prioritizedItems = DecisionEngine.prioritize(ctx, briefing.items);

      res.json({
        ctx: { role: ctx.role, lang: ctx.lang, timezone: ctx.timezone },
        briefing: { ...briefing, items: prioritizedItems },
        home:     homeConfig,
      });
    } catch (err) { next(err); }
  },

  // ── Daily Briefing ─────────────────────────────────────────────────────────
  async getBriefing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId  = req.user!.sub;
      const headers = req.headers as Record<string, string | undefined>;
      const ctx     = await PersonalizationEngine.buildContext(userId, headers);
      const { data: p } = await db.client().from('profiles').select('full_name').eq('id', userId).single();
      const fullName = String((p as Record<string, unknown> | null)?.['full_name'] ?? 'ou');
      const briefing = await DailyBriefingEngine.generate(ctx, fullName);
      res.json({ data: { ...briefing, items: DecisionEngine.prioritize(ctx, briefing.items) } });
    } catch (err) { next(err); }
  },

  async invalidateBriefing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await DailyBriefingEngine.invalidate(req.user!.sub);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Smart Home ─────────────────────────────────────────────────────────────
  async getHome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = await PersonalizationEngine.buildContext(req.user!.sub, req.headers as Record<string, string | undefined>);
      res.json({ data: SmartHomeEngine.buildConfig(ctx) });
    } catch (err) { next(err); }
  },

  // ── Opportunities ──────────────────────────────────────────────────────────
  async listOpportunities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Number(req.query['limit'] ?? 10);
      const opps  = await OpportunityEngine.list(req.user!.sub, limit);
      res.json({ data: opps });
    } catch (err) { next(err); }
  },

  async discoverOpportunities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ctx = await PersonalizationEngine.buildContext(req.user!.sub, req.headers as Record<string, string | undefined>);
      void OpportunityEngine.discover(ctx);
      res.json({ success: true, message: 'Discovery started' });
    } catch (err) { next(err); }
  },

  async dismissOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await OpportunityEngine.dismiss(String(req.params['id']), req.user!.sub);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── City Intelligence ──────────────────────────────────────────────────────
  async cityDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const city    = String(req.query['city']    ?? '');
      const country = String(req.query['country'] ?? 'HT');
      const data    = await CityIntelligenceService.getDashboard(city, country);
      res.json({ data });
    } catch (err) { next(err); }
  },

  // ── Travel Concierge ───────────────────────────────────────────────────────
  async getTravelPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const city = String(req.query['city']  ?? '');
      const lang = String(req.query['lang']  ?? 'ht');
      const plan = TravelConciergeService.generateDayPlan(city, lang);
      res.json({ data: plan });
    } catch (err) { next(err); }
  },

  // ── Business Concierge ─────────────────────────────────────────────────────
  async getBusinessKPIs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currency = String(req.query['currency'] ?? 'HTG');
      const kpis     = await BusinessConciergeService.getKPIs(req.user!.sub, currency);
      res.json({ data: kpis });
    } catch (err) { next(err); }
  },

  // ── Preferences ────────────────────────────────────────────────────────────
  async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prefs = await ExperienceRepository.getPreferences(req.user!.sub);
      res.json({ data: prefs });
    } catch (err) { next(err); }
  },

  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Record<string, unknown>;
      await ExperienceRepository.savePreferences({
        userId:               req.user!.sub,
        briefingEnabled:      Boolean(body['briefingEnabled']      ?? true),
        opportunitiesEnabled: Boolean(body['opportunitiesEnabled'] ?? true),
        cityIntelEnabled:     Boolean(body['cityIntelEnabled']     ?? true),
        personalizationLevel: (body['personalizationLevel'] as 'minimal' | 'standard' | 'full') ?? 'standard',
        shareLocation:        Boolean(body['shareLocation'] ?? false),
        shareHistory:         Boolean(body['shareHistory']  ?? true),
        updatedAt:            new Date().toISOString(),
      });
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Experience Score ───────────────────────────────────────────────────────
  async getScore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const score = await ExperienceScoreService.getToday(req.user!.sub);
      res.json({ data: score });
    } catch (err) { next(err); }
  },
};