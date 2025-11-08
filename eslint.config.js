import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // ignore build and dependency folders
  globalIgnores(['dist', 'node_modules', 'public']),
  // TypeScript + React files
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: ['**/*.d.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'warn',
      // allow unused args that start with underscore
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  // JavaScript-only files (fallback)
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      globals: globals.browser,
    },
  },
])
