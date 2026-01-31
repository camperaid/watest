import { is_test_output } from '../test.js';
import { success } from '../../../core/core.js';
import { Core } from '../../../core/core.js';
import { Series } from '../../../core/series.js';

class MockLogPipe {
  attach() {
    return Promise.resolve();
  }
  release() {
    return Promise.resolve();
  }
  logToFile() {}
}

function make_perform_with_timeout(tests) {
  return async () => {
    const series = new Series('tests/', {
      core: new Core(),
      LogPipe: new MockLogPipe(),
    });
    try {
      await series.perform({ folder: 'tests/', tests });
    } finally {
      series.shutdown();
    }
  };
}

export async function test() {
  // Test that timeout from meta.js causes test to fail after specified time
  await is_test_output(
    make_perform_with_timeout([
      {
        name: 't-slow.js',
        path: 'tests/t-slow.js',
        func: () => new Promise(resolve => setTimeout(resolve, 500)),
        failures_info: [],
        timeout: 0.05, // 50ms timeout in seconds
      },
    ]),
    [
      '\x1B[38;5;99mStarted\x1B[0m tests/',
      '!Running: t-slow.js, path: tests/t-slow.js',
      '>t-slow.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m tests/',
      'Testsuite: shutdown',
    ],
    [
      "\x1B[31mFailed:\x1B[0m Test t-slow.js takes longer than 0.05s. It's either slow or never ends.",
      '\x1B[31m>t-slow.js\x1B[0m has 1 failure(s)',
    ],
    'meta timeout causes test to fail',
  );

  // Test that test completes normally when timeout is not exceeded
  await is_test_output(
    make_perform_with_timeout([
      {
        name: 't-fast.js',
        path: 'tests/t-fast.js',
        func: () => {
          success('fast test passes');
          return Promise.resolve();
        },
        failures_info: [],
        timeout: 1, // 1 second timeout
      },
    ]),
    [
      '\x1B[38;5;99mStarted\x1B[0m tests/',
      '!Running: t-fast.js, path: tests/t-fast.js',
      '\x1B[32mOk:\x1B[0m fast test passes',
      '>t-fast.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m tests/',
      'Testsuite: shutdown',
    ],
    [],
    'test completes within timeout',
  );

  // Test that no timeout applies when timeout is undefined
  await is_test_output(
    make_perform_with_timeout([
      {
        name: 't-no-timeout.js',
        path: 'tests/t-no-timeout.js',
        func: () => {
          success('no timeout test passes');
          return new Promise(resolve => setTimeout(resolve, 10));
        },
        failures_info: [],
        // timeout: undefined - no timeout set
      },
    ]),
    [
      '\x1B[38;5;99mStarted\x1B[0m tests/',
      '!Running: t-no-timeout.js, path: tests/t-no-timeout.js',
      '\x1B[32mOk:\x1B[0m no timeout test passes',
      '>t-no-timeout.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m tests/',
      'Testsuite: shutdown',
    ],
    [],
    'test runs without timeout when not specified',
  );
}
