/**
 * Vitest global test setup — runs before every test file.
 */
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Auto-cleanup React trees after each test
afterEach(() => {
  cleanup();
});

// ── Web API stubs (not available in jsdom) ────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-${Math.random().toString(36).slice(2)}`,
  },
});

// ── IndexedDB stub ─────────────────────────────────────────────────────────────
const indexedDB = {
  open: vi.fn(() => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: vi.fn(() => ({ createIndex: vi.fn() })),
      objectStoreNames: { contains: vi.fn(() => false) },
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          put: vi.fn(() => ({ onsuccess: null, onerror: null })),
          get: vi.fn(() => ({ onsuccess: null, onerror: null })),
          delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
          getAll: vi.fn(() => ({ onsuccess: null, onerror: null })),
          clear: vi.fn(() => ({ onsuccess: null, onerror: null })),
        })),
        oncomplete: null,
        onerror: null,
      })),
    },
  })),
};

Object.defineProperty(globalThis, 'indexedDB', { value: indexedDB, writable: true });

// ── localStorage stub ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });