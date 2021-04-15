'use strict';

const testflow = require('../../core/core.js');
const { fail, core } = testflow;

const { scope } = require('../../webdriver/session.js');
const { TestExecutionError } = require('../../webdriver/driver_base.js');

const scripts = [
  '../../core/core.js',
  '../../core/base.js',
  '../../webdriver/app_driver.js',
];
for (let script of scripts) {
  let script_exports = require(script);
  for (let e in script_exports) {
    module.exports[e] = script_exports[e];
  }
}

module.exports.do_self_tests = (snippet, test) =>
  scope(snippet, async session => {
    session.driver.screenshot_disabled = true;

    // Set ~0 timeout to make failing test failing snappy. Hacky but works.
    const defaultTimeout = core.getTimeout();
    core.setTimeout(0.001);

    try {
      await test(session);
    } finally {
      // Restore timeout
      core.setTimeout(defaultTimeout);
    }
  });

module.exports.eat_ok = func => async () => {
  try {
    testflow.lock();
    await func();
  } finally {
    testflow.unlock();
  }
};

module.exports.eat_failure = func => async () => {
  try {
    testflow.lock();
    await func();
    testflow.unlock();
    fail(`No test failure`);
  } catch (e) {
    testflow.unlock();
    if (!(e instanceof TestExecutionError)) {
      throw e;
    }
  }
};
