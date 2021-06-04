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
  rules: {},
  overrides: [
    {
      files: ['bin/watest.js'],
      rules: {
        'no-process-exit': 'off',
      },
    },
  ],
};
