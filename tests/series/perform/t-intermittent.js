import { fail, make_perform_function, is_test_output } from '../test.js';

export async function test() {
  // intermittent
  let failures = [
    [
      't_testo.js',
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

  let expected_stdout = [
    '\x1B[38;5;99mStarted\x1B[0m tests/',
    '!Running: t_testo.js, path: t_testo.js',
    '\x1B[33mWarning:\x1B[0m Server terminates connection',
    '\x1B[35mIntermittent:\x1B[0m Server terminates connection 421 error',
    '>t_testo.js has 1 intermittent(s)',
    '>t_testo.js has 1 warnings(s)',
    '>t_testo.js completed in',
    '\x1B[38;5;243mCompleted\x1B[0m tests/',
    'Testsuite: shutdown',
  ];
  let expected_stderr = [];

  await is_test_output(
    make_perform_function([
      {
        name: 't_testo.js',
        path: 't_testo.js',
        failures,
        func() {
          fail('Server terminates connection');
        },
      },
    ]),
    expected_stdout,
    expected_stderr,
    'intermittent',
  );

  // generic intermittent
  failures = [
    [
      '*',
      [
        [
          'all',
          'intermittent',
          '*',
          [`Map retrieveBounds timeout`, `*`],
          `Map timeout`,
        ],
      ],
    ],
  ];

  expected_stdout = [
    '\x1B[38;5;99mStarted\x1B[0m tests/',
    '!Running: t_testo_1.js, path: t_testo_1.js',
    '\x1B[33mWarning:\x1B[0m Map retrieveBounds timeout',
    '>t_testo_1.js has 1 warnings(s)',
    '>t_testo_1.js completed in',
    '!Running: t_testo_2.js, path: t_testo_2.js',
    '\x1B[33mWarning:\x1B[0m Map retrieveBounds timeout',
    '\x1B[33mWarning:\x1B[0m Map retrieveBounds timeout',
    '\x1B[35mIntermittent:\x1B[0m Map timeout',
    '\x1B[33mWarning:\x1B[0m Dialog is shown',
    '\x1B[35mIntermittent:\x1B[0m Map timeout',
    '>t_testo_2.js has 2 intermittent(s)',
    '>t_testo_2.js has 3 warnings(s)',
    '>t_testo_2.js completed in',
    '\x1B[38;5;243mCompleted\x1B[0m tests/',
    'Testsuite: shutdown',
  ];
  expected_stderr = [];

  await is_test_output(
    make_perform_function([
      {
        name: 't_testo_1.js',
        path: 't_testo_1.js',
        failures,
        func() {
          fail('Map retrieveBounds timeout');
        },
      },
      {
        name: 't_testo_2.js',
        path: 't_testo_2.js',
        failures,
        func() {
          fail('Map retrieveBounds timeout');
          fail('Map retrieveBounds timeout');
          fail('Dialog is shown');
        },
      },
    ]),
    expected_stdout,
    expected_stderr,
    'generic intermittent',
  );
}
