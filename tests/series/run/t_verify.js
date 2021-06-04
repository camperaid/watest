'use strict';

const {
  completed_checkers,
  fail,
  format_completed,
  format_failure,
  format_failures,
  format_ok,
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
    // t_testo.js success
    running_checker(
      `${invocation}/unit/base/t_testo.js`,
      `tests/unit/base/t_testo.js`
    ),
    format_ok(`Testo`),
    ...completed_checkers({
      context: `${invocation}/unit/base`,
      name: `${invocation}/unit/base/t_testo.js`,
    }),
    logswritten_checker,

    // t_presto.js 1st failure
    running_checker(
      `${invocation}/unit/core/t_presto.js`,
      `tests/unit/core/t_presto.js`
    ),
    ...completed_checkers({
      context: `${invocation}/unit/core`,
      name: `${invocation}/unit/core/t_presto.js`,
    }),
    logswritten_checker,
    format_completed(`${invocation}/unit`),
    logswritten_checker,
    format_completed(`${invocation}/`),
    format_failures(1, 'mac/unit/core/t_presto.js'),
    format_failures(1, 1),
    logswritten_checker,

    // t_presto.js 2nd failure
    running_checker(
      `${invocation}/unit/core2/t_presto.js`,
      `tests/unit/core/t_presto.js`
    ),
    ...completed_checkers({
      context: `${invocation}/unit/core2`,
      name: `${invocation}/unit/core2/t_presto.js`,
    }),
    logswritten_checker,
    format_completed(`${invocation}/unit`),
    logswritten_checker,
    format_completed(`${invocation}/`),
    format_failures(1, 'mac/unit/core2/t_presto.js'),
    format_failures(1, 0),
    logswritten_checker,

    'Testsuite: shutdown',
    logswritten_checker,
  ];

  const expected_stderr = [
    format_failure(`Presto`),
    format_failure('has 1 failure(s)', '>mac/unit/core/t_presto.js'),
    format_failure(`Presto`),
    format_failure('has 1 failure(s)', '>mac/unit/core2/t_presto.js'),
  ];

  await is_output(
    () => MockSeries.run('', { ts, verify: true }),
    expected_stdout,
    expected_stderr,
    'nested'
  );
};
