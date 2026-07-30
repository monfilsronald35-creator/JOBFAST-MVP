import type { AIModelProvider, AIModelConfig, AIRequest, AIResponse, AIStreamChunk } from '../../types';

const MODELS: AIModelConfig[] = [
  { id: 'deepseek-chat',     providerId: 'deepseek', name: 'DeepSeek Chat',     contextWindow: 128_000, maxOutputTokens: 8_192, inputCostPer1k: 0.00014, outputCostPer1k: 0.00028, avgLatencyMs: 500, qualityScore: 83, capabilities: ['text','code','function_calling','stream'], supportsStreaming: true, supportsVision: false, supportsAudio: false, localOnly: false },
  { id: 'deepseek-reasoner', providerId: 'deepseek', name: 'DeepSeek Reasoner', contextWindow: 64_000,  maxOutputTokens: 8_192, inputCostPer1k: 0.00055, outputCostPer1k: 0.00219, avgLatencyMs: 1500,qualityScore: 90, capabilities: ['text','code','stream'], supportsStreaming: true, supportsVision: false, supportsAudio: false, localOnly: false },
  { id: 'deepseek-v3',       providerId: 'deepseek', name: 'DeepSeek V3',       contextWindow: 128_000, maxOutputTokens: 8_192, inputCostPer1k: 0.00027, outputCostPer1k: 0.0011,  avgLatencyMs: 600, qualityScore: 85, capabilities: ['text','code','function_calling','stream'], supportsStreaming: true, supportsVision: false, supportsAudio: false, localOnly: false },
];

export function createDeepSeekProvider(): AIModelProvider {
  return {
    id: 'deepseek', name: 'DeepSeek', models: MODELS, available: true, baseUrl: '/api/ai/deepseek',

    async chat(req: AIRequest): Promise<AIResponse> {
      const res = await fetch('/api/ai/deepseek/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`DeepSeek error: HTTP ${res.status}`);
      return res.json() as Promise<AIResponse>;
    },

    async *stream(req: AIRequest): AsyncGenerator<AIStreamChunk> {
      const res = await fetch('/api/ai/deepseek/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...req, stream: true }),
      });
      if (!res.ok || !res.body) throw new Error(`DeepSeek stream: HTTP ${res.status}`);
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
      const res = await fetch('/api/ai/deepseek/embed', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      });
      return ((await res.json()) as { embedding: number[] }).embedding;
    },

    async health(): Promise<boolean> {
      return (await fetch('/api/ai/deepseek/health').catch(() => null))?.ok ?? false;
    },
  };
}