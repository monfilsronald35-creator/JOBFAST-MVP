import { supabase } from '../../lib/supabase';
import type {
  AiUsageLog,
  AiPermission,
  AiOmniMatch,
  AiNeuralConversation,
  AiDynamicPricingNode,
  AiAutomationRule,
} from '../../types/ai';

// Phase 16 Omniverse AI Intelligence & Autonomous Neural Platform
//
// Backend-only tables (zero functions here):
//   ai_semantic_embeddings  — primary_vector(1536) = NEVER; ~12KB/row; HNSW server-side only
//   event_tracking          — ip_address = NEVER (PII); payload = JSONB raw event stream
//   ai_fraud_risk_scores    — ai_risk_score = NEVER; risk_factors_payload = ABSOLUTE NEVER
//                             (all fraud detection signals; exposing enables detection evasion)
//
// Schema note — ai_models:
//   CREATE TABLE IF NOT EXISTS; may be a no-op if table already exists from a prior foundational
//   migration. The existing AiModel interface in types/ai.ts covers that schema.

// ── Column constants ───────────────────────────────────────────────────────

const AI_USAGE_LOG_COLS = 'id, user_id, model_name, tokens_input, tokens_output, latency_ms, cost_usd, created_at';

const AI_PERMISSION_COLS = 'id, user_role, allowed_ai_feature, is_enabled, daily_token_limit, updated_at';

const AI_OMNI_MATCH_COLS = 'id, target_user_id, matched_entity_type, matched_entity_id, match_score_percentage, distance_meters, is_acted_upon, action_result_status, created_at';
// ai_reasoning_breakdown excluded — JSONB with no type contract; includes behavioral_compatibility
// scoring which would reveal and enable gaming of the matching algorithm

const AI_CONVERSATION_COLS = 'id, session_id, user_id, interaction_type, input_language, user_input_text, ai_response_text, voice_audio_url, created_at';
// translation_cache_payload excluded — internal translation cache; JSONB no type contract
// user_sentiment excluded — AI behavioral sentiment signal; enables gaming
// ai_extracted_intent excluded — internal AI inference; reveals detection categories
// intent_confidence_score excluded — NEVER (AI confidence scoring signal)
// metadata excluded — JSONB no type contract

const AI_PRICING_COLS = 'id, category_id, geo_node_target, current_demand_index, current_supply_index, suggested_price_multiplier, ai_pricing_explanation, updated_at';
// forecasted_market_trend excluded — JSONB no type contract; reveals internal revenue strategy

const AI_AUTOMATION_COLS = 'id, owner_id, automation_context, trigger_event, action_to_take, is_active, execution_count, success_rate_percentage, last_executed_at, created_at, updated_at';
// rule_parameters excluded — JSONB with no type contract; may contain sensitive config

// ── Row types ─────────────────────────────────────────────────────────────

type AiUsageLogRow = { id: string; user_id: string | null; model_name: string; tokens_input: number; tokens_output: number; latency_ms: number; cost_usd: number; created_at: string; };
type AiPermissionRow = { id: string; user_role: string; allowed_ai_feature: string; is_enabled: boolean; daily_token_limit: number; updated_at: string; };
type AiOmniMatchRow = { id: string; target_user_id: string; matched_entity_type: string; matched_entity_id: string; match_score_percentage: number; distance_meters: number; is_acted_upon: boolean; action_result_status: string; created_at: string; };
type AiConversationRow = { id: string; session_id: string; user_id: string | null; interaction_type: string; input_language: string; user_input_text: string | null; ai_response_text: string | null; voice_audio_url: string | null; created_at: string; };
type AiPricingRow = { id: string; category_id: string; geo_node_target: string; current_demand_index: number; current_supply_index: number; suggested_price_multiplier: number; ai_pricing_explanation: string | null; updated_at: string; };
type AiAutomationRow = { id: string; owner_id: string; automation_context: string; trigger_event: string; action_to_take: string; is_active: boolean; execution_count: number; success_rate_percentage: number; last_executed_at: string | null; created_at: string; updated_at: string; };

