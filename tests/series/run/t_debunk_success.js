'use strict';

const { is_test_output, MockSeries, success } = require('../test.js');

module.exports.test = async () => {
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
    '!Running: mac/unit/t_testo.js, path: tests/unit/t_testo.js',
    '\x1B[32mOk:\x1B[0m Testo',
    '>mac/unit/t_testo.js completed in',
    '\x1B[38;5;243mCompleted\x1B[0m mac/unit',
    'Logs are written to',
    '\x1B[38;5;243mCompleted\x1B[0m mac/',
    '\x1B[102mSuccess!\x1B[0m Total: 1',
    'Logs are written to',
  ];

  const expected_stdout = [
    ...expected_out_for_success,
    ...expected_out_for_success,
    ...expected_out_for_success,
    ...expected_out_for_success,
    ...expected_out_for_success,

    'Testsuite: shutdown',
    'Elapsed:',
    'Logs are written to',
  ];

  const expected_stderr = [];

  await is_test_output(
    () => MockSeries.run([], { ts, debunk: true }),
    expected_stdout,
    expected_stderr,
    'debunk success'
  );
};
