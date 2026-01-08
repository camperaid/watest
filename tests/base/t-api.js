import * as api from '../../index.js';
const { ok } = api;

export async function test() {
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
    'warn',
  ];

  for (let prop of props) {
    ok(prop in api, `${prop} present`);
  }
}
