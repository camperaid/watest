'use strict';

const { is, run_e2e_tests } = require('./test.js');

module.exports.test = async () => {
  let output = await run_e2e_tests('wd_single', {
    webdrivers: ['firefox'],
  });
  is(
    output.stdout,
    [
      '\x1B[38;5;99mStarted\x1B[0m sample/',
      '\x1B[38;5;99mStarted\x1B[0m sample/firefox',
      '!Running: sample/firefox/t_test.js, path: tests/t_test.js',
      '\x1B[32mOk:\x1B[0m Webdriver Works!',
      '>sample/firefox/t_test.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m sample/firefox',
      'Testsuite: shutdown',
      'Elapsed:',
      '\x1B[102mSuccess!\x1B[0m Total: 1',
      '\x1B[38;5;243mCompleted\x1B[0m sample/',
      'Testsuite: shutdown',
      'Elapsed:',
    ],
    'stdout'
  );

  is(output.stderr, [], 'stderr');
};
