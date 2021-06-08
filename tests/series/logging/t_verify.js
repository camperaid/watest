'use strict';

const {
  MockSeries,
  LogPipeMockFileStream,
  fail,
  is,
  success,
} = require('../test.js');

module.exports.test = async () => {
  let failed = false;
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
        folders: ['history'],
      },
    },
    'tests/webdriver/end-to-end/history': {
      files: ['t_history.js'],
    },
    'tests/webdriver/end-to-end/history/t_history.js': {
      test() {
        failed ? success(`TestoOk`) : fail(`TestoFail`);
        failed = true;
      },
    },
  };

  const LogPipe = new LogPipeMockFileStream();
  LogPipe.suppressStdStreams();
  try {
    await MockSeries.run([], { ts, LogPipe, invocation: 'mac', verify: true });
  } finally {
    LogPipe.restoreStdStreams();
  }

  const buffers = LogPipe.MockFileStream.getLoggingBuffers();
  is(
    buffers,
    [
      ['log', ['Testsuite: shutdown']],
      [
        'mac/log',
        [
          '\x1B[38;5;243mCompleted\x1B[0m mac/',
          '\x1B[102mSuccess!\x1B[0m Total: 1',
        ],
      ],
      [
        'mac/webdriver/log',
        [
          '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver',
          '\x1B[102mmac/webdriver\x1B[0m Total: 1',
        ],
      ],
      [
        'mac/webdriver/chrome/log',
        [
          '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome',
          '\x1B[102mmac/webdriver/chrome\x1B[0m Total: 1',
        ],
      ],
      [
        'mac/webdriver/chrome/end-to-end/log',
        [
          '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome/end-to-end',
          '\x1B[102mmac/webdriver/chrome/end-to-end\x1B[0m Total: 1',
        ],
      ],
      [
        'mac/webdriver/chrome/end-to-end/history/log',
        [
          '!Running: mac/webdriver/chrome/end-to-end/history/t_history.js, path: tests/webdriver/end-to-end/history/t_history.js',
          '\x1B[31mFailed:\x1B[0m TestoFail',
          '\x1B[31m>mac/webdriver/chrome/end-to-end/history/t_history.js\x1B[0m has 1 failure(s)',
          '>mac/webdriver/chrome/end-to-end/history/t_history.js completed in 0ms',
          '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome/end-to-end/history',
          '\x1B[41m\x1B[37m>mac/webdriver/chrome/end-to-end/history/t_history.js\x1B[0m Failure count: 1',
          '\x1B[41m\x1B[37mmac/webdriver/chrome/end-to-end/history > failed\x1B[0m Passed: 0. Failed: 1',
        ],
      ],
      [
        'mac/webdriver/firefox/log',
        [
          '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/firefox',
          '\x1B[102mmac/webdriver/firefox\x1B[0m Total: 1',
        ],
      ],
      [
        'mac/webdriver/firefox/end-to-end/log',
        [
          '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/firefox/end-to-end',
          '\x1B[102mmac/webdriver/firefox/end-to-end\x1B[0m Total: 1',
        ],
      ],
      [
        'mac/webdriver/firefox/end-to-end/history/log',
        [
          '!Running: mac/webdriver/firefox/end-to-end/history/t_history.js, path: tests/webdriver/end-to-end/history/t_history.js',
          '\x1B[32mOk:\x1B[0m TestoOk',
          '>mac/webdriver/firefox/end-to-end/history/t_history.js completed in 0ms',
          '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/firefox/end-to-end/history',
          '\x1B[102mmac/webdriver/firefox/end-to-end/history\x1B[0m Total: 1',
        ],
      ],
      [
        'mac/webdriver/chrome/end-to-end/history2/log',
        [
          '!Running: mac/webdriver/chrome/end-to-end/history2/t_history.js, path: tests/webdriver/end-to-end/history/t_history.js',
          '\x1B[32mOk:\x1B[0m TestoOk',
          '>mac/webdriver/chrome/end-to-end/history2/t_history.js completed in 0ms',
          '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome/end-to-end/history2',
          '\x1B[102mmac/webdriver/chrome/end-to-end/history2\x1B[0m Total: 1',
        ],
      ],
    ],
    'logging verify'
  );
};
