import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', '.kilo/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        browser: true,
        es2020: true,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['api/**/*.js', 'api/**/*.ts'],
    languageOptions: {
      globals: {
        node: true,
        process: 'readonly',
      },
    },
  },
  {
    files: ['public/service-worker.js'],
    languageOptions: {
      globals: {
        serviceworker: true,
        self: 'readonly',
        clients: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        location: 'readonly',
      },
    },
  }
);