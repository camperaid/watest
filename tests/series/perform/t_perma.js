import { fail, is_test_output, make_perform_function } from '../test.js';

export async function test() {
  const failures = [
    [
      't_testo.js',
      [
        [
          'all',
          'perma',
          '*',
          [`Server terminates connection`],
          `Server terminates connection 421 error`,
        ],
      ],
    ],
  ];

  // intermittent
  await is_test_output(
    make_perform_function([
      {
        name: 't_testo.js',
        failures,
        func() {
          fail('Server terminates connection');
        },
      },
    ]),
    [
      '\x1B[38;5;99mStarted\x1B[0m tests/',
      '!Running: t_testo.js, path: undefined',
      '\x1B[33mWarning:\x1B[0m Server terminates connection',
      '\x1B[33mTodo:\x1B[0m Server terminates connection 421 error',
      '>t_testo.js has 1 todo(s)',
      '>t_testo.js has 1 warnings(s)',
      '>t_testo.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m tests/',
      'Testsuite: shutdown',
    ],
    [],
    'perma',
  );
}
