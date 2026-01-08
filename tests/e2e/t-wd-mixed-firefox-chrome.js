import { is, run_e2e_tests } from './test.js';

export async function test() {
  let output = await run_e2e_tests('wd-mixed', {
    webdrivers: ['firefox', 'chrome'],
  });
  is(
    output.stdout,
    [
      '\x1B[38;5;99mStarted\x1B[0m sample/',
      '\x1B[38;5;99mStarted\x1B[0m sample/unit',
      '!Running: sample/unit/t-test.js, path: tests/unit/t-test.js',
      '\x1B[32mOk:\x1B[0m Unit works!',
      '>sample/unit/t-test.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m sample/unit',
      '\x1B[38;5;99mStarted\x1B[0m sample/ui',
      '\x1B[38;5;99mStarted\x1B[0m sample/ui/firefox',
      '!Running: sample/ui/firefox/t-test.js, path: tests/ui/t-test.js',
      '\x1B[32mOk:\x1B[0m Webdriver Works!',
      '>sample/ui/firefox/t-test.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m sample/ui/firefox',
      'Elapsed:',
      'Testsuite: shutdown',
      '\x1B[38;5;99mStarted\x1B[0m sample/ui/chrome',
      '!Running: sample/ui/chrome/t-test.js, path: tests/ui/t-test.js',
      '\x1B[32mOk:\x1B[0m Webdriver Works!',
      '>sample/ui/chrome/t-test.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m sample/ui/chrome',
      '\x1B[38;5;243mCompleted\x1B[0m sample/ui',
      '\x1B[102mSuccess!\x1B[0m Total: 3',
      '\x1B[38;5;243mCompleted\x1B[0m sample/',
      'Elapsed:',
      'Testsuite: shutdown',
    ],
    'stdout',
  );

  is(output.stderr, [], 'stderr');
}
