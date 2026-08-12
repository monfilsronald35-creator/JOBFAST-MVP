import type { Request, Response } from 'express';
import { TimezoneService }      from '../services/TimezoneService.js';
import { WorkingDaysService }   from '../services/WorkingDaysService.js';
import { BusinessHoursService } from '../services/BusinessHoursService.js';
import { HolidayService }       from '../services/HolidayService.js';
import { MeasurementService }   from '../services/MeasurementService.js';

export const LocalizationController004 = {
  // ── Timezones ──────────────────────────────────────────────────────────────
  async listTimezones(req: Request, res: Response): Promise<void> {
    const { countryId } = req.query as { countryId?: string };
    const data = countryId
      ? await TimezoneService.listByCountry(countryId)
      : await TimezoneService.listActive();
    res.json({ success: true, data });
  },

  async getTimezone(req: Request, res: Response): Promise<void> {
    const id   = String(req.params['id'] ?? '');
    const data = await TimezoneService.getById(id);
    if (!data) { res.status(404).json({ error: 'Timezone pa jwenn' }); return; }
    res.json({ success: true, data });
  },

  async getDstRules(req: Request, res: Response): Promise<void> {
    const timezoneId = String(req.params['id'] ?? '');
    const year       = req.query['year'] ? Number(req.query['year']) : undefined;
    const data       = await TimezoneService.getDstRules(timezoneId, year);
    res.json({ success: true, data });
  },

  // ── Working Days ──────────────────────────────────────────────────────────
  async listWorkingDays(req: Request, res: Response): Promise<void> {
    const { countryId, entityId } = req.query as { countryId?: string; entityId?: string };
    if (!countryId && !entityId) {
      res.status(400).json({ error: 'countryId oswa entityId obligatwa' });
      return;
    }
    const data = entityId
      ? await WorkingDaysService.listByEntity(entityId)
      : await WorkingDaysService.listByCountry(countryId!);
    res.json({ success: true, data });
  },

  async upsertWorkingDays(req: Request, res: Response): Promise<void> {
    const rows = req.body as Parameters<typeof WorkingDaysService.upsert>[0];
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: 'Array de working days obligatwa' });
      return;
    }
    const data = await WorkingDaysService.upsert(rows);
    res.json({ success: true, data });
  },

  // ── Business Hours ────────────────────────────────────────────────────────
  async listBusinessHours(req: Request, res: Response): Promise<void> {
    const { entityId, countryId } = req.query as { entityId?: string; countryId?: string };
    if (!entityId && !countryId) {
      res.status(400).json({ error: 'entityId oswa countryId obligatwa' });
      return;
    }
    const data = entityId
      ? await BusinessHoursService.listByEntity(entityId)
      : await BusinessHoursService.listByCountry(countryId!);
    res.json({ success: true, data });
  },

  async upsertBusinessHours(req: Request, res: Response): Promise<void> {
    const rows = req.body as Parameters<typeof BusinessHoursService.upsert>[0];
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: 'Array de business hours obligatwa' });
      return;
    }
    const data = await BusinessHoursService.upsert(rows);
    res.json({ success: true, data });
  },

  async checkIsOpen(req: Request, res: Response): Promise<void> {
    const { entityId, offsetMinutes } = req.query as { entityId?: string; offsetMinutes?: string };
    if (!entityId) { res.status(400).json({ error: 'entityId obligatwa' }); return; }

    const hours  = await BusinessHoursService.listByEntity(entityId);
    const offset = offsetMinutes ? Number(offsetMinutes) : 0;
    const isOpen = BusinessHoursService.isOpenNow(hours, offset);
    res.json({ success: true, data: { isOpen, checkedAt: new Date().toISOString() } });
  },

  // ── Holidays ───────────────────────────────────────────────────────────────
  async listHolidays(req: Request, res: Response): Promise<void> {
    const { countryId, year, scope } = req.query as {
      countryId?: string; year?: string; scope?: string;
    };
    if (!countryId) { res.status(400).json({ error: 'countryId obligatwa' }); return; }

    const data = await HolidayService.listByCountry(countryId, {
      year: year ? Number(year) : undefined,
      scope,
    });
    res.json({ success: true, data });
  },

  async isHoliday(req: Request, res: Response): Promise<void> {
    const { countryId, date } = req.query as { countryId?: string; date?: string };
    if (!countryId || !date) {
      res.status(400).json({ error: 'countryId ak date obligatwa' });
      return;
    }
    const isHoliday = await HolidayService.isHoliday(countryId, date);
    res.json({ success: true, data: { isHoliday, date, countryId } });
  },

  async searchHolidays(req: Request, res: Response): Promise<void> {
    const { countryId, q } = req.query as { countryId?: string; q?: string };
    if (!countryId || !q) {
      res.status(400).json({ error: 'countryId ak q obligatwa' });
      return;
    }
    const data = await HolidayService.search(countryId, q);
    res.json({ success: true, data });
  },

  // ── Measurement ───────────────────────────────────────────────────────────
  async listMeasurementSystems(_req: Request, res: Response): Promise<void> {
    const data = await MeasurementService.listSystems();
    res.json({ success: true, data });
  },

  async listMeasurementUnits(req: Request, res: Response): Promise<void> {
    const { category, systemId } = req.query as { category?: string; systemId?: string };
    const data = await MeasurementService.listUnits({ category, systemId });
    res.json({ success: true, data });
  },

  async getMeasurementUnit(req: Request, res: Response): Promise<void> {
    const id   = String(req.params['id'] ?? '');
    const data = await MeasurementService.getUnit(id);
    if (!data) { res.status(404).json({ error: 'Unité pa jwenn' }); return; }
    res.json({ success: true, data });
  },

  async getCountryMeasurementPreferences(req: Request, res: Response): Promise<void> {
    const countryId = String(req.params['countryId'] ?? '');
    const data      = await MeasurementService.getCountryPreferences(countryId);
    res.json({ success: true, data });
  },

  async convertUnit(req: Request, res: Response): Promise<void> {
    const { value, fromId, toId } = req.body as {
      value?: number; fromId?: string; toId?: string;
    };
    if (value == null || !fromId || !toId) {
      res.status(400).json({ error: 'value, fromId, toId obligatwa' });
      return;
    }

    const [from, to] = await Promise.all([
      MeasurementService.getUnit(fromId),
      MeasurementService.getUnit(toId),
    ]);
    if (!from) { res.status(404).json({ error: 'fromId pa jwenn' }); return; }
    if (!to)   { res.status(404).json({ error: 'toId pa jwenn' });   return; }

    const result = MeasurementService.convert(value, from, to);
    res.json({ success: true, data: { input: value, output: result, from: from.symbol, to: to.symbol } });
  },
};
