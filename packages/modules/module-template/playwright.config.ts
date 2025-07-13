/**
 * Module Template Playwright E2E 测试配置
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: './test-results/e2e-report' }],
    ['json', { outputFile: './test-results/e2e-results.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    headless: !!process.env.CI,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  
  outputDir: './test-results/e2e-artifacts',
  timeout: 30000,
  expect: {
    timeout: 5000
  }
});
