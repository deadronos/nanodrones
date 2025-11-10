import { defineConfig } from 'vitest/config';
import baseConfig from './vite.config';
import { mergeConfig, type UserConfig } from 'vite';
import path from 'path';

export default defineConfig(
  mergeConfig(baseConfig as UserConfig, {
    // Provide lightweight aliases for PlayCanvas during tests so the
    // real `playcanvas` package (which tries to access browser/GL APIs
    // at import time) doesn't block Vitest' pre-bundling/fork startup.
    // These aliases point to local test-only stubs under `src/test-mocks`.
    resolve: {
      alias: [
        { find: 'playcanvas', replacement: path.resolve(__dirname, 'src/test-mocks/playcanvas.ts') },
        { find: '@playcanvas/react', replacement: path.resolve(__dirname, 'src/test-mocks/playcanvas-react.ts') },
      ],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      // setup file for jest-dom matchers and testing-library cleanup
      setupFiles: ['./src/setupTests.ts'],
      // Look for tests inside `src` and `tests` folders
      include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', 'public'],
      watch: false,
      pool: 'threads',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        all: true,
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/index.tsx', 'src/**/*.d.ts', 'src/assets/**'],
      },
      deps: {
        // Avoid inlining the real PlayCanvas — we alias it to a lightweight
        // stub above. Keep the inline list empty so Vite doesn't attempt to
        // pre-bundle the real package which can hang in Node.
        inline: [],
      },
    },
  }),
);
