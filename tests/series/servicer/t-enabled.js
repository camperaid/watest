import { is_test_output } from '../../base/test.js';
import { settings_preamble } from '../test.js';
import { MockSeriesWithServicer } from './mock-servicer.js';

export async function test() {
  const ts = {
    'tests': {
      meta: {
        enabled: () => 'false',
        servicer: 'docker',
        services: ['mysql', 'redis'],
      },
      files: ['t_example.js'],
    },
    'tests/t_example.js': {
      test() {
        throw new Error('disabled test should not run');
      },
    },
  };

  await is_test_output(
    () => MockSeriesWithServicer.run([], { ts }),
    [
      ...settings_preamble(),
      '\x1B[38;5;99mStarted\x1B[0m mac/',
      '!Running: mac, path: tests/meta.js',
      '\x1B[32mOk:\x1B[0m Skipped: meta.enabled=false',
      '>mac completed in',
      '\x1B[102mSuccess!\x1B[0m Total: 1',
      '\x1B[38;5;243mCompleted\x1B[0m mac/',
      'Elapsed:',
      'Testsuite: shutdown',
    ],
    [],
    'meta enabled=false skips suite without starting services',
  );
}
