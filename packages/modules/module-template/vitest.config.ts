/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      '.idea/',
      '.git/',
      '.cache/'
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    },
    watch: false,
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/results.html'
    },
    deps: {
      inline: ['@testing-library/jest-dom']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    __TEST_ENV__: '"unit"',
    __MODULE_VERSION__: '"1.0.0"'
  }
})
