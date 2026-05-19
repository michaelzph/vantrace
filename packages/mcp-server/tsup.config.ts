import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  dts: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
