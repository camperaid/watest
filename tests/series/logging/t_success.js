'use strict';

const {
  completed_checkers,
  MockSeries,
  LogPipeMockFileStream,
  format_completed,
  format_ok,
  format_success,
  is,
  success,
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
        success(`Presto`);
      },
    },
  };

  const LogPipe = new LogPipeMockFileStream();
  LogPipe.suppressStdStreams();
  try {
    await MockSeries.run('', { ts, LogPipe });
  } finally {
    LogPipe.restoreStdStreams();
  }

  const buffers = new Map(LogPipe.MockFileStream.getLoggingBuffers());

  let path = `${invocation}`;
  is(
    buffers.get(`${path}/log`),
    [format_completed(`${path}/`), format_success(2)],
    `logging buffer for ${path}`
  );

  path = `${invocation}/unit`;
  is(
    buffers.get(`${path}/log`),
    [format_completed(path), format_success(2, path)],
    `logging buffer for ${path}`
  );

  path = `${invocation}/unit/base`;
  is(
    buffers.get(`${path}/log`),
    [
      running_checker(`${path}/t_testo.js`, `tests/unit/base/t_testo.js`).trim(),
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
      running_checker(`${path}/t_presto.js`, `tests/unit/core/t_presto.js`).trim(),
      format_ok('Presto'),
      ...completed_checkers({
        context: path,
        name: `${path}/t_presto.js`,
      }).filter(l => l),
      format_success(1, path),
    ],
    `logging buffer for ${path}/log`
  );
};
