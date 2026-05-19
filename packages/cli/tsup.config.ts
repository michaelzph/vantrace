import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.tsx'],
  format: ['esm'],
  dts: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
