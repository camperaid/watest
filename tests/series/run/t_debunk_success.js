'use strict';

const {
  completed_checkers,
  format_completed,
  format_ok,
  format_success,
  is_output,
  MockSeries,
  logswritten_checker,
  running_checker,
  success,
} = require('../test.js');

const { invocation } = require('../../../core/settings.js');

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
    // t_testo.js success
    running_checker(`${invocation}/unit/t_testo.js`, `tests/unit/t_testo.js`),
    format_ok(`Testo`),
    ...completed_checkers({
      context: `${invocation}/unit`,
      name: `${invocation}/unit/t_testo.js`,
    }),
    logswritten_checker,
    format_completed(`${invocation}/`),
    format_success(1),
    logswritten_checker,
  ];

  const expected_stdout = [
    ...expected_out_for_success,
    ...expected_out_for_success,
    ...expected_out_for_success,
    ...expected_out_for_success,
    ...expected_out_for_success,

    'Testsuite: shutdown',
    logswritten_checker,
  ];

  const expected_stderr = [];

  await is_output(
    () => MockSeries.run('', { ts, debunk: true }),
    expected_stdout,
    expected_stderr,
    'debunk success'
  );
};
