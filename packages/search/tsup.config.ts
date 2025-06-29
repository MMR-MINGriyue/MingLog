import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false, // Disable for now due to project reference issues
  clean: true,
  external: ['fuse.js'],
});
