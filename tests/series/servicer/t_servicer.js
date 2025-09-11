import { is_test_output, success } from '../../base/test.js';
import { log } from '../../../logging/logging.js';
import { MockSeries } from '../mock_series.js';

// Mock servicer that logs to console for output validation
class MockServicer {
  constructor(type) {
    this.type = type;
  }

  async start(service) {
    log(`MockServicer:${this.type} starting ${service}`);
    return { started: service, type: this.type };
  }

  async stop(service) {
    log(`MockServicer:${this.type} stopping ${service}`);
    return { stopped: service, type: this.type };
  }

  async shutdown() {
    log(`MockServicer:${this.type} shutdown`);
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
        services: ['mysql', 'redis'],
      },
      files: ['t_example.js'],
    },
    'tests/t_example.js': {
      test() {
        success('Servicer test example works');
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
      '!Running: mac/init, path: tests/meta.js',
      'MockServicer:docker starting mysql',
      'MockServicer:docker starting redis',
      '>mac/init completed in',
      '!Running: mac/t_example.js, path: tests/t_example.js',
      '\x1B[32mOk:\x1B[0m Servicer test example works',
      '>mac/t_example.js completed in',
      '!Running: mac/uninit, path: tests/meta.js',
      'MockServicer:docker stopping redis',
      'MockServicer:docker stopping mysql',
      '>mac/uninit completed in',
      '\x1B[102mSuccess!\x1B[0m Total: 1',
      '\x1B[38;5;243mCompleted\x1B[0m mac/',
      'Logs are written to',
      'Elapsed:',
      'Logs are written to',
      'MockServicer:docker shutdown',
      'Testsuite: shutdown',
    ],
    [],
    'servicer lifecycle',
  );
}
