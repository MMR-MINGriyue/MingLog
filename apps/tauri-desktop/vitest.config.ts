/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    alias: {
      '@tauri-apps/api/core': resolve(__dirname, 'src/test/mocks/tauri-core.js'),
      '@tauri-apps/api/tauri': resolve(__dirname, 'src/test/mocks/tauri-core.js'),
      '@tauri-apps/api/event': resolve(__dirname, 'src/test/mocks/tauri-event.js'),
      '@tauri-apps/api/dialog': resolve(__dirname, 'src/test/mocks/tauri-dialog.js'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'src-tauri/',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'src-tauri/',
      'src/test/functional.test.ts', // Functional tests need running app
      'src/test/e2e/**', // E2E tests should use Playwright
      'src/tests/error-reporting.e2e.test.ts', // E2E test
      '.{idea,git,cache,output,temp}/',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify('test'),
  },
})
