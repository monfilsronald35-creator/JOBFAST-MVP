export type DetectionSource =
  | 'device_locale' | 'gps' | 'ip' | 'sim' | 'user_selected' | 'default';

export interface CountryContext {
  country:           string;   // ISO 3166-1 alpha-2
  region?:           string;
  state?:            string;
  city?:             string;
  timeZone:          string;
  currency:          string;
  language:          string;   // BCP 47 (e.g. 'ht', 'es', 'en')
  preferredLang?:    string;
  legalRegion?:      string;
  taxRegion?:        string;
  gpsRegion?:        string;
  telecomRegion?:    string;
  bankingRegion?:    string;
  marketplaceRegion?: string;
  detectedFrom:      DetectionSource;
  confirmedAt?:      string;   // ISO timestamp when user confirmed
}

export interface NumberFormatConfig {
  decimalSeparator:  '.' | ',';
  thousandSeparator: ',' | '.' | ' ';
  currencyPosition:  'before' | 'after';
}

export interface EmergencyNumbers {
  police:    string;
  fire:      string;
  ambulance: string;
  general?:  string;
}

export interface CountryConfig {
  code:              string;
  name:              string;
  nativeName:        string;
  flag:              string;   // emoji
  currency:          string;
  languages:         string[];
  primaryLanguage:   string;
  timeZone:          string;
  callingCode:       string;
  emergencyNumbers:  EmergencyNumbers;
  banks:             string[];
  wallets:           string[];
  telecomProviders:  string[];
  paymentMethods:    string[];
  taxRate:           number;   // percentage 0-100
  vatRate:           number;
  dateFormat:        string;   // e.g. 'DD/MM/YYYY'
  timeFormat:        '24h' | '12h';
  numberFormat:      NumberFormatConfig;
  addressFormat:     string[];
  minAge:            number;
  governmentApis:    boolean;
  legalNotes?:       string;
  active:            boolean;
}

export interface CountryFeatures {
  country:     string;
  wallet:      boolean;
  telecom:     boolean;
  travel:      boolean;
  marketplace: boolean;
  healthcare:  boolean;
  government:  boolean;
  ai:          boolean;
  enterprise:  boolean;
  maps:        boolean;
}

export interface CrossBorderEvent {
  id:          string;
  userId:      string;
  fromCountry: string;
  toCountry:   string;
  detectedAt:  string;
  confirmed:   boolean;
}

export interface CountryStats {
  country:      string;
  users:        number;
  jobs:         number;
  revenue:      number;   // HTG minor units
  orders:       number;
}

// What gets attached to req by localizationMiddleware
export interface LocalizationContext {
  ctx:      CountryContext;
  config:   CountryConfig;
  features: CountryFeatures;
}