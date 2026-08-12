import { locGet, locPut } from './localizationApi.js';

export interface BusinessHours {
  id:               string;
  country_id:       string | null;
  entity_id:        string | null;
  timezone_id:      string | null;
  day_of_week:      number;  // 1=Monday … 7=Sunday
  opens_at:         string | null;
  closes_at:        string | null;
  is_24_hours:      boolean;
  crosses_midnight: boolean;
  is_closed:        boolean;
  break_start:      string | null;
  break_end:        string | null;
}

export interface WorkingDay {
  id:             string;
  country_id:     string | null;
  entity_id:      string | null;
  day_of_week:    number;
  is_working_day: boolean;
  is_half_day:    boolean;
  half_day_start: string | null;
  half_day_end:   string | null;
}

const DAY_LABELS: Record<number, string> = {
  1: 'Lendi', 2: 'Madi', 3: 'Mèkredi', 4: 'Jedi',
  5: 'Vandredi', 6: 'Samdi', 7: 'Dimanch',
};

export const businessHoursService = {
  listForEntity(entityId: string): Promise<{ success: boolean; data: BusinessHours[] }> {
    return locGet<BusinessHours[]>(`/business-hours?entityId=${encodeURIComponent(entityId)}`);
  },

  listForCountry(countryId: string): Promise<{ success: boolean; data: BusinessHours[] }> {
    return locGet<BusinessHours[]>(`/business-hours?countryId=${encodeURIComponent(countryId)}`);
  },

  checkIsOpen(entityId: string, offsetMinutes = 0): Promise<{
    success: boolean;
    data: { isOpen: boolean; checkedAt: string };
  }> {
    return locGet(`/business-hours/open?entityId=${encodeURIComponent(entityId)}&offsetMinutes=${offsetMinutes}`);
  },

  listWorkingDays(opts: { countryId?: string; entityId?: string }): Promise<{ success: boolean; data: WorkingDay[] }> {
    const params = new URLSearchParams();
    if (opts.countryId) params.set('countryId', opts.countryId);
    if (opts.entityId)  params.set('entityId',  opts.entityId);
    return locGet<WorkingDay[]>(`/working-days?${params.toString()}`);
  },

  upsertBusinessHours(
    rows: Omit<BusinessHours, 'id'>[],
    token: string,
  ): Promise<{ success: boolean; data: BusinessHours[] }> {
    return locPut<BusinessHours[]>('/business-hours', rows, token);
  },

  upsertWorkingDays(
    rows: Omit<WorkingDay, 'id'>[],
    token: string,
  ): Promise<{ success: boolean; data: WorkingDay[] }> {
    return locPut<WorkingDay[]>('/working-days', rows, token);
  },

  dayLabel(dayOfWeek: number): string {
    return DAY_LABELS[dayOfWeek] ?? String(dayOfWeek);
  },

  formatHours(h: BusinessHours): string {
    if (h.is_closed)   return 'Fèmen';
    if (h.is_24_hours) return '24/7';
    if (!h.opens_at || !h.closes_at) return '—';
    return `${h.opens_at.slice(0, 5)} – ${h.closes_at.slice(0, 5)}`;
  },
};
