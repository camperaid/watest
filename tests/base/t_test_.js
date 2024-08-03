import { ok, test_is, test_contains } from '../../core/base.js';

export async function test() {
  // test_is/contains
  ok(test_is(3, 3), 'test_is');
  ok(test_contains([0, 1], [1]), 'test_contains');
}
