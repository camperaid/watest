'use strict';

const api = require('../../index.js');
const { ok } = api;

module.exports.test = async () => {
  const props = [
    'AppDriver',
    'ControlDriver',
    'assert',
    'contains',
    'failed',
    'fail',
    'group',
    'is',
    'is_output',
    'info',
    'inspect',
    'not_reached',
    'ok',
    'scope',
    'start_session',
    'success',
    'todo',
    'test_is',
    'test_contains',
    'tmp_storage_dir',
    'warn',
  ];

  for (let prop of props) {
    ok(prop in api, `${prop} present`);
  }
};
