'use strict';

const {
  completed_checkers,
  MockSeries,
  LogPipeMockFileStream,
  format_completed,
  format_failure,
  format_failures,
  format_ok,
  format_started,
  format_success,
  is,
  success,
  fail,
  running_checker,
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

  const LogPipe = new LogPipeMockFileStream();
  LogPipe.suppressStdStreams();
  try {
    await MockSeries.run([], { ts, LogPipe });
  } finally {
    LogPipe.restoreStdStreams();
  }

  const buffers = new Map(LogPipe.MockFileStream.getLoggingBuffers());

  let path = `${invocation}`;
  is(
    buffers.get(`${path}/log`),
    [
      format_started(`${path}/`),
      format_completed(`${path}/`),
      format_failures(1, `${path}/unit/core/t_presto.js`),
      format_failures(1, 1),
    ],
    `logging buffer for ${path}`
  );

  path = `${invocation}/unit`;
  is(
    buffers.get(`${path}/log`),
    [
      format_started(path),
      format_completed(path),
      format_failures(1, `${path}/core/t_presto.js`),
      format_failures(1, 1, path),
    ],
    `logging buffer for ${path}`
  );

  path = `${invocation}/unit/base`;
  is(
    buffers.get(`${path}/log`),
    [
      format_started(path),
      running_checker(
        `${path}/t_testo.js`,
        `tests/unit/base/t_testo.js`
      ).trim(),
      format_ok('Testo'),
      ...completed_checkers({
        context: path,
        name: `${path}/t_testo.js`,
      }).filter(l => l),
      format_success(1, path),
    ],
    `logging buffer for ${path}`
  );

  path = `${invocation}/unit/core`;
  is(
    buffers.get(`${path}/log`),
    [
      format_started(path),
      running_checker(
        `${path}/t_presto.js`,
        `tests/unit/core/t_presto.js`
      ).trim(),
      format_failure('Presto'),
      format_failure(`has 1 failure(s)`, `>${path}/t_presto.js`),
      ...completed_checkers({
        context: path,
        name: `${path}/t_presto.js`,
      }).filter(l => l),
      format_failures(1, `${path}/t_presto.js`),
      format_failures(1, 0, path),
    ],
    `logging buffer for ${path}/log`
  );
};
