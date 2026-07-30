import type { ProviderName, ProviderCategory, ProviderStatus, PaymentStatus } from './payment.types.js';

export interface ProviderConfig {
  id:                  string;
  name:                ProviderName;
  category:            ProviderCategory;
  status:              ProviderStatus;
  supportedCountries:  string[];
  supportedCurrencies: string[];
  supportedMethods:    string[];
  feePercentage:       number;
  flatFee:             number;
  avgSuccessRate:      number;
  avgLatencyMs:        number;
  priority:            number;
  config:              Record<string, unknown>;
  createdAt:           string;
  updatedAt:           string;
}

export interface RouteScore {
  provider:           ProviderName;
  score:              number;
  successRate:        number;
  costScore:          number;
  speedScore:         number;
  availabilityScore:  number;
  isAvailable:        boolean;
}

export interface ProviderResult {
  success:          boolean;
  providerTxId?:    string | undefined;
  status:           PaymentStatus;
  errorCode?:       string | undefined;
  errorMessage?:    string | undefined;
  requires3DS?:     boolean | undefined;
  clientSecret?:    string | undefined;
  rawResponse?:     Record<string, unknown> | undefined;
  fee?:             number | undefined;
}

export interface RouteDecision {
  selectedProvider: ProviderName;
  candidates:       RouteScore[];
  reason:           string;
}
