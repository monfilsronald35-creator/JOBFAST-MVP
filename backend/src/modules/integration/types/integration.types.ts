export type PartnerType =
  | 'bank' | 'telecom' | 'hotel' | 'airline' | 'insurance'
  | 'marketplace' | 'erp' | 'crm' | 'enterprise' | 'startup'
  | 'developer' | 'government' | 'courier' | 'healthcare' | 'other';

export type PartnerTier = 'standard' | 'premium' | 'enterprise';
export type PartnerStatus = 'active' | 'suspended' | 'pending';

export type IntegrationScope =
  | 'jobs:read'   | 'jobs:write'
  | 'marketplace:read' | 'marketplace:write'
  | 'wallet:read' | 'wallet:write'
  | 'payments:read' | 'payments:write'
  | 'users:read'
  | 'notifications:read'
  | 'ai:query'
  | 'travel:read' | 'travel:write'
  | 'telecom:read' | 'telecom:write'
  | 'healthcare:read'
  | 'government:read'
  | 'analytics:read'
  | 'webhooks:manage'
  | 'admin:read'  | 'admin:write';

export const ALL_SCOPES: IntegrationScope[] = [
  'jobs:read', 'jobs:write', 'marketplace:read', 'marketplace:write',
  'wallet:read', 'wallet:write', 'payments:read', 'payments:write',
  'users:read', 'notifications:read', 'ai:query',
  'travel:read', 'travel:write', 'telecom:read', 'telecom:write',
  'healthcare:read', 'government:read', 'analytics:read',
  'webhooks:manage', 'admin:read', 'admin:write',
];

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  tier: PartnerTier;
  status: PartnerStatus;
  country?: string;
  contactEmail?: string;
  website?: string;
  allowedScopes: IntegrationScope[];
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface APIKey {
  id: string;
  partnerId: string;
  keyPrefix: string;
  name: string;
  scopes: IntegrationScope[];
  rateLimitPerMin: number;
  rateLimitPerDay: number;
  active: boolean;
  expiresAt?: number;
  lastUsedAt?: number;
  createdAt: number;
}

export interface APIKeyData {
  keyId: string;
  partnerId: string;
  scopes: IntegrationScope[];
  rateLimitPerMin: number;
  rateLimitPerDay: number;
}

export interface Webhook {
  id: string;
  partnerId: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: number;
}

export type WebhookDeliveryStatus = 'delivered' | 'failed' | 'pending' | 'retrying';

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventName: string;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  attemptCount: number;
  status: WebhookDeliveryStatus;
  deliveredAt?: number;
  failedAt?: number;
  createdAt: number;
}

export interface OAuthClient {
  id: string;
  clientId: string;
  name: string;
  redirectUris: string[];
  allowedScopes: IntegrationScope[];
  grantTypes: string[];
  partnerId?: string;
  active: boolean;
  createdAt: number;
}

export interface UsageLog {
  id: string;
  apiKeyId?: string;
  partnerId?: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  latencyMs?: number;
  createdAt: number;
}

export interface PartnerUsageStats {
  partnerId: string;
  partnerName: string;
  requestsToday: number;
  requestsTotal: number;
  avgLatencyMs: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  lastActive?: number;
}
