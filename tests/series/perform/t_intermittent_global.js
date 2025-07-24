import { is_test_output, make_perform_function, fail } from '../test.js';

export async function test() {
  let failures = [
    [
      '**',
      [
        [
          'all',
          'intermittent',
          '*',
          [`Server terminates connection`],
          `Server terminates connection 421 error`,
        ],
      ],
    ],
  ];

  await is_test_output(
    make_perform_function([
      {
        name: 'unit',
        subtests: [
          {
            name: 'unit/base',
            subtests: [
              {
                name: 't_testo.js',
                path: 't_testo.js',
                failures,
                func() {
                  fail('Server terminates connection');
                },
              },
            ],
          },
          {
            name: 'unit/core',
            subtests: [
              {
                name: 't_pesto.js',
                path: 't_pesto.js',
                failures,
                func() {
                  fail('Server terminates connection');
                },
              },
            ],
          },
        ],
      },
    ]),
    [
      '\x1B[38;5;99mStarted\x1B[0m tests/',
      '\x1B[38;5;99mStarted\x1B[0m unit',
      '\x1B[38;5;99mStarted\x1B[0m unit/base',
      '!Running: t_testo.js, path: t_testo.js',
      '\x1B[33mWarning:\x1B[0m Server terminates connection',
      '\x1B[35mIntermittent:\x1B[0m Server terminates connection 421 error',
      '>t_testo.js has 1 intermittent(s)',
      '>t_testo.js has 1 warnings(s)',
      '>t_testo.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m unit/base',
      '\x1B[38;5;99mStarted\x1B[0m unit/core',
      '!Running: t_pesto.js, path: t_pesto.js',
      '\x1B[33mWarning:\x1B[0m Server terminates connection',
      '\x1B[35mIntermittent:\x1B[0m Server terminates connection 421 error',
      '>t_pesto.js has 1 intermittent(s)',
      '>t_pesto.js has 1 warnings(s)',
      '>t_pesto.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m unit/core',
      '\x1B[38;5;243mCompleted\x1B[0m unit',
      '\x1B[38;5;243mCompleted\x1B[0m tests/',
      'Testsuite: shutdown',
    ],
    [],
    'global intermittents',
  );
}
