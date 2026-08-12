export const COUNTRY_STATUSES = [
  'active',
  'inactive',
  'coming_soon',
  'blocked',
] as const;

export type CountryStatus = typeof COUNTRY_STATUSES[number];

export interface Country {
  id: string;

  iso2: string;
  iso3: string;
  countryCode: string;

  name: string;
  nativeName: string | null;

  phoneCode: string | null;
  phoneFormat: string | null;

  continent: string | null;
  region: string | null;
  subregion: string | null;

  defaultLanguage: string | null;
  defaultCurrency: string | null;

  timezone: string;
  locale: string | null;

  isSupported: boolean;
  isActive: boolean;

  status: CountryStatus;

  flagEmoji: string | null;

  createdAt: string;
  updatedAt: string;

  deletedAt: string | null;

  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
}
