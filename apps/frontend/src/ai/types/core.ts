// ─── AI Platform Core Types ───────────────────────────────────────────────────

export type AIProviderId =
  | 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral' | 'deepseek' | 'local';

export type AIModelId =
  // OpenAI
  | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4.1' | 'gpt-4.1-mini' | 'o3' | 'o4-mini'
  // Anthropic
  | 'claude-opus-5' | 'claude-sonnet-5' | 'claude-haiku-4-5' | 'claude-fable-5'
  // Google
  | 'gemini-2.5-pro' | 'gemini-2.0-flash' | 'gemini-1.5-pro'
  // Meta
  | 'llama-3.3-70b' | 'llama-3.2-11b-vision' | 'llama-3.1-8b'
  // Mistral
  | 'mistral-large-2' | 'mistral-small-3' | 'codestral'
  // DeepSeek
  | 'deepseek-chat' | 'deepseek-reasoner' | 'deepseek-v3'
  // Local (Ollama)
  | 'local:llama3' | 'local:phi3' | 'local:mistral' | 'local:gemma' | 'local:qwen';

export type AICapability =
  | 'text' | 'vision' | 'audio' | 'code' | 'embedding'
  | 'stream' | 'function_calling' | 'json_mode' | 'long_context';

export type AIRoutingPriority = 'cost' | 'speed' | 'quality' | 'privacy';

export type AIRoutingStrategy = 'cheapest' | 'fastest' | 'best_quality' | 'balanced' | 'private';

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface AIContentPart {
  type:       'text' | 'image_url' | 'audio';
  text?:      string;
  imageUrl?:  string;
  audioData?: string; // base64
}

export interface AIMessage {
  role:        'system' | 'user' | 'assistant' | 'tool';
  content:     string | AIContentPart[];
  name?:       string;
  toolCallId?: string;
  timestamp?:  number;
}

// ─── Functions / Tools ────────────────────────────────────────────────────────

export interface AIFunction {
  name:        string;
  description: string;
  parameters:  Record<string, unknown>;
}

export interface AIToolCall {
  id:        string;
  function:  { name: string; arguments: string };
}

// ─── Request ──────────────────────────────────────────────────────────────────

export interface AIRequestContext {
  userId?:      string;
  sessionId?:   string;
  domain?:      string;
  language?:    string;
  country?:     string;
  userProfile?: unknown;
  location?:    { lat: number; lng: number };
}

export interface AIRequest {
  id?:           string;
  messages:      AIMessage[];
  systemPrompt?: string;
  model?:        AIModelId;
  provider?:     AIProviderId;
  priority?:     AIRoutingPriority;
  strategy?:     AIRoutingStrategy;
  maxTokens?:    number;
  temperature?:  number;
  topP?:         number;
  stream?:       boolean;
  functions?:    AIFunction[];
  responseFormat?: 'text' | 'json';
  context?:      AIRequestContext;
  cacheKey?:     string;
  budgetUSD?:    number;
  metadata?:     Record<string, unknown>;
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface AIResponse {
  id:           string;
  content:      string;
  model:        AIModelId;
  provider:     AIProviderId;
  inputTokens:  number;
  outputTokens: number;
  costUSD:      number;
  latencyMs:    number;
  cached:       boolean;
  toolCalls?:   AIToolCall[];
  metadata?:    Record<string, unknown>;
}

export interface AIStreamChunk {
  delta:    string;
  done:     boolean;
  model?:   AIModelId;
  metadata?: Record<string, unknown>;
}

// ─── Model config ─────────────────────────────────────────────────────────────

export interface AIModelConfig {
  id:                AIModelId;
  providerId:        AIProviderId;
  name:              string;
  contextWindow:     number;
  maxOutputTokens:   number;
  inputCostPer1k:    number;  // USD
  outputCostPer1k:   number;  // USD
  avgLatencyMs:      number;
  qualityScore:      number;  // 0-100
  capabilities:      AICapability[];
  supportsStreaming:  boolean;
  supportsVision:    boolean;
  supportsAudio:     boolean;
  localOnly:         boolean;
}

// ─── Provider interface ───────────────────────────────────────────────────────

export interface AIModelProvider {
  id:           AIProviderId;
  name:         string;
  models:       AIModelConfig[];
  available:    boolean;
  baseUrl:      string;

  chat(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): AsyncGenerator<AIStreamChunk>;
  embed(text: string, model?: string): Promise<number[]>;
  health(): Promise<boolean>;
}

// ─── Routing ──────────────────────────────────────────────────────────────────

export interface AIRoutingDecision {
  provider:    AIProviderId;
  model:       AIModelId;
  reason:      string;
  estimatedCost: number;
  estimatedLatency: number;
  scores:      { cost: number; speed: number; quality: number };
}

// ─── Memory ───────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  id:        string;
  sessionId: string;
  role:      'user' | 'assistant' | 'system';
  content:   string;
  model?:    AIModelId;
  tokens?:   number;
  costUSD?:  number;
  timestamp: number;
}

export interface MemoryFact {
  key:          string;
  value:        string;
  confidence:   number;
  extractedAt:  number;
  source:       string;
}

export interface AIUserMemory {
  userId:            string;
  facts:             MemoryFact[];
  preferences:       Record<string, unknown>;
  lastInteraction:   number;
  totalInteractions: number;
  updatedAt:         number;
}

// ─── Cost tracking ────────────────────────────────────────────────────────────

export interface AIUsageRecord {
  requestId:    string;
  userId?:      string;
  model:        AIModelId;
  provider:     AIProviderId;
  domain:       string;
  inputTokens:  number;
  outputTokens: number;
  costUSD:      number;
  latencyMs:    number;
  cached:       boolean;
  timestamp:    number;
}

export interface AIBudgetStatus {
  userId?:      string;
  dailyLimit:   number;
  dailyUsed:    number;
  monthlyLimit: number;
  monthlyUsed:  number;
  currency:     'USD';
}