// ── Mappers ───────────────────────────────────────────────────────────────

const mapAiUsageLog = (r: AiUsageLogRow): AiUsageLog => ({ id: r.id, userId: r.user_id, modelName: r.model_name, tokensInput: r.tokens_input, tokensOutput: r.tokens_output, latencyMs: r.latency_ms, costUsd: r.cost_usd, createdAt: r.created_at });
const mapAiPermission = (r: AiPermissionRow): AiPermission => ({ id: r.id, userRole: r.user_role, allowedAiFeature: r.allowed_ai_feature, isEnabled: r.is_enabled, dailyTokenLimit: r.daily_token_limit, updatedAt: r.updated_at });
const mapAiOmniMatch = (r: AiOmniMatchRow): AiOmniMatch => ({ id: r.id, targetUserId: r.target_user_id, matchedEntityType: r.matched_entity_type, matchedEntityId: r.matched_entity_id, matchScorePercentage: r.match_score_percentage, distanceMeters: r.distance_meters, isActedUpon: r.is_acted_upon, actionResultStatus: r.action_result_status, createdAt: r.created_at });
const mapAiConversation = (r: AiConversationRow): AiNeuralConversation => ({ id: r.id, sessionId: r.session_id, userId: r.user_id, interactionType: r.interaction_type, inputLanguage: r.input_language, userInputText: r.user_input_text, aiResponseText: r.ai_response_text, voiceAudioUrl: r.voice_audio_url, createdAt: r.created_at });
const mapAiPricing = (r: AiPricingRow): AiDynamicPricingNode => ({ id: r.id, categoryId: r.category_id, geoNodeTarget: r.geo_node_target, currentDemandIndex: r.current_demand_index, currentSupplyIndex: r.current_supply_index, suggestedPriceMultiplier: r.suggested_price_multiplier, aiPricingExplanation: r.ai_pricing_explanation, updatedAt: r.updated_at });
const mapAiAutomation = (r: AiAutomationRow): AiAutomationRule => ({ id: r.id, ownerId: r.owner_id, automationContext: r.automation_context, triggerEvent: r.trigger_event, actionToTake: r.action_to_take, isActive: r.is_active, executionCount: r.execution_count, successRatePercentage: r.success_rate_percentage, lastExecutedAt: r.last_executed_at, createdAt: r.created_at, updatedAt: r.updated_at });

// ── AI Usage Logs ─────────────────────────────────────────────────────────

export async function getMyAiUsageLogs(options: { modelName?: string; from?: string; to?: string; limit?: number } = {}): Promise<AiUsageLog[]> {
  // RLS filters to current user's logs
  let q = supabase.from('ai_usage_logs').select(AI_USAGE_LOG_COLS);
  if (options.modelName) q = q.eq('model_name', options.modelName);
  if (options.from) q = q.gte('created_at', options.from);
  if (options.to) q = q.lte('created_at', options.to);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 100);
  if (error) throw error;
  return (data as unknown as AiUsageLogRow[]).map(mapAiUsageLog);
}

// ── AI Permissions ────────────────────────────────────────────────────────

export async function getAiPermissions(): Promise<AiPermission[]> {
  const { data, error } = await supabase.from('ai_permissions').select(AI_PERMISSION_COLS).order('user_role').order('allowed_ai_feature');
  if (error) throw error;
  return (data as unknown as AiPermissionRow[]).map(mapAiPermission);
}

export async function getAiPermissionsForRole(userRole: string): Promise<AiPermission[]> {
  const { data, error } = await supabase.from('ai_permissions').select(AI_PERMISSION_COLS).eq('user_role', userRole).eq('is_enabled', true).order('allowed_ai_feature');
  if (error) throw error;
  return (data as unknown as AiPermissionRow[]).map(mapAiPermission);
}

