/**
 * MingLog Vitest 测试配置
 * 配置单元测试和集成测试环境
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // 测试环境配置
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
        '**/build/',
        '**/*.stories.*',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        // 关键模块更高的覆盖率要求
        'src/components/graph/': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/search/': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/services/': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },

    // 测试文件匹配模式
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

    // 测试超时配置
    testTimeout: 10000,
    hookTimeout: 10000,

    // 并发配置 (vitest 3.x)
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    },

    // 监听模式配置
    watch: false,

    // 报告器配置 (vitest 3.x)
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/results.html'
    },

    // 模拟配置
    deps: {
      inline: ['@testing-library/jest-dom']
    }
  },

  // 路径解析
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@test': path.resolve(__dirname, './src/test')
    }
  },

  // 定义全局变量
  define: {
    __TEST__: true,
    __DEV__: true
  }
});
