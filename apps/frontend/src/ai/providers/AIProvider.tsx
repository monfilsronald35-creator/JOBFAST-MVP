import React, { createContext, useContext, useMemo } from 'react';
import { AIGateway } from '../gateway/AIGateway';
import { AIMemory } from '../memory/AIMemory';
import { RecommendationEngine } from '../engines/RecommendationEngine';
import { SearchEngine } from '../engines/SearchEngine';
import { MatchingEngine } from '../engines/MatchingEngine';
import { FraudEngine } from '../engines/FraudEngine';
import { TranslationEngine } from '../engines/TranslationEngine';
import { VoiceEngine } from '../engines/VoiceEngine';
import { ModerationEngine } from '../engines/ModerationEngine';
import { BIEngine } from '../engines/BIEngine';
import { NotificationEngine } from '../engines/NotificationEngine';
import { CareerEngine } from '../engines/CareerEngine';
import { MarketplaceEngine } from '../engines/MarketplaceEngine';
import { TravelEngine } from '../engines/TravelEngine';
import { HealthEngine } from '../engines/HealthEngine';
import { AISDK } from '../developer/AISDK';

export interface AIContextValue {
  gateway:      typeof AIGateway;
  memory:       typeof AIMemory;
  recommend:    typeof RecommendationEngine;
  search:       typeof SearchEngine;
  match:        typeof MatchingEngine;
  fraud:        typeof FraudEngine;
  translate:    typeof TranslationEngine;
  voice:        typeof VoiceEngine;
  moderate:     typeof ModerationEngine;
  bi:           typeof BIEngine;
  notify:       typeof NotificationEngine;
  career:       typeof CareerEngine;
  marketplace:  typeof MarketplaceEngine;
  travel:       typeof TravelEngine;
  health:       typeof HealthEngine;
  sdk:          typeof AISDK;
}

const AIContext = createContext<AIContextValue | null>(null);

export interface AIProviderProps {
  children: React.ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const value = useMemo<AIContextValue>(() => ({
    gateway:     AIGateway,
    memory:      AIMemory,
    recommend:   RecommendationEngine,
    search:      SearchEngine,
    match:       MatchingEngine,
    fraud:       FraudEngine,
    translate:   TranslationEngine,
    voice:       VoiceEngine,
    moderate:    ModerationEngine,
    bi:          BIEngine,
    notify:      NotificationEngine,
    career:      CareerEngine,
    marketplace: MarketplaceEngine,
    travel:      TravelEngine,
    health:      HealthEngine,
    sdk:         AISDK,
  }), []);

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAIContext(): AIContextValue {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAIContext must be used within <AIProvider>');
  return ctx;
}