// ── AI Omni Matches ───────────────────────────────────────────────────────

export async function getMyMatches(options: { entityType?: string; minScore?: number; actedUpon?: boolean; limit?: number } = {}): Promise<AiOmniMatch[]> {
  // RLS filters to current user as target_user_id
  let q = supabase.from('ai_omni_matches').select(AI_OMNI_MATCH_COLS);
  if (options.entityType) q = q.eq('matched_entity_type', options.entityType);
  if (options.minScore !== undefined) q = q.gte('match_score_percentage', options.minScore);
  if (options.actedUpon !== undefined) q = q.eq('is_acted_upon', options.actedUpon);
  const { data, error } = await q.order('match_score_percentage', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as AiOmniMatchRow[]).map(mapAiOmniMatch);
}

export async function getTopMatches(userId: string, limit = 10): Promise<AiOmniMatch[]> {
  const { data, error } = await supabase.from('ai_omni_matches').select(AI_OMNI_MATCH_COLS).eq('target_user_id', userId).eq('is_acted_upon', false).gte('match_score_percentage', 85).order('match_score_percentage', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data as unknown as AiOmniMatchRow[]).map(mapAiOmniMatch);
}

// ── AI Neural Conversations ───────────────────────────────────────────────

export async function getConversationHistory(sessionId: string, options: { limit?: number } = {}): Promise<AiNeuralConversation[]> {
  const { data, error } = await supabase.from('ai_neural_conversations').select(AI_CONVERSATION_COLS).eq('session_id', sessionId).order('created_at', { ascending: true }).limit(options.limit ?? 200);
  if (error) throw error;
  return (data as unknown as AiConversationRow[]).map(mapAiConversation);
}

export async function getMyConversations(options: { limit?: number; before?: string } = {}): Promise<AiNeuralConversation[]> {
  // RLS filters to current user
  let q = supabase.from('ai_neural_conversations').select(AI_CONVERSATION_COLS);
  if (options.before) q = q.lt('created_at', options.before);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(options.limit ?? 50);
  if (error) throw error;
  return (data as unknown as AiConversationRow[]).map(mapAiConversation);
}

// ── AI Dynamic Pricing ────────────────────────────────────────────────────

export async function getPricingForCategory(categoryId: string): Promise<AiDynamicPricingNode[]> {
  const { data, error } = await supabase.from('ai_dynamic_pricing_nodes').select(AI_PRICING_COLS).eq('category_id', categoryId).order('geo_node_target');
  if (error) throw error;
  return (data as unknown as AiPricingRow[]).map(mapAiPricing);
}

export async function getPricingForGeoNode(geoNodeTarget: string): Promise<AiDynamicPricingNode | null> {
  const { data, error } = await supabase.from('ai_dynamic_pricing_nodes').select(AI_PRICING_COLS).eq('geo_node_target', geoNodeTarget).maybeSingle();
  if (error) throw error;
  return data ? mapAiPricing(data as unknown as AiPricingRow) : null;
}

// ── AI Automation Rules ───────────────────────────────────────────────────

export async function getMyAutomationRules(options: { context?: string; activeOnly?: boolean } = {}): Promise<AiAutomationRule[]> {
  // RLS filters to current user as owner_id
  let q = supabase.from('ai_automation_rules').select(AI_AUTOMATION_COLS);
  if (options.context) q = q.eq('automation_context', options.context);
  if (options.activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as AiAutomationRow[]).map(mapAiAutomation);
}

export async function getAutomationRule(id: string): Promise<AiAutomationRule | null> {
  const { data, error } = await supabase.from('ai_automation_rules').select(AI_AUTOMATION_COLS).eq('id', id).single();
  if (error) throw error;
  return data ? mapAiAutomation(data as unknown as AiAutomationRow) : null;
}
