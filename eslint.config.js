import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';

export default [
  // Копия из kanban_only без изменений: содержит директиву для правила react-hooks, которого в проекте нет
  { ignores: ['client/src/kanban/hooks/useFlipDrag.js'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
    },
  },
  {
    files: ['server/test/**/*.js'],
    languageOptions: { globals: { ...globals.jest } },
  },
];
