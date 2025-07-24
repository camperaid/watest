import { is_test_output, MockSeries, success } from '../test.js';

export async function test() {
  const ts = {
    'tests': {
      meta: {
        folders: ['unit'],
      },
    },
    'tests/unit': {
      meta: {
        folders: ['base', 'core'],
      },
    },
    'tests/unit/base': {
      files: ['t_testo.js'],
    },
    'tests/unit/base/t_testo.js': {
      test() {
        success(`Testo`);
      },
    },
    'tests/unit/core': {
      files: ['t_presto.js'],
    },
    'tests/unit/core/t_presto.js': {
      test() {
        success(`Presto`);
      },
    },
  };

  await is_test_output(
    () => MockSeries.run([], { ts }),
    [
      'Settings: no temporary storage dir',
      'Settings: logging into /tmp',
      'Settings: chrome webdrivers',
      '\x1B[38;5;99mStarted\x1B[0m mac/',
      '\x1B[38;5;99mStarted\x1B[0m mac/unit',
      '\x1B[38;5;99mStarted\x1B[0m mac/unit/base',
      '!Running: mac/unit/base/t_testo.js, path: tests/unit/base/t_testo.js',
      '\x1B[32mOk:\x1B[0m Testo',
      '>mac/unit/base/t_testo.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m mac/unit/base',
      'Logs are written to',
      '\x1B[38;5;99mStarted\x1B[0m mac/unit/core',
      '!Running: mac/unit/core/t_presto.js, path: tests/unit/core/t_presto.js',
      '\x1B[32mOk:\x1B[0m Presto',
      '>mac/unit/core/t_presto.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m mac/unit/core',
      'Logs are written to',
      '\x1B[38;5;243mCompleted\x1B[0m mac/unit',
      'Logs are written to',
      '\x1B[102mSuccess!\x1B[0m Total: 2',
      '\x1B[38;5;243mCompleted\x1B[0m mac/',
      'Logs are written to',
      'Elapsed:',
      'Logs are written to',
      'Testsuite: shutdown',
    ],
    [],
    'nested',
  );
}
