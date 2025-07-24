import js from '@eslint/js'; // eslint-disable-line n/no-unpublished-import
import nodePlugin from 'eslint-plugin-n'; // eslint-disable-line n/no-unpublished-import

export default [
  js.configs.recommended,
  nodePlugin.configs['flat/recommended-script'],
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
  {
    files: ['bin/watest.js'],
    rules: {
      'n/no-process-exit': 'off',
    },
  },
  {
    files: ['tests/e2e/samples/**'],
    settings: {
      node: {
        allowModules: ['watest'],
      },
    },
  },
];
