'use strict';

const js = require('@eslint/js'); // eslint-disable-line n/no-unpublished-require
const nodePlugin = require('eslint-plugin-n'); // eslint-disable-line n/no-unpublished-require

module.exports = [
  js.configs.recommended,
  nodePlugin.configs["flat/recommended-script"],
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
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
    languageOptions: {
      sourceType: 'module', // Use ES modules
    },
    settings: {
      node: {
        allowModules: ['watest'],
      },
    },
  },
];
