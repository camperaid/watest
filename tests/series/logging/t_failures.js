import {
  completed_checkers,
  MockSeries,
  createMockLogPipe,
  format_completed,
  format_failures,
  format_ok,
  format_started,
  format_success,
  stderr_format_failure,
  is,
  success,
  fail,
  running_checker,
} from '../test.js';

import settings from '../../../core/settings.js';

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

  const LogPipe = createMockLogPipe();
  LogPipe.suppressStdStreams();
  try {
    await MockSeries.run([], { ts, LogPipe });
  } finally {
    LogPipe.restoreStdStreams();
  }

  const buffers = new Map(LogPipe.FileStream.getLoggingBuffers());

  let path = `${settings.invocation}`;
  is(
    buffers.get(`${path}/log`),
    [
      format_started(`${path}/`),
      format_failures(1, `${path}/unit/core/t_presto.js`),
      format_failures(1, 1),
      format_completed(`${path}/`),
    ],
    `logging buffer #1 for ${path}`,
  );

  path = `${settings.invocation}/unit`;
  is(
    buffers.get(`${path}/log`),
    [
      format_started(path),
      format_failures(1, `${path}/core/t_presto.js`),
      format_failures(1, 1, path),
      format_completed(path),
    ],
    `logging buffer #2 for ${path}`,
  );

  path = `${settings.invocation}/unit/base`;
  is(
    buffers.get(`${path}/log`),
    [
      format_started(path),
      running_checker(
        `${path}/t_testo.js`,
        `tests/unit/base/t_testo.js`,
      ).trim(),
      format_ok('Testo'),
      ...completed_checkers({
        name: `${path}/t_testo.js`,
      }).filter(l => l),
      format_success(1, path),
      format_completed(path),
    ],
    `logging buffer #3 for ${path}`,
  );

  path = `${settings.invocation}/unit/core`;
  is(
    buffers.get(`${path}/log`),
    [
      format_started(path),
      running_checker(
        `${path}/t_presto.js`,
        `tests/unit/core/t_presto.js`,
      ).trim(),
      stderr_format_failure('Presto'),
      stderr_format_failure(`has 1 failure(s)`, `>${path}/t_presto.js`),
      ...completed_checkers({
        name: `${path}/t_presto.js`,
      }).filter(l => l),
      format_failures(1, `${path}/t_presto.js`),
      format_failures(1, 0, path),
      format_completed(path),
    ],
    `logging buffer #4 for ${path}/log`,
  );
}
