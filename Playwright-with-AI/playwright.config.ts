/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 8_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./src/healer/self-healer.ts'],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://showtimenow.contentstackapps.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/naukri/**',
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      testIgnore: '**/naukri/**',
    },
    {
      name: 'naukri',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',           // real Chrome — bypasses Akamai bot detection
        headless: false,
        baseURL: process.env.BASE_NAUKRI_URL ?? 'https://www.naukri.com',
      },
      testMatch: '**/naukri/**',
    },
  ],
});
