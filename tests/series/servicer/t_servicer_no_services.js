import { is_test_output, success } from '../../base/test.js';
import { MockSeriesWithServicer } from './mock_servicer.js';

/**
 * Test that a folder can specify servicer type without services.
 * This is useful when you want to select an environment (e.g., kubernetes)
 * without starting any services.
 */
export async function test() {
  const ts = {
    'tests': {
      meta: {
        servicer: 'kubernetes', // Just select the servicer type, no services
      },
      files: ['t_example.js'],
    },
    'tests/t_example.js': {
      test() {
        success('Test in kubernetes environment works');
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
      'MockServicer:kubernetes init',
      // No services started - init is called with undefined/empty
      '>mac/init completed in',
      '!Running: mac/t_example.js, path: tests/t_example.js',
      '\x1B[32mOk:\x1B[0m Test in kubernetes environment works',
      '>mac/t_example.js completed in',
      '!Running: mac/uninit, path: tests/meta.js',
      'MockServicer:kubernetes deinit',
      // No services stopped
      '>mac/uninit completed in',
      '\x1B[102mSuccess!\x1B[0m Total: 1',
      '\x1B[38;5;243mCompleted\x1B[0m mac/',
      'Logs are written to',
      'Elapsed:',
      'Logs are written to',
      'MockServicer:kubernetes shutdown',
      'Testsuite: shutdown',
    ],
    [],
    'servicer without services',
  );
}
