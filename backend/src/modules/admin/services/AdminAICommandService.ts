import { db } from '../../../core/database/SupabaseClient.js';

export interface AIModelRouting {
  chat:             string;
  search:           string;
  recommendations:  string;
  analytics:        string;
  fraud:            string;
  document:         string;
  [key: string]:    string;
}

export interface AIConfig {
  modelRouting:     AIModelRouting;
  promptTemplates:  Record<string, string>;
  costLimits:       { daily_usd: number; monthly_usd: number };
  featuresEnabled:  Record<string, boolean>;
  updatedAt:        number;
  updatedBy?:       string;
}

export interface AICostReport {
  dailyUsd:   number;
  weeklyUsd:  number;
  monthlyUsd: number;
  byModel:    Record<string, number>;
  generatedAt: number;
}

let _configCache: AIConfig | null = null;
let _configCacheExp = 0;

export const AdminAICommandService = {
  async getConfig(): Promise<AIConfig> {
    if (_configCache && Date.now() < _configCacheExp) return _configCache;

    const { data } = await db.client()
      .from('adm_ai_config')
      .select('*')
      .eq('id', 'singleton')
      .single();

    _configCache = _mapConfig(data as Record<string, unknown> | null);
    _configCacheExp = Date.now() + 5 * 60 * 1000;
    return _configCache;
  },

  async updateModelRouting(actorId: string, routing: Partial<AIModelRouting>): Promise<AIConfig> {
    const current = await AdminAICommandService.getConfig();
    const newRouting = { ...current.modelRouting, ...routing };

    const { data, error } = await db.client()
      .from('adm_ai_config')
      .update({ model_routing: newRouting, updated_at: new Date().toISOString(), updated_by: actorId })
      .eq('id', 'singleton')
      .select()
      .single();
    if (error) throw error;

    _configCache = null;
    return _mapConfig(data as Record<string, unknown>);
  },

  async updatePromptTemplate(actorId: string, key: string, template: string): Promise<void> {
    const current = await AdminAICommandService.getConfig();
    const newTemplates = { ...current.promptTemplates, [key]: template };

    const { error } = await db.client()
      .from('adm_ai_config')
      .update({ prompt_templates: newTemplates, updated_at: new Date().toISOString(), updated_by: actorId })
      .eq('id', 'singleton');
    if (error) throw error;
    _configCache = null;
  },

  async updateCostLimits(actorId: string, limits: { daily_usd?: number; monthly_usd?: number }): Promise<void> {
    const current = await AdminAICommandService.getConfig();
    const newLimits = { ...current.costLimits, ...limits };

    const { error } = await db.client()
      .from('adm_ai_config')
      .update({ cost_limits: newLimits, updated_at: new Date().toISOString(), updated_by: actorId })
      .eq('id', 'singleton');
    if (error) throw error;
    _configCache = null;
  },

  async updateFeatureEnabled(actorId: string, feature: string, enabled: boolean): Promise<void> {
    const current = await AdminAICommandService.getConfig();
    const newFeatures = { ...current.featuresEnabled, [feature]: enabled };

    const { error } = await db.client()
      .from('adm_ai_config')
      .update({ features_enabled: newFeatures, updated_at: new Date().toISOString(), updated_by: actorId })
      .eq('id', 'singleton');
    if (error) throw error;
    _configCache = null;
  },

  async getCostReport(): Promise<AICostReport> {
    // Placeholder — would integrate with Anthropic API billing
    return {
      dailyUsd:   0,
      weeklyUsd:  0,
      monthlyUsd: 0,
      byModel:    {},
      generatedAt: Date.now(),
    };
  },
};

function _mapConfig(row: Record<string, unknown> | null): AIConfig {
  if (!row) {
    return {
      modelRouting:    { chat: 'claude-haiku-4-5-20251001', search: 'claude-haiku-4-5-20251001', recommendations: 'claude-sonnet-4-6', analytics: 'claude-sonnet-4-6', fraud: 'claude-sonnet-4-6', document: 'claude-sonnet-4-6' },
      promptTemplates: {},
      costLimits:      { daily_usd: 100, monthly_usd: 3000 },
      featuresEnabled: {},
      updatedAt:       0,
    };
  }

  const cfg: AIConfig = {
    modelRouting:    (row['model_routing']    as AIModelRouting)           ?? {},
    promptTemplates: (row['prompt_templates'] as Record<string, string>)   ?? {},
    costLimits:      (row['cost_limits']      as { daily_usd: number; monthly_usd: number }) ?? { daily_usd: 100, monthly_usd: 3000 },
    featuresEnabled: (row['features_enabled'] as Record<string, boolean>)  ?? {},
    updatedAt:       row['updated_at'] ? new Date(row['updated_at'] as string).getTime() : 0,
  };
  if (row['updated_by']) cfg.updatedBy = row['updated_by'] as string;
  return cfg;
}
