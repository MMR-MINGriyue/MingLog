/**
 * MingLog Playwright E2E 测试配置
 * 配置端到端测试环境和浏览器设置
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试目录
  testDir: './src/test/e2e',
  
  // 全局设置
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // 报告器配置
  reporter: [
    ['html', { outputFolder: './test-results/e2e-report' }],
    ['json', { outputFile: './test-results/e2e-results.json' }],
    ['junit', { outputFile: './test-results/e2e-results.xml' }]
  ],
  
  // 全局测试配置
  use: {
    // 基础URL
    baseURL: 'http://localhost:3000',
    
    // 浏览器设置
    headless: !!process.env.CI,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // 截图和视频
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // 超时设置
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // 其他设置
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  },

  // 项目配置 - 不同浏览器
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
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // 移动端测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // 平板测试
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    }
  ],

  // Web服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  // 输出目录
  outputDir: './test-results/e2e-artifacts',
  
  // 全局设置和清理
  globalSetup: './src/test/e2e/global-setup.ts',
  globalTeardown: './src/test/e2e/global-teardown.ts',
  
  // 测试超时
  timeout: 30000,
  expect: {
    timeout: 5000
  }
});
