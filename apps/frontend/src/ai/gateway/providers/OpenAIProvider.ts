import type { AIModelProvider, AIModelConfig, AIRequest, AIResponse, AIStreamChunk } from '../../types';

const MODELS: AIModelConfig[] = [
  { id: 'gpt-4o',       providerId: 'openai', name: 'GPT-4o',       contextWindow: 128_000, maxOutputTokens: 16_384, inputCostPer1k: 0.0025, outputCostPer1k: 0.010,  avgLatencyMs: 800,  qualityScore: 90, capabilities: ['text','vision','function_calling','json_mode','stream'], supportsStreaming: true,  supportsVision: true,  supportsAudio: false, localOnly: false },
  { id: 'gpt-4o-mini',  providerId: 'openai', name: 'GPT-4o Mini',  contextWindow: 128_000, maxOutputTokens: 16_384, inputCostPer1k: 0.00015,outputCostPer1k: 0.0006, avgLatencyMs: 400,  qualityScore: 78, capabilities: ['text','vision','function_calling','json_mode','stream'], supportsStreaming: true,  supportsVision: true,  supportsAudio: false, localOnly: false },
  { id: 'gpt-4.1',      providerId: 'openai', name: 'GPT-4.1',      contextWindow: 1_000_000,maxOutputTokens:32_768, inputCostPer1k: 0.002,  outputCostPer1k: 0.008,  avgLatencyMs: 900,  qualityScore: 93, capabilities: ['text','vision','function_calling','json_mode','stream','long_context'], supportsStreaming: true, supportsVision: true, supportsAudio: false, localOnly: false },
  { id: 'gpt-4.1-mini', providerId: 'openai', name: 'GPT-4.1 Mini', contextWindow: 1_000_000,maxOutputTokens:32_768, inputCostPer1k: 0.0004, outputCostPer1k: 0.0016, avgLatencyMs: 350,  qualityScore: 80, capabilities: ['text','vision','function_calling','json_mode','stream','long_context'], supportsStreaming: true, supportsVision: true, supportsAudio: false, localOnly: false },
];

export function createOpenAIProvider(): AIModelProvider {
  return {
    id:       'openai',
    name:     'OpenAI',
    models:   MODELS,
    available: true,
    baseUrl:  '/api/ai/openai',

    async chat(req: AIRequest): Promise<AIResponse> {
      const res = await fetch(`/api/ai/openai/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`OpenAI error: HTTP ${res.status}`);
      return res.json() as Promise<AIResponse>;
    },

    async *stream(req: AIRequest): AsyncGenerator<AIStreamChunk> {
      const res = await fetch(`/api/ai/openai/stream`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...req, stream: true }),
      });
      if (!res.ok || !res.body) throw new Error(`OpenAI stream error: HTTP ${res.status}`);
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) { yield { delta: '', done: true }; break; }
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') { yield { delta: '', done: true }; return; }
          try {
            const parsed = JSON.parse(data) as { delta?: string };
            yield { delta: parsed.delta ?? '', done: false };
          } catch { /* skip malformed chunk */ }
        }
      }
    },

    async embed(text: string): Promise<number[]> {
      const res = await fetch(`/api/ai/openai/embed`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      });
      const r = await res.json() as { embedding: number[] };
      return r.embedding;
    },

    async health(): Promise<boolean> {
      const res = await fetch(`/api/ai/openai/health`).catch(() => null);
      return res?.ok ?? false;
    },
  };
}