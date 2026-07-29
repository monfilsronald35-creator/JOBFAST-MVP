import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration — JOBFAST Global
 * Runs against the Vite preview server.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env['CI'] ? [['github'] as [string]] : []),
  ],

  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    locale: 'fr-HT',
    timezoneId: 'America/Port-au-Prince',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});