import { is_test_output, success } from '../../base/test.js';
import { log } from '../../../logging/logging.js';
import { MockSeries } from '../mock_series.js';

// Mock servicer that logs to console for output validation
class MockServicer {
  constructor(type) {
    this.type = type;
    this.services = new Set();
  }

  async start(service) {
    log(`MockServicer:${this.type} starting ${service}`);
    this.services.add(service);
    return { started: service, type: this.type };
  }

  async stop(service) {
    log(`MockServicer:${this.type} stopping ${service}`);
    this.services.delete(service);
    return { stopped: service, type: this.type };
  }

  async shutdown() {
    log(
      `MockServicer:${this.type} shutdown (services still running: ${Array.from(this.services).join(', ') || 'none'})`,
    );
    return { shutdown: true, type: this.type };
  }

  async ontest() {
    // Optional: log test notifications
    return null;
  }
}

// Extended MockSeries that uses our logging servicer
class MockSeriesWithServicer extends MockSeries {
  createServicer(type) {
    return new MockServicer(type || 'default');
  }
}

export async function test() {
  const ts = {
    'tests': {
      meta: {
        servicer: 'docker',
        services: ['db', 'cache'],
        folders: ['nested'],
      },
      files: ['t_parent.js'],
    },
    'tests/t_parent.js': {
      test() {
        success('Parent test works');
      },
    },
    'tests/nested': {
      meta: {
        services: ['worker', 'queue'],
      },
      files: ['t_child.js'],
    },
    'tests/nested/t_child.js': {
      test() {
        success('Child test works');
      },
    },
  };

  await is_test_output(
    () => MockSeriesWithServicer.run([], { ts }),
    [
      'Settings: no temporary storage dir',
      'Settings: logging into /tmp',
      'Settings: chrome webdrivers',
      '\x1B[38;5;99mStarted\x1B[0m mac/',

      // Parent folder init - starts parent services
      '!Running: mac/init, path: tests/meta.js',
      'MockServicer:docker starting db',
      'MockServicer:docker starting cache',
      '>mac/init completed in',

      // Parent test
      '!Running: mac/t_parent.js, path: tests/t_parent.js',
      '\x1B[32mOk:\x1B[0m Parent test works',
      '>mac/t_parent.js completed in',

      // Nested folder starts
      '\x1B[38;5;99mStarted\x1B[0m mac/nested',

      // Nested folder init - starts child services (parent services still running)
      '!Running: mac/nested/init, path: tests/nested/meta.js',
      'MockServicer:docker starting worker',
      'MockServicer:docker starting queue',
      '>mac/nested/init completed in',

      // Child test
      '!Running: mac/nested/t_child.js, path: tests/nested/t_child.js',
      '\x1B[32mOk:\x1B[0m Child test works',
      '>mac/nested/t_child.js completed in',

      // Critical: nested uninit should only stop child services, NOT shutdown servicer
      '!Running: mac/nested/uninit, path: tests/nested/meta.js',
      'MockServicer:docker stopping queue',
      'MockServicer:docker stopping worker',
      // Should NOT see "MockServicer:docker shutdown" here!
      '>mac/nested/uninit completed in',

      '\x1B[38;5;243mCompleted\x1B[0m mac/nested',
      'Logs are written to',

      // Parent uninit - stops parent services
      '!Running: mac/uninit, path: tests/meta.js',
      'MockServicer:docker stopping cache',
      'MockServicer:docker stopping db',
      '>mac/uninit completed in',

      '\x1B[102mSuccess!\x1B[0m Total: 2',
      '\x1B[38;5;243mCompleted\x1B[0m mac/',
      'Logs are written to',
      'Elapsed:',
      'Logs are written to',

      // Final shutdown should happen here and include remaining services
      'MockServicer:docker shutdown (services still running: none)',
      'Testsuite: shutdown',
    ],
    [],
    'nested servicer lifecycle - no premature shutdown',
  );
}
