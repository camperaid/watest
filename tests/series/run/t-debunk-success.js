import {
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
      files: ['t_testo.js'],
    },
    'tests/unit/t_testo.js': {
      test() {
        success(`Testo`);
      },
    },
  };

  const expected_out_for_success = [
    '\x1B[38;5;99mStarted\x1B[0m mac/',
    '\x1B[38;5;99mStarted\x1B[0m mac/unit',
    '!Running: mac/unit/t_testo.js, path: tests/unit/t_testo.js',
    '\x1B[32mOk:\x1B[0m Testo',
    '>mac/unit/t_testo.js completed in',
    '\x1B[38;5;243mCompleted\x1B[0m mac/unit',
    '\x1B[102mSuccess!\x1B[0m Total: 1',
    '\x1B[38;5;243mCompleted\x1B[0m mac/',
  ];

  const expected_stdout = [
    ...settings_preamble(),
    ...expected_out_for_success,
    ...expected_out_for_success,
    ...expected_out_for_success,
    ...expected_out_for_success,
    ...expected_out_for_success,

    'Elapsed:',
    'Testsuite: shutdown',
  ];

  const expected_stderr = [];

  await is_test_output(
    () => MockSeries.run([], { ts, debunk: true }),
    expected_stdout,
    expected_stderr,
    'debunk success',
  );
}
