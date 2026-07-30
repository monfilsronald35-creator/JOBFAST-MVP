import type { AIRequest, AIResponse, AIStreamChunk } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { AIMemory } from '../memory/AIMemory';
import { aiSecurity } from '../security/AISecurityLayer';
import { SYSTEM_PROMPTS, detectLanguage } from '../prompt/AIPromptEngine';

// Developer-facing SDK for building AI-powered features on top of JOBFAST AI Platform.
// All requests go through AIGateway → security → routing → provider.

export interface SDKAgentConfig {
  name: string;
  systemPrompt: string;
  strategy?: AIRequest['strategy'];
  maxTokens?: number;
  temperature?: number;
}

export class AIAgent {
  private readonly config: SDKAgentConfig;
  private sessionId = crypto.randomUUID();

  constructor(config: SDKAgentConfig) {
    this.config = config;
  }

  async chat(userMessage: string, userId?: string): Promise<string> {
    const history = userId ? await AIMemory.getHistory(this.sessionId, 10) : [];
    const messages: AIRequest['messages'] = [
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: userMessage },
    ];

    const response = await AIGateway.chat({
      messages,
      systemPrompt:   this.config.systemPrompt,
      strategy:       this.config.strategy ?? 'balanced',
      maxTokens:      this.config.maxTokens,
      temperature:    this.config.temperature,
      context:        userId ? { userId, sessionId: this.sessionId } : {},
    });

    if (userId) {
      await AIMemory.addMessage({ role: 'user',      content: userMessage,          sessionId: this.sessionId, userId, timestamp: Date.now() });
      await AIMemory.addMessage({ role: 'assistant', content: response.content ?? '', sessionId: this.sessionId, userId, timestamp: Date.now() });
    }

    return response.content ?? '';
  }

  async *stream(userMessage: string): AsyncGenerator<string> {
    for await (const chunk of AIGateway.stream({ messages: [{ role: 'user', content: userMessage }], systemPrompt: this.config.systemPrompt, strategy: this.config.strategy ?? 'balanced' })) {
      if (chunk.delta) yield chunk.delta;
    }
  }

  newSession(): void {
    this.sessionId = crypto.randomUUID();
  }
}

// ─── Workflow Builder ──────────────────────────────────────────────────────────

export type WorkflowStep =
  | { type: 'ai_chat';    prompt: string; systemPrompt?: string; outputKey: string }
  | { type: 'ai_json';    prompt: string; outputKey: string }
  | { type: 'condition';  expression: string; trueSteps: WorkflowStep[]; falseSteps?: WorkflowStep[] }
  | { type: 'transform';  fn: (ctx: WorkflowContext) => unknown; outputKey: string }
  | { type: 'fetch';      url: string; method?: string; body?: unknown; outputKey: string };

export interface WorkflowContext {
  input: Record<string, unknown>;
  [key: string]: unknown;
}

export class AIWorkflow {
  private steps: WorkflowStep[] = [];

  addStep(step: WorkflowStep): this {
    this.steps.push(step);
    return this;
  }

  async run(input: Record<string, unknown>): Promise<WorkflowContext> {
    const ctx: WorkflowContext = { input, ...input };
    await this.executeSteps(this.steps, ctx);
    return ctx;
  }

  private async executeSteps(steps: WorkflowStep[], ctx: WorkflowContext): Promise<void> {
    for (const step of steps) {
      await this.executeStep(step, ctx);
    }
  }

  private async executeStep(step: WorkflowStep, ctx: WorkflowContext): Promise<void> {
    const interpolate = (t: string) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => String(ctx[k] ?? ''));

    switch (step.type) {
      case 'ai_chat': {
        const result = await AIGateway.complete(interpolate(step.prompt), step.systemPrompt ? { messages: [{ role: 'user', content: interpolate(step.prompt) }] } : undefined);
        ctx[step.outputKey] = result;
        break;
      }
      case 'ai_json': {
        const result = await AIGateway.json(interpolate(step.prompt));
        ctx[step.outputKey] = result;
        break;
      }
      case 'condition': {
        const fn = new Function('ctx', `return !!(${step.expression});`);
        const condResult = fn(ctx) as boolean;
        await this.executeSteps(condResult ? step.trueSteps : (step.falseSteps ?? []), ctx);
        break;
      }
      case 'transform': {
        ctx[step.outputKey] = step.fn(ctx);
        break;
      }
      case 'fetch': {
        const body = step.body ? JSON.stringify(step.body) : undefined;
        const res = await fetch(step.url, { method: step.method ?? 'GET', body, headers: body ? { 'Content-Type': 'application/json' } : {} });
        ctx[step.outputKey] = await res.json();
        break;
      }
    }
  }
}

// ─── Plugin Interface ─────────────────────────────────────────────────────────

export interface AIPlugin {
  id:          string;
  name:        string;
  description: string;
  install(sdk: typeof AISDK): void;
}

// ─── Public SDK ───────────────────────────────────────────────────────────────

export const AISDK = {
  createAgent(config: SDKAgentConfig): AIAgent {
    return new AIAgent(config);
  },

  createWorkflow(): AIWorkflow {
    return new AIWorkflow();
  },

  async chat(message: string, options?: Partial<AIRequest>): Promise<string> {
    return AIGateway.complete(message, options);
  },

  async json<T>(prompt: string, options?: Partial<AIRequest>): Promise<T> {
    return AIGateway.json<T>(prompt, options);
  },

  async *stream(message: string, options?: Partial<AIRequest>): AsyncGenerator<string> {
    for await (const chunk of AIGateway.stream({ messages: [{ role: 'user', content: message }], ...options })) {
      if (chunk.delta) yield chunk.delta;
    }
  },

  async embed(text: string): Promise<number[]> {
    return AIGateway.embed(text);
  },

  detectLanguage,

  security: aiSecurity,

  install(plugin: AIPlugin): void {
    plugin.install(AISDK);
  },

  SYSTEM_PROMPTS,
};