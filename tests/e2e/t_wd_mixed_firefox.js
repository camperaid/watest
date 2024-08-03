import { is, run_e2e_tests } from './test.js';

export async function test() {
  let output = await run_e2e_tests('wd_mixed', {
    webdrivers: ['firefox'],
  });
  is(
    output.stdout,
    [
      '\x1B[38;5;99mStarted\x1B[0m sample/',
      '\x1B[38;5;99mStarted\x1B[0m sample/unit',
      '!Running: sample/unit/t_test.js, path: tests/unit/t_test.js',
      '\x1B[32mOk:\x1B[0m Unit works!',
      '>sample/unit/t_test.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m sample/unit',
      '\x1B[38;5;99mStarted\x1B[0m sample/ui',
      '\x1B[38;5;99mStarted\x1B[0m sample/ui/firefox',
      '!Running: sample/ui/firefox/t_test.js, path: tests/ui/t_test.js',
      '\x1B[32mOk:\x1B[0m Webdriver Works!',
      '>sample/ui/firefox/t_test.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m sample/ui/firefox',
      'Testsuite: shutdown',
      'Elapsed:',
      '\x1B[38;5;243mCompleted\x1B[0m sample/ui',
      '\x1B[102mSuccess!\x1B[0m Total: 2',
      '\x1B[38;5;243mCompleted\x1B[0m sample/',
      'Testsuite: shutdown',
      'Elapsed:',
    ],
    'stdout',
  );

  is(output.stderr, [], 'stderr');
}
