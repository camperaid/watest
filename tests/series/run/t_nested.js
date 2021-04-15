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
        success(`Presto`);
      },
    },
  };

  await is_output(
    () => MockSeries.run('', { ts }),
    [
      running_checker(`${invocation}/unit/base/t_testo.js`, `tests/unit/base/t_testo.js`),
      format_ok(`Testo`),
      ...completed_checkers({
        context: `${invocation}/unit/base`,
        name: `${invocation}/unit/base/t_testo.js`,
      }),
      logswritten_checker,
      running_checker(`${invocation}/unit/core/t_presto.js`, `tests/unit/core/t_presto.js`),
      format_ok(`Presto`),
      ...completed_checkers({
        context: `${invocation}/unit/core`,
        name: `${invocation}/unit/core/t_presto.js`,
      }),
      logswritten_checker,
      format_completed(`${invocation}/unit`),
      logswritten_checker,
      format_completed(`${invocation}/`),
      format_success(2),
      logswritten_checker,
      'Testsuite: shutdown',
      logswritten_checker,
    ],
    [],
    'nested'
  );
};
