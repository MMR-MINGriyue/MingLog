import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Base path for assets - use relative paths for Tauri
  base: './',

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1421,
    strictPort: false,
    host: '0.0.0.0',
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // 3. to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ['VITE_', 'TAURI_'],

  build: {
    // Tauri supports es2021
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // 代码分割优化 - 只分割实际存在的包
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor'
            }
            if (id.includes('i18next')) {
              return 'i18n'
            }
            if (id.includes('lucide-react')) {
              return 'ui'
            }
          }
        },
      },
    },
    // 构建性能优化
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@minglog/core': resolve(__dirname, '../../packages/core/src'),
      '@minglog/graph': resolve(__dirname, '../../packages/graph/src'),
      '@minglog/mindmap': resolve(__dirname, '../../packages/mindmap/src'),
      '@minglog/ui': resolve(__dirname, '../../packages/ui/src'),
    },
  },

  css: {
    postcss: './postcss.config.js',
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },

  // 暂时忽略TypeScript错误以便启动开发服务器
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
})
