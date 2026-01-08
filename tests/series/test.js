import { Core } from '../../core/core.js';
import { Series } from '../../core/series.js';

function build_tests(tests) {
  return tests.map(t => ({
    name: t.name,
    path: t.path,
    func: t.func,
    subtests: t.subtests && build_tests(t.subtests),
    failures_info: Series.failuresInfo({
      failures: t.failures || [],
      webdriver: 'firefox',
      platform: process.platform,
      testname: t.name,
    }),
  }));
}

/**
 * Dummy mock LogPipe.
 */
class MockLogPipe {
  attach() {
    return Promise.resolve();
  }
  release() {
    return Promise.resolve();
  }
  logToFile() {}
}

export * from '../../core/util.js';
export * from '../../core/base.js';
export * from '../../core/format.js';
export * from './mock-series.js';

export { Series };

/**
 * Message output checkers.
 */
export function completed_checkers({ name, intermittents, todos, warnings }) {
  let checkers = [];
  if (intermittents) {
    checkers.push(`>${name} has ${intermittents} intermittent(s)`);
  }
  if (todos) {
    checkers.push(`>${name} has ${todos} todo(s)`);
  }
  if (warnings) {
    checkers.push(`>${name} has ${warnings} warnings(s)`);
  }
  checkers.push(got => got.startsWith(`>${name} completed in`));
  return checkers;
}

export function logswritten_checker(got) {
  return got.startsWith('Logs are written to');
}

export function running_checker(name, path) {
  return `\n!Running: ${name}, path: ${path}\n\n`;
}

export function make_perform_function(tests) {
  return async () => {
    const series = new Series('tests/', {
      core: new Core(),
      LogPipe: new MockLogPipe(),
    });
    try {
      await series.perform({ folder: 'tests/', tests: build_tests(tests) });
    } finally {
      series.shutdown();
    }
  };
}
