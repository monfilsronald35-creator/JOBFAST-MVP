import type { AIModelProvider, AIModelConfig, AIRequest, AIResponse, AIStreamChunk } from '../../types';

const MODELS: AIModelConfig[] = [
  { id: 'claude-opus-5',    providerId: 'anthropic', name: 'Claude Opus 5',    contextWindow: 200_000, maxOutputTokens: 32_000, inputCostPer1k: 0.015,  outputCostPer1k: 0.075, avgLatencyMs: 1200, qualityScore: 98, capabilities: ['text','vision','code','function_calling','stream','long_context'], supportsStreaming: true, supportsVision: true, supportsAudio: false, localOnly: false },
  { id: 'claude-sonnet-5',  providerId: 'anthropic', name: 'Claude Sonnet 5',  contextWindow: 200_000, maxOutputTokens: 64_000, inputCostPer1k: 0.003,  outputCostPer1k: 0.015, avgLatencyMs: 700,  qualityScore: 92, capabilities: ['text','vision','code','function_calling','stream','long_context'], supportsStreaming: true, supportsVision: true, supportsAudio: false, localOnly: false },
  { id: 'claude-haiku-4-5', providerId: 'anthropic', name: 'Claude Haiku 4.5', contextWindow: 200_000, maxOutputTokens: 16_000, inputCostPer1k: 0.0008, outputCostPer1k: 0.004, avgLatencyMs: 300,  qualityScore: 82, capabilities: ['text','vision','stream','function_calling'], supportsStreaming: true, supportsVision: true, supportsAudio: false, localOnly: false },
  { id: 'claude-fable-5',   providerId: 'anthropic', name: 'Claude Fable 5',   contextWindow: 200_000, maxOutputTokens: 32_000, inputCostPer1k: 0.002,  outputCostPer1k: 0.010, avgLatencyMs: 600,  qualityScore: 88, capabilities: ['text','vision','stream','code'], supportsStreaming: true, supportsVision: true, supportsAudio: false, localOnly: false },
];

export function createAnthropicProvider(): AIModelProvider {
  return {
    id: 'anthropic', name: 'Anthropic', models: MODELS, available: true, baseUrl: '/api/ai/anthropic',

    async chat(req: AIRequest): Promise<AIResponse> {
      const res = await fetch('/api/ai/anthropic/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`Anthropic error: HTTP ${res.status}`);
      return res.json() as Promise<AIResponse>;
    },

    async *stream(req: AIRequest): AsyncGenerator<AIStreamChunk> {
      const res = await fetch('/api/ai/anthropic/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...req, stream: true }),
      });
      if (!res.ok || !res.body) throw new Error(`Anthropic stream error: HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) { yield { delta: '', done: true }; break; }
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') { yield { delta: '', done: true }; return; }
          try { const p = JSON.parse(data) as { delta?: string }; yield { delta: p.delta ?? '', done: false }; } catch { /* skip */ }
        }
      }
    },

    async embed(text: string): Promise<number[]> {
      const res = await fetch('/api/ai/anthropic/embed', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      });
      return ((await res.json()) as { embedding: number[] }).embedding;
    },

    async health(): Promise<boolean> {
      return (await fetch('/api/ai/anthropic/health').catch(() => null))?.ok ?? false;
    },
  };
}