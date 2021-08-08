'use strict';

const { Core } = require('../../core/core.js');
const { Series } = require('../../core/series.js');

const scripts = [
  '../../core/util.js',
  '../../core/base.js',
  '../../core/format.js',
  './mock_series.js',
];
for (let script of scripts) {
  let script_exports = require(script);
  for (let e in script_exports) {
    module.exports[e] = script_exports[e];
  }
}

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

module.exports.Series = Series;

/**
 * Message output checkers.
 */
module.exports.completed_checkers = ({
  name,
  intermittents,
  todos,
  warnings,
}) => {
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
};

module.exports.logswritten_checker = got =>
  got.startsWith('Logs are written to');

module.exports.running_checker = (name, path) =>
  `\n!Running: ${name}, path: ${path}\n\n`;

module.exports.make_perform_function = tests => async () => {
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
