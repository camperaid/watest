import {
  fail,
  is_test_output,
  MockSeries,
  success,
  settings_preamble,
} from '../test.js';

export async function test() {
  const ts = {
    'tests': {
      meta: {
        folders: ['unit'],
      },
    },
    'tests/unit': {
      meta: {
        folders: ['base', 'core'],
      },
    },
    'tests/unit/base': {
      files: ['t_testo.js'],
    },
    'tests/unit/base/t_testo.js': {
      test() {
        success(`Testo`);
      },
    },
    'tests/unit/core': {
      files: ['t_presto.js'],
    },
    'tests/unit/core/t_presto.js': {
      test() {
        fail(`Presto`);
      },
    },
  };

  const expected_stdout = [
    ...settings_preamble(),
    '\x1B[38;5;99mStarted\x1B[0m mac/',
    '\x1B[38;5;99mStarted\x1B[0m mac/unit',
    '\x1B[38;5;99mStarted\x1B[0m mac/unit/base',
    '!Running: mac/unit/base/t_testo.js, path: tests/unit/base/t_testo.js',
    '\x1B[32mOk:\x1B[0m Testo',
    '>mac/unit/base/t_testo.js completed in',
    '\x1B[38;5;243mCompleted\x1B[0m mac/unit/base',
    '\x1B[38;5;99mStarted\x1B[0m mac/unit/core',
    '!Running: mac/unit/core/t_presto.js, path: tests/unit/core/t_presto.js',
    '>mac/unit/core/t_presto.js completed in',
    '\x1B[38;5;243mCompleted\x1B[0m mac/unit/core',
    '\x1B[38;5;243mCompleted\x1B[0m mac/unit',
    '\x1B[41m\x1B[37m>mac/unit/core/t_presto.js\x1B[0m Failure count: 1',
    '\x1B[41m\x1B[37mFailed!\x1B[0m Passed: 1. Failed: 1',
    '\x1B[38;5;243mCompleted\x1B[0m mac/',
    '\x1B[38;5;99mStarted\x1B[0m mac/',
    '\x1B[38;5;99mStarted\x1B[0m mac/unit',
    '\x1B[38;5;99mStarted\x1B[0m mac/unit/core-verify',
    '!Running: mac/unit/core-verify/t_presto.js, path: tests/unit/core/t_presto.js',
    '>mac/unit/core-verify/t_presto.js completed in',
    '\x1B[38;5;243mCompleted\x1B[0m mac/unit/core-verify',
    '\x1B[38;5;243mCompleted\x1B[0m mac/unit',
    '\x1B[41m\x1B[37m>mac/unit/core-verify/t_presto.js\x1B[0m Failure count: 1',
    '\x1B[41m\x1B[37mFailed!\x1B[0m Passed: 0. Failed: 1',
    '\x1B[38;5;243mCompleted\x1B[0m mac/',
    'Elapsed:',
    'Testsuite: shutdown',
  ];

  const expected_stderr = [
    '\x1B[31mFailed:\x1B[0m Presto',
    '\x1B[31m>mac/unit/core/t_presto.js\x1B[0m has 1 failure(s)',
    '\x1B[31mFailed:\x1B[0m Presto',
    '\x1B[31m>mac/unit/core-verify/t_presto.js\x1B[0m has 1 failure(s)',
  ];

  await is_test_output(
    () => MockSeries.run([], { ts, verify: true }),
    expected_stdout,
    expected_stderr,
    'verify: nested',
  );
}
