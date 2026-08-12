// ── AI Model Foundation ────────────────────────────────────────────────────

export const AI_MODEL_TYPES = [
  'llm', 'embedding', 'vision', 'audio', 'moderation', 'rerank',
] as const;
export type AiModelType = typeof AI_MODEL_TYPES[number];

export interface AiModel {
  id: string;
  modelCode: string;
  displayName: string;
  modelType: AiModelType;
  isActive: boolean;
  createdAt: string;
}

export interface AiModelVersion {
  id: string;
  modelId: string;
  versionTag: string;
  contextWindow: number;
  maxOutputTokens: number;
  isDefault: boolean;
  createdAt: string;
}

export interface AiModelProvider {
  id: string;
  providerName: string;
  baseUrl: string;
  isActive: boolean;
  createdAt: string;
  // ai_provider_credentials (encrypted_secret) excluded — backend only
}

export interface AiModelCapability {
  id: string;
  modelId: string;
  capabilityName: string;
  parametersConfig: Record<string, unknown>;
}

// ── AI Prompts (catalog metadata only) ────────────────────────────────────

export interface AiPrompt {
  id: string;
  promptKey: string;
  description: string | null;
  createdAt: string;
  // ai_prompt_versions.system_prompt + user_prompt_template excluded — proprietary IP
}

export interface AiPromptCategory {
  id: string;
  categoryName: string;
  parentId: string | null;
}

// ── AI Requests & Responses ────────────────────────────────────────────────

export const AI_REQUEST_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export type AiRequestStatus = typeof AI_REQUEST_STATUSES[number];

export interface AiRequest {
  id: string;
  userId: string | null;
  modelId: string | null;
  requestPayload: Record<string, unknown>;
  status: AiRequestStatus;
  createdAt: string;
}

export interface AiResponse {
  id: string;
  requestId: string;
  outputText: string;
  tokensPrompt: number;
  tokensCompletion: number;
  executionTimeMs: number;
  createdAt: string;
}

export interface AiResponseFeedback {
  id: string;
  responseId: string;
  userId: string;
  isHelpful: boolean;
  comment: string | null;
  createdAt: string;
}

export interface AiResponseRating {
  id: string;
  responseId: string;
  ratingScore: number;
  createdAt: string;
}

// ── AI Memory (key-value store) ────────────────────────────────────────────

export interface AiMemory {
  id: string;
  userId: string;
  memoryKey: string;
  memoryValue: Record<string, unknown>;
  createdAt: string;
  // ai_memory_embeddings.embedding (vector 1536) excluded — ML infra
}

