'use strict';

const { fail, is_test_output, MockSeries, success } = require('../test.js');

module.exports.test = async () => {
  let testfailed = false;
  const ts = {
    'tests': {
      meta: {
        folders: ['webdriver'],
      },
    },
    'tests/webdriver': {
      meta: {
        folders: ['end-to-end'],
        webdriver: true,
      },
    },
    'tests/webdriver/end-to-end': {
      meta: {
        folders: ['sharing'],
      },
    },
    'tests/webdriver/end-to-end/sharing': {
      files: ['t_shared_editing.js'],
    },
    'tests/webdriver/end-to-end/sharing/t_shared_editing.js': {
      test() {
        testfailed ? success(`WDSuccessio`) : fail(`WDFailio`);
        testfailed = true;
      },
    },
  };

  const expected_stdout = [
    '\x1B[38;5;99mStarted\x1B[0m mac/',
    '\x1B[38;5;99mStarted\x1B[0m mac/webdriver',
    '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/chrome',
    '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/chrome/end-to-end',
    '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/chrome/end-to-end/sharing',
    '!Running: mac/webdriver/chrome/end-to-end/sharing/t_shared_editing.js, path: tests/webdriver/end-to-end/sharing/t_shared_editing.js',
    '>mac/webdriver/chrome/end-to-end/sharing/t_shared_editing.js completed in',
    '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome/end-to-end/sharing',
    'Logs are written to',
    '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome/end-to-end',
    'Logs are written to',
    '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome',
    'Logs are written to',
    '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/firefox',
    '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/firefox/end-to-end',
    '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/firefox/end-to-end/sharing',
    '!Running: mac/webdriver/firefox/end-to-end/sharing/t_shared_editing.js, path: tests/webdriver/end-to-end/sharing/t_shared_editing.js',
    '\x1B[32mOk:\x1B[0m WDSuccessio',
    '>mac/webdriver/firefox/end-to-end/sharing/t_shared_editing.js completed in',
    '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/firefox/end-to-end/sharing',
    'Logs are written to',
    '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/firefox/end-to-end',
    'Logs are written to',
    '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/firefox',
    'Logs are written to',
    '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver',
    'Logs are written to',
    '\x1B[41m\x1B[37m>mac/webdriver/chrome/end-to-end/sharing/t_shared_editing.js\x1B[0m Failure count: 1',
    '\x1B[41m\x1B[37mFailed!\x1B[0m Passed: 1. Failed: 1',
    '\x1B[38;5;243mCompleted\x1B[0m mac/',
    'Logs are written to',
    '\x1B[38;5;99mStarted\x1B[0m mac/',
    '\x1B[38;5;99mStarted\x1B[0m mac/webdriver',
    '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/chrome',
    '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/chrome/end-to-end',
    '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/chrome/end-to-end/sharing2',
    '!Running: mac/webdriver/chrome/end-to-end/sharing2/t_shared_editing.js, path: tests/webdriver/end-to-end/sharing/t_shared_editing.js',
    '\x1B[32mOk:\x1B[0m WDSuccessio',
    '>mac/webdriver/chrome/end-to-end/sharing2/t_shared_editing.js completed in',
    '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome/end-to-end/sharing2',
    'Logs are written to',
    '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome/end-to-end',
    'Logs are written to',
    '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome',
    'Logs are written to',
    '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver',
    'Logs are written to',
    '\x1B[102mSuccess!\x1B[0m Total: 1',
    '\x1B[38;5;243mCompleted\x1B[0m mac/',
    'Logs are written to',
    'Testsuite: shutdown',
    'Elapsed:',
    'Logs are written to',
  ];

  const expected_stderr = [
    '\x1B[31mFailed:\x1B[0m WDFailio',
    '\x1B[31m>mac/webdriver/chrome/end-to-end/sharing/t_shared_editing.js\x1B[0m has 1 failure(s)',
  ];

  await is_test_output(
    () =>
      MockSeries.run([], {
        ts,
        webdrivers: ['chrome', 'firefox'],
        verify: true,
      }),
    expected_stdout,
    expected_stderr,
    'verify_wd'
  );
};
