// ─── Types ────────────────────────────────────────────────────────────────────
export * from './types';

// ─── Gateway & Core ───────────────────────────────────────────────────────────
export { AIGateway }          from './gateway/AIGateway';
export { AIRouter }           from './gateway/AIRouter';
export { AIMemory }           from './memory/AIMemory';
export { aiSecurity }         from './security/AISecurityLayer';
export { AISecurityLayer }    from './security/AISecurityLayer';
export { AICostOptimizer }    from './cost/AICostOptimizer';

// ─── Prompt Engine ────────────────────────────────────────────────────────────
export {
  SYSTEM_PROMPTS,
  PROMPT_TEMPLATES,
  renderTemplate,
  buildFewShotMessages,
  wrapWithCOT,
  extractCOTAnswer,
  enforceJSON,
  injectContext,
  detectLanguage,
} from './prompt/AIPromptEngine';

// ─── Domain Engines ───────────────────────────────────────────────────────────
export { RecommendationEngine } from './engines/RecommendationEngine';
export { SearchEngine }         from './engines/SearchEngine';
export { MatchingEngine }       from './engines/MatchingEngine';
export { FraudEngine }          from './engines/FraudEngine';
export { TranslationEngine, SUPPORTED_LANGUAGES } from './engines/TranslationEngine';
export { VoiceEngine }          from './engines/VoiceEngine';
export { ModerationEngine }     from './engines/ModerationEngine';
export { BIEngine }             from './engines/BIEngine';
export { NotificationEngine }   from './engines/NotificationEngine';
export { CareerEngine }         from './engines/CareerEngine';
export { MarketplaceEngine }    from './engines/MarketplaceEngine';
export { TravelEngine }         from './engines/TravelEngine';
export { HealthEngine }         from './engines/HealthEngine';

// ─── Developer Platform ───────────────────────────────────────────────────────
export { AISDK, AIAgent, AIWorkflow } from './developer/AISDK';
export type { SDKAgentConfig, WorkflowStep, WorkflowContext, AIPlugin } from './developer/AISDK';

// ─── React Layer ──────────────────────────────────────────────────────────────
export { AIProvider, useAIContext }   from './providers/AIProvider';
export type { AIContextValue, AIProviderProps } from './providers/AIProvider';

export { useAI }              from './hooks/useAI';
export { useRecommendations, useSimilarItems } from './hooks/useRecommendations';
export { useAISearch }        from './hooks/useAISearch';
export { useTranslation, useAutoTranslated } from './hooks/useTranslation';
export { useVoice }           from './hooks/useVoice';
export type { UseAIOptions }  from './hooks/useAI';
export type { UseVoiceOptions } from './hooks/useVoice';