import { is, parseGridArgs } from './test.js';

export async function test() {
  const args1 = parseGridArgs(['tests/e2e', 'tests/www', 'chrome', 'firefox']);
  is(args1.paths, ['tests/e2e', 'tests/www'], 'paths');
  is(args1.webdrivers, ['chrome', 'firefox'], 'webdrivers');

  const args2 = parseGridArgs([]);
  is(args2.paths, [], 'empty paths');
  is(args2.webdrivers, [], 'empty webdrivers');
}
