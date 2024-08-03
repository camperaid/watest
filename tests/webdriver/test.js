import { is_output } from '../../core/base.js';
import { testflow, fail } from '../../core/core.js';
import { scope } from '../../webdriver/session.js';
import { TestExecutionError } from '../../webdriver/driver_base.js';

const reducedTimeout = 0.001;

const eat_ok = func => async () => {
  try {
    testflow.lock();
    await func();
  } finally {
    testflow.unlock();
  }
};

const eat_failure = func => async () => {
  try {
    testflow.lock({ timeout: reducedTimeout });
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

export * from '../../core/core.js';
export * from '../../core/base.js';
export * from '../../webdriver/app_driver.js';
export * from '../../webdriver/control_driver.js';

export function do_self_tests(snippet, test) {
  return scope(snippet, async session => {
    session.driver.screenshot_disabled = true;

    // Set ~0 timeout to make failing test failing snappy. Hacky but works.
    const defaultTimeout = testflow.core.getTimeout();
    testflow.core.setTimeout(reducedTimeout);

    try {
      await test(session);
    } finally {
      // Restore timeout
      testflow.core.setTimeout(defaultTimeout);
    }
  });
}

export function is_ok_output(func, out, err, msg) {
  return is_output(eat_ok(func), out, err, msg);
}

export function is_failure_output(driver, func, out, err, msg) {
  // Tests in Firefox are running in a child process, which doesn't use stderr.
  if (driver.firefox) {
    out.push(...err);
    err = [];
  }
  out.push(`Sleeping for 1 ms`);
  return is_output(eat_failure(func), out, err, msg);
}
