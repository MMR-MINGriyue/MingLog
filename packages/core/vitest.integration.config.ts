/**
 * MingLog 集成测试配置
 * 专门用于核心功能验证的集成测试
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    // 测试环境配置
    environment: 'jsdom',
    
    // 全局设置
    globals: true,
    
    // 测试文件匹配模式
    include: [
      'src/test/integration/**/*.test.ts',
      'src/test/integration/**/*.test.tsx'
    ],
    
    // 排除文件
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**'
    ],
    
    // 测试超时设置
    testTimeout: 60000, // 60秒，集成测试可能需要更长时间
    hookTimeout: 30000, // 30秒
    
    // 并发设置
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    
    // 重试设置
    retry: 2, // 集成测试失败时重试2次
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/integration',
      
      // 覆盖率阈值
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      },
      
      // 包含的文件
      include: [
        'src/**/*.ts',
        'src/**/*.tsx'
      ],
      
      // 排除的文件
      exclude: [
        'src/test/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.spec.ts',
        'src/**/*.spec.tsx',
        'src/**/*.d.ts',
        'src/types/**',
        'src/**/*.stories.tsx'
      ]
    },
    
    // 报告器配置
    reporter: [
      'verbose',
      'json',
      'html'
    ],
    
    // 输出配置
    outputFile: {
      json: './test-results/integration-results.json',
      html: './test-results/integration-results.html'
    },
    
    // 设置文件
    setupFiles: [
      './src/test/setup/integration-setup.ts'
    ],
    
    // 监听模式排除
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'test-results/**'
    ],
    
    // 性能配置
    isolate: true, // 每个测试文件在独立环境中运行
    pool: 'threads',
    
    // 环境变量
    env: {
      NODE_ENV: 'test',
      MINGLOG_ENV: 'integration-test',
      MINGLOG_DEBUG: 'true'
    }
  },
  
  // 解析配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/test': path.resolve(__dirname, './src/test')
    }
  },
  
  // 定义全局变量
  define: {
    __TEST_ENV__: '"integration"',
    __MINGLOG_VERSION__: '"1.0.0"',
    __MINGLOG_BUILD__: '"integration-test"'
  },
  
  // 优化配置
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@testing-library/react',
      '@testing-library/user-event',
      '@testing-library/jest-dom'
    ]
  }
});
