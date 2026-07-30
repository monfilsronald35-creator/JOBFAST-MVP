/**
 * LocalProvider — Ollama / local model support.
 * Runs entirely on-device via local Ollama server (default: http://localhost:11434).
 * Privacy-first: no data leaves the device.
 */

import type { AIModelProvider, AIModelConfig, AIRequest, AIResponse, AIStreamChunk } from '../../types';

const MODELS: AIModelConfig[] = [
  { id: 'local:llama3',   providerId: 'local', name: 'Llama 3 (Local)',   contextWindow: 8_192, maxOutputTokens: 4_096, inputCostPer1k: 0, outputCostPer1k: 0, avgLatencyMs: 2000, qualityScore: 72, capabilities: ['text','stream'], supportsStreaming: true, supportsVision: false, supportsAudio: false, localOnly: true },
  { id: 'local:phi3',     providerId: 'local', name: 'Phi-3 (Local)',     contextWindow: 4_096, maxOutputTokens: 2_048, inputCostPer1k: 0, outputCostPer1k: 0, avgLatencyMs: 1200, qualityScore: 65, capabilities: ['text','stream'], supportsStreaming: true, supportsVision: false, supportsAudio: false, localOnly: true },
  { id: 'local:mistral',  providerId: 'local', name: 'Mistral (Local)',   contextWindow: 32_768,maxOutputTokens: 4_096, inputCostPer1k: 0, outputCostPer1k: 0, avgLatencyMs: 1800, qualityScore: 70, capabilities: ['text','stream'], supportsStreaming: true, supportsVision: false, supportsAudio: false, localOnly: true },
  { id: 'local:gemma',    providerId: 'local', name: 'Gemma (Local)',     contextWindow: 8_192, maxOutputTokens: 4_096, inputCostPer1k: 0, outputCostPer1k: 0, avgLatencyMs: 1500, qualityScore: 68, capabilities: ['text','stream'], supportsStreaming: true, supportsVision: false, supportsAudio: false, localOnly: true },
  { id: 'local:qwen',     providerId: 'local', name: 'Qwen (Local)',      contextWindow: 32_768,maxOutputTokens: 4_096, inputCostPer1k: 0, outputCostPer1k: 0, avgLatencyMs: 2000, qualityScore: 70, capabilities: ['text','stream'], supportsStreaming: true, supportsVision: false, supportsAudio: false, localOnly: true },
];

export function createLocalProvider(ollamaUrl = 'http://localhost:11434'): AIModelProvider {
  return {
    id: 'local', name: 'Local (Ollama)', models: MODELS, available: false, baseUrl: ollamaUrl,

    async chat(req: AIRequest): Promise<AIResponse> {
      const modelName = (req.model ?? 'local:llama3').replace('local:', '');
      const messages = req.messages.map(m => ({
        role:    m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }));
      const start = Date.now();
      const res = await fetch(`${ollamaUrl}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ model: modelName, messages, stream: false }),
      });
      if (!res.ok) throw new Error(`Local model error: HTTP ${res.status}`);
      const data = await res.json() as { message?: { content?: string } };
      const content = data.message?.content ?? '';
      return {
        id:           crypto.randomUUID(),
        content,
        model:        req.model ?? 'local:llama3',
        provider:     'local',
        inputTokens:  Math.ceil(messages.map(m => m.content).join(' ').length / 4),
        outputTokens: Math.ceil(content.length / 4),
        costUSD:      0,
        latencyMs:    Date.now() - start,
        cached:       false,
      };
    },

    async *stream(req: AIRequest): AsyncGenerator<AIStreamChunk> {
      const modelName = (req.model ?? 'local:llama3').replace('local:', '');
      const messages = req.messages.map(m => ({
        role:    m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }));
      const res = await fetch(`${ollamaUrl}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ model: modelName, messages, stream: true }),
      });
      if (!res.ok || !res.body) throw new Error(`Local stream error: HTTP ${res.status}`);
      const reader = res.body.getReader(); const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) { yield { delta: '', done: true }; break; }
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.trim()) continue;
          try {
            const p = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
            yield { delta: p.message?.content ?? '', done: p.done ?? false };
            if (p.done) return;
          } catch { /* skip */ }
        }
      }
    },

    async embed(text: string): Promise<number[]> {
      const res = await fetch(`${ollamaUrl}/api/embeddings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
      });
      return ((await res.json()) as { embedding: number[] }).embedding;
    },

    async health(): Promise<boolean> {
      const res = await fetch(`${ollamaUrl}/api/tags`).catch(() => null);
      return res?.ok ?? false;
    },
  };
}