import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'storybook-static', 'playwright'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.stories.{ts,tsx}',
        '**/*.config.{ts,js}',
        'src/types/**',
        'src/locales/**',
      ],
    },
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './test-results/index.html',
    },
    typecheck: {
      tsconfig: './tsconfig.json',
    },
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});