/**
 * AIMemory — Persistent conversation history + user memory.
 * Uses IndexedDB for offline-first storage. Integrates with FAZ 6 OfflineDB.
 */

import type { ConversationMessage, AIUserMemory, MemoryFact } from '../types';

const DB_NAME    = 'jobfast_ai';
const DB_VERSION = 1;
const STORE_MSGS = 'conversations';
const STORE_MEM  = 'user_memory';
const MAX_HISTORY = 50; // messages per session kept in memory

function openAIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror   = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as IDBDatabase);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_MSGS)) {
        const s = db.createObjectStore(STORE_MSGS, { keyPath: 'id' });
        s.createIndex('sessionId', 'sessionId', { unique: false });
        s.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_MEM)) {
        db.createObjectStore(STORE_MEM, { keyPath: 'userId' });
      }
    };
  });
}

async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openAIDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
    req.onerror   = () => reject(req.error);
  });
}

async function idbPut(storeName: string, value: unknown): Promise<void> {
  const db = await openAIDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

async function idbGetByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
  const db = await openAIDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req   = index.getAll(value);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror   = () => reject(req.error);
  });
}

// ─── In-memory session cache ───────────────────────────────────────────────────

const _sessionCache: Map<string, ConversationMessage[]> = new Map();

export const AIMemory = {
  // ─── Conversation messages ─────────────────────────────────────────────────

  async addMessage(message: ConversationMessage): Promise<void> {
    await idbPut(STORE_MSGS, message);
    const cached = _sessionCache.get(message.sessionId) ?? [];
    cached.push(message);
    if (cached.length > MAX_HISTORY) cached.shift();
    _sessionCache.set(message.sessionId, cached);
  },

  async getHistory(sessionId: string, limit = 20): Promise<ConversationMessage[]> {
    const cached = _sessionCache.get(sessionId);
    if (cached) return cached.slice(-limit);
    const all = await idbGetByIndex<ConversationMessage>(STORE_MSGS, 'sessionId', sessionId);
    all.sort((a, b) => a.timestamp - b.timestamp);
    const recent = all.slice(-MAX_HISTORY);
    _sessionCache.set(sessionId, recent);
    return recent.slice(-limit);
  },

  async clearSession(sessionId: string): Promise<void> {
    _sessionCache.delete(sessionId);
    // IDB cleanup handled server-side or by TTL
  },

  // ─── User memory (extracted facts) ────────────────────────────────────────

  async getUserMemory(userId: string): Promise<AIUserMemory | null> {
    return idbGet<AIUserMemory>(STORE_MEM, userId);
  },

  async updateUserMemory(userId: string, updates: { facts?: MemoryFact[]; preferences?: Record<string, unknown> }): Promise<void> {
    const existing = await this.getUserMemory(userId) ?? {
      userId, facts: [], preferences: {}, lastInteraction: 0, totalInteractions: 0, updatedAt: 0,
    };
    const merged: AIUserMemory = {
      ...existing,
      facts:             updates.facts ?? existing.facts,
      preferences:       { ...existing.preferences, ...(updates.preferences ?? {}) },
      lastInteraction:   Date.now(),
      totalInteractions: existing.totalInteractions + 1,
      updatedAt:         Date.now(),
    };
    await idbPut(STORE_MEM, merged);
  },

  async addFact(userId: string, fact: MemoryFact): Promise<void> {
    const mem = await this.getUserMemory(userId) ?? {
      userId, facts: [], preferences: {}, lastInteraction: 0, totalInteractions: 0, updatedAt: 0,
    };
    // Replace existing fact with same key
    const facts = mem.facts.filter(f => f.key !== fact.key);
    facts.push(fact);
    await idbPut(STORE_MEM, { ...mem, facts, updatedAt: Date.now() });
  },

  async extractFacts(userId: string, text: string): Promise<MemoryFact[]> {
    // Pattern-based fact extraction (no AI call needed for basic facts)
    const facts: MemoryFact[] = [];
    const now = Date.now();

    const nameMatch = /(?:mwen se|je suis|my name is|i am|i'm)\s+([A-Z][a-z]+)/i.exec(text);
    if (nameMatch?.[1]) facts.push({ key: 'name', value: nameMatch[1], confidence: 90, extractedAt: now, source: 'conversation' });

    const locationMatch = /(?:mwen abite|j'habite|i live in|i'm from|i'm in)\s+([A-Za-z\s]+)/i.exec(text);
    if (locationMatch?.[1]) facts.push({ key: 'location', value: locationMatch[1].trim(), confidence: 85, extractedAt: now, source: 'conversation' });

    const langMatch = /(?:mwen pale|je parle|i speak)\s+([A-Za-z]+)/i.exec(text);
    if (langMatch?.[1]) facts.push({ key: 'language', value: langMatch[1], confidence: 80, extractedAt: now, source: 'conversation' });

    if (facts.length > 0) {
      for (const fact of facts) await this.addFact(userId, fact);
    }
    return facts;
  },

  // ─── Context building for next request ────────────────────────────────────

  async buildContextSummary(userId: string, sessionId: string): Promise<string> {
    const [memory, history] = await Promise.all([
      this.getUserMemory(userId),
      this.getHistory(sessionId, 10),
    ]);

    const parts: string[] = [];

    if (memory?.facts.length) {
      const factStr = memory.facts.map(f => `${f.key}: ${f.value}`).join(', ');
      parts.push(`User facts: ${factStr}`);
    }

    if (memory?.preferences && Object.keys(memory.preferences).length > 0) {
      parts.push(`User preferences: ${JSON.stringify(memory.preferences)}`);
    }

    if (history.length > 0) {
      const last = history.slice(-5).map(m => `${m.role}: ${m.content.slice(0, 100)}`).join('\n');
      parts.push(`Recent conversation:\n${last}`);
    }

    return parts.join('\n\n');
  },
};