import type { AIModelProvider, AIModelConfig, AIRequest, AIResponse, AIStreamChunk } from '../../types';

const MODELS: AIModelConfig[] = [
  { id: 'gemini-2.5-pro',   providerId: 'google', name: 'Gemini 2.5 Pro',   contextWindow: 1_000_000, maxOutputTokens: 65_536, inputCostPer1k: 0.00125, outputCostPer1k: 0.005,  avgLatencyMs: 900, qualityScore: 93, capabilities: ['text','vision','audio','code','function_calling','stream','long_context'], supportsStreaming: true, supportsVision: true, supportsAudio: true,  localOnly: false },
  { id: 'gemini-2.0-flash', providerId: 'google', name: 'Gemini 2.0 Flash', contextWindow: 1_000_000, maxOutputTokens: 8_192,  inputCostPer1k: 0.0001,  outputCostPer1k: 0.0004, avgLatencyMs: 200, qualityScore: 80, capabilities: ['text','vision','stream','long_context'], supportsStreaming: true, supportsVision: true, supportsAudio: false, localOnly: false },
  { id: 'gemini-1.5-pro',   providerId: 'google', name: 'Gemini 1.5 Pro',   contextWindow: 2_000_000, maxOutputTokens: 8_192,  inputCostPer1k: 0.00125, outputCostPer1k: 0.005,  avgLatencyMs: 800, qualityScore: 88, capabilities: ['text','vision','stream','long_context'], supportsStreaming: true, supportsVision: true, supportsAudio: false, localOnly: false },
];

export function createGeminiProvider(): AIModelProvider {
  return {
    id: 'google', name: 'Google Gemini', models: MODELS, available: true, baseUrl: '/api/ai/google',

    async chat(req: AIRequest): Promise<AIResponse> {
      const res = await fetch('/api/ai/google/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`Gemini error: HTTP ${res.status}`);
      return res.json() as Promise<AIResponse>;
    },

    async *stream(req: AIRequest): AsyncGenerator<AIStreamChunk> {
      const res = await fetch('/api/ai/google/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...req, stream: true }),
      });
      if (!res.ok || !res.body) throw new Error(`Gemini stream error: HTTP ${res.status}`);
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
      const res = await fetch('/api/ai/google/embed', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      });
      return ((await res.json()) as { embedding: number[] }).embedding;
    },

    async health(): Promise<boolean> {
      return (await fetch('/api/ai/google/health').catch(() => null))?.ok ?? false;
    },
  };
}