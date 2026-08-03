import type { Request, Response }      from 'express';
import { CountryConfigService }          from '../services/CountryConfigService.js';
import { CountryContextEngine }          from '../services/CountryContextEngine.js';
import { CountryDetectionService }       from '../services/CountryDetectionService.js';
import { CrossBorderService }            from '../services/CrossBorderService.js';
import { LocalizationService }           from '../services/LocalizationService.js';
import { CountryAnalyticsService }       from '../services/CountryAnalyticsService.js';

function uid(req: Request): string {
  return (req as unknown as { user?: { sub?: string } }).user?.sub ?? '';
}

export const LocalizationController = {
  // ── Countries ──────────────────────────────────────────────────────────────
  async listCountries(_req: Request, res: Response): Promise<void> {
    const countries = await CountryConfigService.listActive();
    res.json({ success: true, data: countries });
  },

  async getCountry(req: Request, res: Response): Promise<void> {
    const code   = String(req.params['code'] ?? '').toUpperCase();
    const config = await CountryConfigService.getConfig(code);
    if (!config) { res.status(404).json({ error: 'Peyi pa jwenn' }); return; }
    const features = await CountryConfigService.getFeatures(code);
    res.json({ success: true, data: { config, features, appLabel: CountryConfigService.getAppLabel(code) } });
  },

  // ── User context ──────────────────────────────────────────────────────────
  async getMyContext(req: Request, res: Response): Promise<void> {
    const userId = uid(req);
    const ctx    = await CountryContextEngine.getUserContext(userId);
    const locCtx = req.locCtx;
    res.json({ success: true, data: { ctx: ctx ?? locCtx?.ctx, config: locCtx?.config, features: locCtx?.features } });
  },

  async confirmContext(req: Request, res: Response): Promise<void> {
    const userId = uid(req);
    const { country, city, state } = req.body as { country?: string; city?: string; state?: string };
    if (!country) { res.status(400).json({ error: 'country obligatwa' }); return; }

    const ctx = await CountryContextEngine.confirmContext(userId, country.toUpperCase(), city, state);
    res.json({ success: true, data: ctx, appLabel: CountryConfigService.getAppLabel(country) });
  },

  async updateContext(req: Request, res: Response): Promise<void> {
    const userId = uid(req);
    const updates = req.body as { city?: string; state?: string; preferredLang?: string; language?: string };
    await CountryContextEngine.updateContext(userId, updates);
    res.json({ success: true });
  },

  // ── Detection ─────────────────────────────────────────────────────────────
  async detectCountry(req: Request, res: Response): Promise<void> {
    const { lat, lng } = req.body as { lat?: number; lng?: number };
    const detection = CountryDetectionService.fromRequest(req);

    // If GPS provided, prioritize it
    if (lat != null && lng != null) {
      const gpsCountry = CountryDetectionService.fromGPS(Number(lat), Number(lng));
      const config     = await CountryConfigService.getConfig(gpsCountry);
      res.json({ success: true, data: {
        country: gpsCountry, detectedFrom: 'gps', confidence: 95,
        config, appLabel: CountryConfigService.getAppLabel(gpsCountry),
      }});
      return;
    }

    const config = await CountryConfigService.getConfig(detection.country);
    res.json({ success: true, data: {
      ...detection,
      config,
      appLabel: CountryConfigService.getAppLabel(detection.country),
    }});
  },

  // ── Format examples ───────────────────────────────────────────────────────
  async getFormatExamples(req: Request, res: Response): Promise<void> {
    const code   = String(req.params['code'] ?? '').toUpperCase();
    const config = await CountryConfigService.getConfig(code);
    if (!config) { res.status(404).json({ error: 'Peyi pa jwenn' }); return; }
    const examples = LocalizationService.getFormatExamples(config);
    res.json({ success: true, data: examples });
  },

  // ── Cross-border ──────────────────────────────────────────────────────────
  async confirmCrossBorder(req: Request, res: Response): Promise<void> {
    const userId  = uid(req);
    const { eventId, country } = req.body as { eventId?: string; country?: string };
    if (!eventId || !country) { res.status(400).json({ error: 'eventId, country obligatwa' }); return; }

    await CrossBorderService.confirm(eventId, userId);
    const ctx = await CountryContextEngine.confirmContext(userId, country.toUpperCase());
    res.json({ success: true, data: ctx, appLabel: CountryConfigService.getAppLabel(country) });
  },

  async dismissCrossBorder(req: Request, res: Response): Promise<void> {
    const userId  = uid(req);
    const { eventId } = req.body as { eventId?: string };
    if (!eventId) { res.status(400).json({ error: 'eventId obligatwa' }); return; }
    await CrossBorderService.dismiss(eventId, userId);
    res.json({ success: true });
  },

  async getCrossBorderHistory(req: Request, res: Response): Promise<void> {
    const userId = uid(req);
    const events = await CrossBorderService.listForUser(userId);
    res.json({ success: true, data: events });
  },

  // ── Country features (admin) ───────────────────────────────────────────────
  async updateCountryFeatures(req: Request, res: Response): Promise<void> {
    const code    = String(req.params['code'] ?? '').toUpperCase();
    const updates = req.body as Record<string, boolean>;
    await CountryConfigService.updateFeatures(code, updates);
    res.json({ success: true });
  },

  // ── Analytics (admin) ─────────────────────────────────────────────────────
  async getAnalytics(_req: Request, res: Response): Promise<void> {
    const [stats, top] = await Promise.all([
      CountryAnalyticsService.getStats(),
      CountryAnalyticsService.topCountriesByUsers(10),
    ]);
    res.json({ success: true, data: { stats, topByUsers: top } });
  },

  async getCountryTrend(req: Request, res: Response): Promise<void> {
    const code  = String(req.params['code'] ?? '').toUpperCase();
    const trend = await CountryAnalyticsService.getTrend(code);
    res.json({ success: true, data: trend });
  },
};