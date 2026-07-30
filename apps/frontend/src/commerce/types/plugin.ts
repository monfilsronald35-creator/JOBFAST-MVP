// ─── Plugin Marketplace Types ─────────────────────────────────────────────────

export type PluginCategory =
  | 'payment'
  | 'shipping'
  | 'fulfillment'
  | 'marketing'
  | 'analytics'
  | 'crm'
  | 'erp'
  | 'communication'
  | 'maps'
  | 'identity'
  | 'storage'
  | 'ai'
  | 'telecom'
  | 'government'
  | 'compliance'
  | 'other';

export type PluginStatus = 'active' | 'inactive' | 'error' | 'updating' | 'deprecated';

export interface PluginCapability {
  name:    string;
  version: string;
  method:  string;
}

export interface PluginManifest {
  id:           string;
  name:         string;
  version:      string;
  description:  string;
  author:       string;
  icon?:        string;
  category:     PluginCategory;
  countries?:   string[];
  capabilities: PluginCapability[];
  configSchema: PluginConfigField[];
  permissions:  string[];
  dependencies: string[];
  homepage?:    string;
  minPlatformVersion: string;
}

export interface PluginConfigField {
  key:        string;
  label:      string;
  type:       'text' | 'secret' | 'boolean' | 'select' | 'number' | 'url';
  required:   boolean;
  default?:   unknown;
  options?:   string[];
  hint?:      string;
}

export interface PluginInstance {
  id:           string;
  manifestId:   string;
  orgId?:       string;
  vendorId?:    string;
  status:       PluginStatus;
  config:       Record<string, unknown>;
  enabledAt?:   number;
  errorMessage?: string;
  lastUsedAt?:  number;
  usageCount:   number;
  metadata:     Record<string, unknown>;
}

export interface Plugin {
  manifest:  PluginManifest;
  instance?: PluginInstance;
  execute:   (capability: string, params: unknown) => Promise<unknown>;
  configure: (config: Record<string, unknown>) => Promise<void>;
  health?:   () => Promise<{ ok: boolean; message?: string }>;
  teardown?: () => Promise<void>;
}

export interface PluginHookContext {
  event:     string;
  data:      unknown;
  vendorId?: string;
  orgId?:    string;
  userId?:   string;
}

export interface ApiIntegration {
  id:          string;
  orgId:       string;
  vendorId?:   string;
  name:        string;
  type:        'rest' | 'graphql' | 'webhook' | 'grpc';
  baseUrl:     string;
  authType:    'api_key' | 'bearer' | 'oauth2' | 'basic' | 'none';
  authConfig:  Record<string, string>;
  headers:     Record<string, string>;
  rateLimit?:  { requests: number; windowMs: number };
  enabled:     boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  events:      string[];
  createdAt:   number;
  updatedAt:   number;
}

export interface ApiKey {
  id:           string;
  orgId:        string;
  vendorId?:    string;
  name:         string;
  keyHash:      string;
  keyPrefix:    string;
  permissions:  string[];
  rateLimit?:   { requests: number; windowMs: number };
  expiresAt?:   number;
  lastUsedAt?:  number;
  usageCount:   number;
  ipWhitelist?: string[];
  status:       'active' | 'revoked' | 'expired';
  createdAt:    number;
}

export interface WebhookEvent {
  id:         string;
  orgId:      string;
  vendorId?:  string;
  event:      string;
  payload:    unknown;
  signature:  string;
  endpoint:   string;
  status:     'pending' | 'delivered' | 'failed' | 'retrying';
  attempts:   number;
  nextRetry?: number;
  response?:  { status: number; body: string };
  createdAt:  number;
}