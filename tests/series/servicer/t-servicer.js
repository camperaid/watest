import { is_test_output, success } from '../../base/test.js';
import { MockSeriesWithServicer } from './mock_servicer.js';

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
      'MockServicer:docker init',
      'MockServicer:docker starting mysql',
      'MockServicer:docker starting redis',
      '>mac/init completed in',
      '!Running: mac/t_example.js, path: tests/t_example.js',
      '\x1B[32mOk:\x1B[0m Servicer test example works',
      '>mac/t_example.js completed in',
      '!Running: mac/uninit, path: tests/meta.js',
      'MockServicer:docker deinit',
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
