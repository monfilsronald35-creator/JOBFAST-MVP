import type { AIModelProvider, AIModelConfig, AIRequest, AIResponse, AIStreamChunk } from '../../types';

const MODELS: AIModelConfig[] = [
  { id: 'mistral-large-2', providerId: 'mistral', name: 'Mistral Large 2',  contextWindow: 128_000, maxOutputTokens: 4_096, inputCostPer1k: 0.002, outputCostPer1k: 0.006, avgLatencyMs: 600, qualityScore: 85, capabilities: ['text','code','function_calling','stream'], supportsStreaming: true, supportsVision: false, supportsAudio: false, localOnly: false },
  { id: 'mistral-small-3', providerId: 'mistral', name: 'Mistral Small 3',  contextWindow: 32_000,  maxOutputTokens: 4_096, inputCostPer1k: 0.0002,outputCostPer1k: 0.0006,avgLatencyMs: 300, qualityScore: 72, capabilities: ['text','stream'], supportsStreaming: true, supportsVision: false, supportsAudio: false, localOnly: false },
  { id: 'codestral',       providerId: 'mistral', name: 'Codestral',         contextWindow: 256_000, maxOutputTokens: 4_096, inputCostPer1k: 0.001, outputCostPer1k: 0.003, avgLatencyMs: 500, qualityScore: 88, capabilities: ['code','stream'], supportsStreaming: true, supportsVision: false, supportsAudio: false, localOnly: false },
];

export function createMistralProvider(): AIModelProvider {
  return {
    id: 'mistral', name: 'Mistral AI', models: MODELS, available: true, baseUrl: '/api/ai/mistral',

    async chat(req: AIRequest): Promise<AIResponse> {
      const res = await fetch('/api/ai/mistral/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`Mistral error: HTTP ${res.status}`);
      return res.json() as Promise<AIResponse>;
    },

    async *stream(req: AIRequest): AsyncGenerator<AIStreamChunk> {
      const res = await fetch('/api/ai/mistral/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...req, stream: true }),
      });
      if (!res.ok || !res.body) throw new Error(`Mistral stream: HTTP ${res.status}`);
      const reader = res.body.getReader(); const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) { yield { delta: '', done: true }; break; }
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6).trim();
          if (d === '[DONE]') { yield { delta: '', done: true }; return; }
          try { const p = JSON.parse(d) as { delta?: string }; yield { delta: p.delta ?? '', done: false }; } catch { /* skip */ }
        }
      }
    },

    async embed(text: string): Promise<number[]> {
      const res = await fetch('/api/ai/mistral/embed', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      });
      return ((await res.json()) as { embedding: number[] }).embedding;
    },

    async health(): Promise<boolean> {
      return (await fetch('/api/ai/mistral/health').catch(() => null))?.ok ?? false;
    },
  };
}