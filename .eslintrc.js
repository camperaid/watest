'use strict';

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:node/recommended'],
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    'node/no-unsupported-features/es-syntax': [
      'error',
      { ignores: ['dynamicImport'] },
    ],
  },
  overrides: [
    {
      files: ['bin/watest.js'],
      rules: {
        'no-process-exit': 'off',
      },
    },
    {
      files: ['tests/e2e/samples/**'],
      settings: {
        node: {
          allowModules: ['watest'],
        },
      },
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        'node/no-unsupported-features/es-syntax': [
          'error',
          {
            ignores: ['modules'],
          },
        ],
      },
    },
  ],
};
