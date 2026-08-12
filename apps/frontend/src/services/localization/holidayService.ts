import { locGet } from './localizationApi.js';

export interface Holiday {
  id:                    string;
  country_id:            string;
  name:                  string;
  local_name:            string | null;
  holiday_date:          string;
  holiday_scope:         'national' | 'regional' | 'city' | 'company' | 'religious' | 'optional';
  holiday_type:          'public' | 'religious' | 'bank' | 'observance' | 'company';
  is_recurring_annually: boolean;
  is_working_holiday:    boolean;
  is_bank_closed:        boolean;
  is_government_closed:  boolean;
  is_school_closed:      boolean;
  description:           string | null;
  created_at:            string;
}

export const holidayService = {
  list(opts: {
    countryId: string;
    year?: number;
    scope?: string;
  }): Promise<{ success: boolean; data: Holiday[] }> {
    const params = new URLSearchParams({ countryId: opts.countryId });
    if (opts.year  != null) params.set('year',  String(opts.year));
    if (opts.scope)         params.set('scope', opts.scope);
    return locGet<Holiday[]>(`/holidays?${params.toString()}`);
  },

  isHoliday(countryId: string, date: string): Promise<{
    success: boolean;
    data: { isHoliday: boolean; date: string; countryId: string };
  }> {
    return locGet(`/holidays/check?countryId=${encodeURIComponent(countryId)}&date=${encodeURIComponent(date)}`);
  },

  search(countryId: string, query: string): Promise<{ success: boolean; data: Holiday[] }> {
    const params = new URLSearchParams({ countryId, q: query });
    return locGet<Holiday[]>(`/holidays/search?${params.toString()}`);
  },

  /** Format holiday date for display: "1 Janvier" / "January 1" */
  formatDate(dateStr: string, locale = 'fr-HT'): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
      day:   'numeric',
      month: 'long',
    });
  },
};
