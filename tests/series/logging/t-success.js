import {
  completed_checkers,
  MockSeries,
  createMockLogPipe,
  format_completed,
  format_ok,
  format_started,
  format_success,
  is,
  success,
  running_checker,
} from '../test.js';

import { settings } from '../../../core/settings.js';

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
        success(`Presto`);
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
      format_success(2),
      format_completed(`${path}/`),
    ],
    `logging buffer for ${path}`,
  );

  path = `${settings.invocation}/unit`;
  is(
    buffers.get(`${path}/log`),
    [format_started(path), format_success(2, path), format_completed(path)],
    `logging buffer for ${path}`,
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
    `logging buffer for ${path}`,
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
      format_ok('Presto'),
      ...completed_checkers({
        name: `${path}/t_presto.js`,
      }).filter(l => l),
      format_success(1, path),
      format_completed(path),
    ],
    `logging buffer for ${path}/log`,
  );
}
