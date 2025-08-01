import { is, run_e2e_tests } from './test.js';

export async function test() {
  let output = await run_e2e_tests('single');
  is(
    output.stdout,
    [
      '\x1B[38;5;99mStarted\x1B[0m sample/',
      '!Running: sample/t_test.js, path: tests/t_test.js',
      '\x1B[32mOk:\x1B[0m works!',
      '>sample/t_test.js completed in',
      '\x1B[102mSuccess!\x1B[0m Total: 1',
      '\x1B[38;5;243mCompleted\x1B[0m sample/',
      'Elapsed:',
      'Testsuite: shutdown',
    ],
    'stdout',
  );

  is(output.stderr, [], 'stderr');
}
