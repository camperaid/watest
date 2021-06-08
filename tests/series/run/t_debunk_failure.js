'use strict';

const {
  completed_checkers,
  format_completed,
  format_failure,
  format_failures,
  is_output,
  MockSeries,
  logswritten_checker,
  running_checker,
  fail,
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
        fail(`Testo`);
      },
    },
  };

  const expected_stdout = [
    // t_presto.js 1st failure
    running_checker(`${invocation}/unit/t_testo.js`, `tests/unit/t_testo.js`),
    ...completed_checkers({
      context: `${invocation}/unit`,
      name: `${invocation}/unit/t_testo.js`,
    }),
    logswritten_checker,
    format_completed(`${invocation}/`),
    format_failures(1, 'mac/unit/t_testo.js'),
    format_failures(1, 0),
    logswritten_checker,

    'Testsuite: shutdown',
    logswritten_checker,
  ];

  const expected_stderr = [
    format_failure(`Testo`),
    format_failure('has 1 failure(s)', '>mac/unit/t_testo.js'),
  ];

  await is_output(
    () => MockSeries.run([], { ts, debunk: true }),
    expected_stdout,
    expected_stderr,
    'debunk failure'
  );
};
