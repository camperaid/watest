import {
  MockSeries,
  createMockLogPipe,
  fail,
  is,
  stderr_format_failure,
  success,
} from '../test.js';
import settings from '../../../core/settings.js';

const completed_in = name => got => got.startsWith(`>${name} completed in`);

export async function test() {
  const { webdrivers } = settings;

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

  const LogPipe = createMockLogPipe();
  LogPipe.suppressStdStreams();
  try {
    await MockSeries.run([], {
      ts,
      LogPipe,
      invocation: 'mac',
      verify: true,
      suppressChildProcessInitiation: true,
    });
  } finally {
    LogPipe.restoreStdStreams();
  }

  const chromeLogs = webdrivers.includes('chrome')
    ? [
        [
          'mac/webdriver/chrome/log',
          [
            '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/chrome',
            '\x1B[102mmac/webdriver/chrome\x1B[0m Total: 1',
            '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome',
          ],
        ],
        [
          'mac/webdriver/chrome/end-to-end/log',
          [
            '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/chrome/end-to-end',
            '\x1B[102mmac/webdriver/chrome/end-to-end\x1B[0m Total: 1',
            '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome/end-to-end',
          ],
        ],
        [
          'mac/webdriver/chrome/end-to-end/history/log',
          [
            '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/chrome/end-to-end/history',
            '!Running: mac/webdriver/chrome/end-to-end/history/t_history.js, path: tests/webdriver/end-to-end/history/t_history.js',
            stderr_format_failure('TestoFail'),
            stderr_format_failure(
              'has 1 failure(s)',
              '>mac/webdriver/chrome/end-to-end/history/t_history.js',
            ),
            completed_in(
              'mac/webdriver/chrome/end-to-end/history/t_history.js',
            ),
            '\x1B[41m\x1B[37m>mac/webdriver/chrome/end-to-end/history/t_history.js\x1B[0m Failure count: 1',
            '\x1B[41m\x1B[37mmac/webdriver/chrome/end-to-end/history > failed\x1B[0m Passed: 0. Failed: 1',
            '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome/end-to-end/history',
          ],
        ],
        [
          'mac/webdriver/chrome/end-to-end/history2/log',
          [
            '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/chrome/end-to-end/history2',
            '!Running: mac/webdriver/chrome/end-to-end/history2/t_history.js, path: tests/webdriver/end-to-end/history/t_history.js',
            '\x1B[32mOk:\x1B[0m TestoOk',
            completed_in(
              'mac/webdriver/chrome/end-to-end/history2/t_history.js',
            ),
            '\x1B[102mmac/webdriver/chrome/end-to-end/history2\x1B[0m Total: 1',
            '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/chrome/end-to-end/history2',
          ],
        ],
      ]
    : [];

  const firefoxLogs = webdrivers.includes('firefox')
    ? [
        [
          'mac/webdriver/firefox/log',
          [
            '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/firefox',
            '\x1B[102mmac/webdriver/firefox\x1B[0m Total: 1',
            '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/firefox',
          ],
        ],
        [
          'mac/webdriver/firefox/end-to-end/log',
          [
            '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/firefox/end-to-end',
            '\x1B[102mmac/webdriver/firefox/end-to-end\x1B[0m Total: 1',
            '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/firefox/end-to-end',
          ],
        ],
        [
          'mac/webdriver/firefox/end-to-end/history/log',
          [
            '\x1B[38;5;99mStarted\x1B[0m mac/webdriver/firefox/end-to-end/history',
            '!Running: mac/webdriver/firefox/end-to-end/history/t_history.js, path: tests/webdriver/end-to-end/history/t_history.js',
            '\x1B[32mOk:\x1B[0m TestoOk',
            completed_in(
              'mac/webdriver/firefox/end-to-end/history/t_history.js',
            ),
            '\x1B[102mmac/webdriver/firefox/end-to-end/history\x1B[0m Total: 1',
            '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver/firefox/end-to-end/history',
          ],
        ],
      ]
    : [];

  const buffers = LogPipe.FileStream.getLoggingBuffers();
  is(
    buffers,
    [
      ['log', [got => got.startsWith('Elapsed:')]],
      [
        'mac/log',
        [
          '\x1B[38;5;99mStarted\x1B[0m mac/',
          '\x1B[102mSuccess!\x1B[0m Total: 1',
          '\x1B[38;5;243mCompleted\x1B[0m mac/',
        ],
      ],
      [
        'mac/webdriver/log',
        [
          '\x1B[38;5;99mStarted\x1B[0m mac/webdriver',
          '\x1B[102mmac/webdriver\x1B[0m Total: 1',
          '\x1B[38;5;243mCompleted\x1B[0m mac/webdriver',
        ],
      ],
      ...chromeLogs,
      ...firefoxLogs,
    ],
    'logging verify',
  );
}
