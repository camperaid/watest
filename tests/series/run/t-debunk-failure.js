import { is_test_output, MockSeries, fail } from '../test.js';

export async function test() {
  const ts = {
    'tests': {
      meta: {
        folders: ['unit'],
      },
    },
    'tests/unit': {
      files: ['t_testo.js'],
    },
    'tests/unit/t_testo.js': {
      test() {
        fail(`Testo`);
      },
    },
  };

  const expected_stdout = [
    'Settings: no temporary storage dir',
    'Settings: logging into /tmp',
    'Settings: chrome webdrivers',
    '\x1B[38;5;99mStarted\x1B[0m mac/',
    '\x1B[38;5;99mStarted\x1B[0m mac/unit',
    '!Running: mac/unit/t_testo.js, path: tests/unit/t_testo.js',
    '>mac/unit/t_testo.js completed in',
    '\x1B[38;5;243mCompleted\x1B[0m mac/unit',
    'Logs are written to',
    '\x1B[41m\x1B[37m>mac/unit/t_testo.js\x1B[0m Failure count: 1',
    '\x1B[41m\x1B[37mFailed!\x1B[0m Passed: 0. Failed: 1',
    '\x1B[38;5;243mCompleted\x1B[0m mac/',
    'Logs are written to',
    'Elapsed:',
    'Logs are written to',
    'Testsuite: shutdown',
  ];

  const expected_stderr = [
    '\x1B[31mFailed:\x1B[0m Testo',
    '\x1B[31m>mac/unit/t_testo.js\x1B[0m has 1 failure(s)',
  ];

  await is_test_output(
    () => MockSeries.run([], { ts, debunk: true }),
    expected_stdout,
    expected_stderr,
    'debunk failure',
  );
}
