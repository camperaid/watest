import { is, run_e2e_tests } from './test.js';

export async function test() {
  let output = await run_e2e_tests('wd-single', {
    webdrivers: ['firefox'],
  });
  is(
    output.stdout,
    [
      '\x1B[38;5;99mStarted\x1B[0m sample/',
      '\x1B[38;5;99mStarted\x1B[0m sample/firefox',
      '!Running: sample/firefox/t-test.js, path: tests/t-test.js',
      '\x1B[32mOk:\x1B[0m Webdriver Works!',
      '>sample/firefox/t-test.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m sample/firefox',
      'Elapsed:',
      'Testsuite: shutdown',
      '\x1B[102mSuccess!\x1B[0m Total: 1',
      '\x1B[38;5;243mCompleted\x1B[0m sample/',
      'Elapsed:',
      'Testsuite: shutdown',
    ],
    'stdout',
  );

  is(output.stderr, [], 'stderr');
}
