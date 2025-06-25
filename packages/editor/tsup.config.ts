import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false, // Temporarily disabled for testing
  clean: true,
  external: ['react', 'react-dom'],
});
