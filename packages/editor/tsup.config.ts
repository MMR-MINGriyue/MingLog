import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true, // 启用类型定义生成
  clean: true,
  external: ['react', 'react-dom'],
  sourcemap: true,
  tsconfig: './tsconfig.build.json',
});
