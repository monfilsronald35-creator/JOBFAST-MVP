import { useState, useCallback, useRef } from 'react';
import type { AIMessage, AIRequest } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { AIMemory } from '../memory/AIMemory';

export interface UseAIOptions {
  userId?: string;
  sessionId?: string;
  systemPrompt?: string;
  strategy?: AIRequest['strategy'];
  maxTokens?: number;
}

export function useAI(options: UseAIOptions = {}) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState('');
  const sessionId = useRef(options.sessionId ?? crypto.randomUUID());

  const send = useCallback(
    async (content: string): Promise<string> => {
      setError(null);
      setLoading(true);

      const userMsg: AIMessage = { role: 'user', content };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const history = await AIMemory.getHistory(sessionId.current, 20);
        const contextMessages: AIRequest['messages'] = [
          ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user', content },
        ];

        const response = await AIGateway.chat({
          messages: contextMessages,
          strategy: options.strategy ?? 'balanced',
          ...(options.systemPrompt !== undefined && { systemPrompt: options.systemPrompt }),
          ...(options.maxTokens !== undefined && { maxTokens: options.maxTokens }),
          ...(options.userId !== undefined
            ? { context: { userId: options.userId, sessionId: sessionId.current } }
            : {}),
        });

        const assistantContent = response.content ?? '';
        const assistantMsg: AIMessage = { role: 'assistant', content: assistantContent };
        setMessages((prev) => [...prev, assistantMsg]);

        if (options.userId) {
          const ts = Date.now();
          await AIMemory.addMessage({
            id: crypto.randomUUID(),
            role: 'user',
            content,
            sessionId: sessionId.current,
            userId: options.userId,
            timestamp: ts,
          });
          await AIMemory.addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantContent,
            sessionId: sessionId.current,
            userId: options.userId,
            timestamp: ts + 1,
          });
        }

        return assistantContent;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI request failed';
        setError(msg);
        return '';
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const stream = useCallback(
    async (content: string): Promise<void> => {
      setError(null);
      setLoading(true);
      setStreaming('');
      setMessages((prev) => [...prev, { role: 'user', content }]);

      try {
        let full = '';
        for await (const chunk of AIGateway.stream({
          messages: [{ role: 'user', content }],
          strategy: options.strategy ?? 'balanced',
          ...(options.systemPrompt !== undefined && { systemPrompt: options.systemPrompt }),
        })) {
          if (chunk.delta) {
            full += chunk.delta;
            setStreaming(full);
          }
        }
        setMessages((prev) => [...prev, { role: 'assistant', content: full }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Stream failed');
      } finally {
        setLoading(false);
        setStreaming('');
      }
    },
    [options],
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    sessionId.current = crypto.randomUUID();
  }, []);

  return { messages, loading, error, streaming, send, stream, clear, sessionId: sessionId.current };
}
