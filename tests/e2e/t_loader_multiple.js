import { is, run_e2e_tests } from './test.js';

export async function test() {
  let output = await run_e2e_tests('loader_multiple');
  is(
    output.stdout,
    [
      '\x1B[38;5;99mStarted\x1B[0m sample/',
      '\x1B[38;5;99mStarted\x1B[0m sample/base',
      '!Running: sample/base/t_btest.js, path: tests/base/t_btest.js',
      '\x1B[32mOk:\x1B[0m Mocked!, got: mocked',
      '>sample/base/t_btest.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m sample/base',
      'Elapsed:',
      'Testsuite: shutdown',
      '\x1B[38;5;99mStarted\x1B[0m sample/core',
      '!Running: sample/core/t_ctest.js, path: tests/core/t_ctest.js',
      '\x1B[32mOk:\x1B[0m Mocked!, got: mocked',
      '>sample/core/t_ctest.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m sample/core',
      'Elapsed:',
      'Testsuite: shutdown',
      '\x1B[102mSuccess!\x1B[0m Total: 2',
      '\x1B[38;5;243mCompleted\x1B[0m sample/',
      'Elapsed:',
      'Testsuite: shutdown',
    ],
    'stdout',
  );

  is(output.stderr, [], 'stderr');
}