export interface AiMemorySession {
  id: string;
  userId: string;
  sessionTitle: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AiMemorySummary {
  id: string;
  sessionId: string;
  summaryText: string;
  createdAt: string;
}

export interface AiMemoryLink {
  id: string;
  sourceMemoryId: string;
  targetMemoryId: string;
  relationType: string;
}

// ── AI Recommendations ─────────────────────────────────────────────────────

export const AI_RECOMMENDATION_ACTIONS = ['clicked', 'ignored', 'converted', 'dismissed'] as const;
export type AiRecommendationAction = typeof AI_RECOMMENDATION_ACTIONS[number];

export interface AiRecommendation {
  id: string;
  userId: string;
  modelId: string;
  itemId: string;
  score: number;
  payload: Record<string, unknown>;
  createdAt: string;
  // ai_recommendation_models.algorithm_config excluded — proprietary
}

export interface AiRecommendationFeedback {
  id: string;
  recommendationId: string;
  userId: string;
  action: AiRecommendationAction;
  createdAt: string;
}

export interface AiRecommendationEvent {
  id: string;
  userId: string;
  eventType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ── AI Scores ─────────────────────────────────────────────────────────────

export const AI_SCORE_TYPES = [
  'trust', 'reputation', 'worker', 'employer', 'risk', 'marketplace',
] as const;
export type AiScoreType = typeof AI_SCORE_TYPES[number];

export interface AiScore {
  id: string;
  entityId: string;
  scoreType: AiScoreType;
  scoreValue: number;
  confidence: number;
  updatedAt: string;
  // ai_score_rules.weight_config excluded — proprietary algorithm
}

export interface AiScoreHistory {
  id: string;
  scoreId: string;
  oldValue: number;
  newValue: number;
  reason: string | null;
  recordedAt: string;
}

// ── AI Chat ────────────────────────────────────────────────────────────────

export const AI_SENDER_TYPES = ['user', 'assistant', 'system'] as const;
export type AiSenderType = typeof AI_SENDER_TYPES[number];

export interface AiChatSession {
  id: string;
  userId: string;
  sessionTitle: string | null;
  createdAt: string;
}

export interface AiChatMessage {
  id: string;
  sessionId: string;
  senderType: AiSenderType;
  messageText: string;
  tokensUsed: number;
  createdAt: string;
}

export interface AiChatContext {
  id: string;
  sessionId: string;
  contextKey: string;
  contextValue: Record<string, unknown>;
}

// ── AI Agents ─────────────────────────────────────────────────────────────

export const AI_EXECUTION_STATUSES = ['running', 'success', 'failed'] as const;
export type AiExecutionStatus = typeof AI_EXECUTION_STATUSES[number];

export interface AiAgent {
  id: string;
  agentCode: string;
  agentName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  // ai_agent_tools excluded — internal security config
  // ai_agent_workflows.workflow_steps excluded — internal IP
}

export interface AiAgentExecution {
  id: string;
  agentId: string;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown> | null;
  status: AiExecutionStatus;
  executedAt: string;
}

// ── AI Documents ───────────────────────────────────────────────────────────

export interface AiDocument {
  id: string;
  userId: string;
  documentUrl: string;
  fileType: string;
  status: string;
  createdAt: string;
  // ai_document_chunks + ai_document_embeddings excluded — ML infra / vector
}

export interface AiDocumentAnalysis {
  id: string;
  documentId: string;
  extractedData: Record<string, unknown>;
  confidenceScore: number;
  analyzedAt: string;
}

// ── AI Translation ─────────────────────────────────────────────────────────

export interface AiLanguageModel {
  id: string;
  languageCode: string;
  languageName: string;
}

export interface AiTranslation {
  id: string;
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  translatedText: string;
}

// ── AI Voice ───────────────────────────────────────────────────────────────

export interface AiVoiceRequest {
  id: string;
  userId: string;
  audioFileUrl: string;
  durationSeconds: number;
  createdAt: string;
}

export interface AiVoiceTranscription {
  id: string;
  voiceRequestId: string;
  transcript: string;
  confidence: number;
  createdAt: string;
}

export interface AiVoiceSynthesis {
  id: string;
  textInput: string;
  outputAudioUrl: string;
  voiceProfile: string;
  createdAt: string;
}

// ── AI Images ─────────────────────────────────────────────────────────────

export interface AiImage {
  id: string;
  userId: string;
  imageUrl: string;
  promptUsed: string | null;
  createdAt: string;
  // ai_image_embeddings.embedding (vector 512) excluded — ML infra
}

export interface AiImageAnalysis {
  id: string;
  imageId: string;
  tags: unknown[];
  description: string | null;
  analyzedAt: string;
}

export interface AiImageGeneration {
  id: string;
  prompt: string;
  generatedImageUrl: string;
  createdAt: string;
}

// ── AI Token Usage ─────────────────────────────────────────────────────────

export interface AiTokenUsage {
  id: string;
  userId: string;
  modelId: string;
  tokensConsumed: number;
  recordedAt: string;
  // ai_cost_tracking.cost_per_1k_tokens excluded — business sensitive
}

// ── Phase 16 Omniverse AI Intelligence & Autonomous Neural Platform ────────
//
// Backend-only tables (no frontend types):
//   ai_semantic_embeddings — primary_vector(1536) = NEVER (~12KB/row; HNSW server-side only);
//     embedding_model/embedding_version excluded (internal AI infrastructure);
//     semantic_context_payload excluded (JSONB contains confidence scoring)
//   event_tracking         — ip_address = NEVER (PII); payload = JSONB raw event data;
//                            internal analytics instrumentation
//   login_history          — ip_address = NEVER (PII); user_agent = NEVER (fingerprinting PII);
//                            audit log rule: always BACKEND ONLY
//   ai_fraud_risk_scores   — ai_risk_score = NEVER (AI behavioral scoring; enables gaming);
//                            risk_factors_payload = ABSOLUTE NEVER (all fraud detection signals:
//                            fake_profile_probability, payment_fraud_probability, bot_behavior_detected,
//                            suspicious_geo_hop, device_fingerprint_anomaly — exposing enables evasion)
//
// Schema note — ai_models:
//   Phase 16 CREATE TABLE IF NOT EXISTS; if table already exists from an earlier foundational
//   migration with a different schema (model_code, display_name, model_type), this is a no-op.
//   The existing AiModel interface above covers that schema.

// ── AI Usage Logs (Phase 16 — per-request billing log) ───────────────────

export interface AiUsageLog {
  id: string;
  userId: string | null;
  modelName: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  costUsd: number; // billing transparency — user and org-admin facing
  createdAt: string;
}

// ── AI Permissions Matrix ─────────────────────────────────────────────────

export interface AiPermission {
  id: string;
  userRole: string; // 'worker' | 'business' | 'enterprise' | 'admin'
  allowedAiFeature: string; // 'ai_job_assistant' | 'ai_hiring_agent' | 'ai_analytics_copilot'
  isEnabled: boolean;
  dailyTokenLimit: number;
  updatedAt: string;
}

// ── AI Omni Matches (Recommendation Engine) ───────────────────────────────

export interface AiOmniMatch {
  id: string;
  targetUserId: string;
  matchedEntityType: string; // 'job_post' | 'corporate_service' | 'user_profile'
  matchedEntityId: string;
  matchScorePercentage: number; // match relevance score — intentionally user-facing (like "90% match")
  distanceMeters: number;
  // ai_reasoning_breakdown excluded — JSONB with no type contract; includes behavioral_compatibility
  // scoring which would reveal and enable gaming of the matching algorithm
  isActedUpon: boolean;
  actionResultStatus: string;
  createdAt: string;
}

// ── AI Neural Conversations ───────────────────────────────────────────────

export interface AiNeuralConversation {
  id: string;
  sessionId: string;
  userId: string | null;
  interactionType: string;
  inputLanguage: string;
  userInputText: string | null;
  aiResponseText: string | null;
  voiceAudioUrl: string | null;
  // translation_cache_payload excluded — internal translation cache; JSONB no type contract
  // user_sentiment excluded — AI behavioral sentiment analysis signal; enables gaming content detection
  // ai_extracted_intent excluded — internal AI inference; reveals detection categories to bad actors
  // intent_confidence_score excluded — NEVER (AI confidence scoring signal; enables gaming)
  // metadata excluded — JSONB with no type contract
  createdAt: string;
}

// ── AI Dynamic Pricing Nodes ──────────────────────────────────────────────

export interface AiDynamicPricingNode {
  id: string;
  categoryId: string;
  geoNodeTarget: string; // geographic market identifier
  currentDemandIndex: number;
  currentSupplyIndex: number;
  suggestedPriceMultiplier: number;
  aiPricingExplanation: string | null; // human-readable explanation safe to display
  // forecasted_market_trend excluded — JSONB with no type contract; reveals internal
  // revenue optimization strategy and AI business forecasting internals
  updatedAt: string;
}

// ── AI Automation Rules ───────────────────────────────────────────────────

export interface AiAutomationRule {
  id: string;
  ownerId: string;
  automationContext: string; // 'hiring' | 'job_seeker' | 'payroll' | 'marketing'
  triggerEvent: string;
  actionToTake: string;
  // rule_parameters excluded — JSONB with no type contract; may contain sensitive config
  isActive: boolean;
  executionCount: number;
  successRatePercentage: number;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
