import { defineConfig } from 'vitest/config';
import baseConfig from './vite.config';
import { mergeConfig, type UserConfig } from 'vite';

export default defineConfig(
  mergeConfig(baseConfig as UserConfig, {
    test: {
      globals: true,
      environment: 'jsdom',
      // setup file for jest-dom matchers and testing-library cleanup
      setupFiles: ['./src/setupTests.ts'],
      // Look for tests inside `src` and `tests` folders
      include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', 'public'],
      watch: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        all: true,
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/index.tsx', 'src/**/*.d.ts', 'src/assets/**'],
      },
      deps: {
        // Inline problematic ESM/CJS packages if needed during dependency pre-bundling
        inline: ['@playcanvas/react', 'playcanvas'],
      },
    },
  }),
);
