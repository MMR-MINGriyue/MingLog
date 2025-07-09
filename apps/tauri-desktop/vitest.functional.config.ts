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
    include: [
      'src/test/functional.test.ts',
      'src/tests/error-reporting.e2e.test.ts',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'src-tauri/',
      '.{idea,git,cache,output,temp}/',
    ],
    // 功能测试需要更长的超时时间
    testTimeout: 30000,
    hookTimeout: 30000,
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
