/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// base は GitHub Pages 公開用。リポジトリ名と一致させること（真っ白対策）。
export default defineConfig({
  base: '/vrm-inspector/',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
