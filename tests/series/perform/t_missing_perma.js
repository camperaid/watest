import { fail, make_perform_function, is_test_output } from '../test.js';

export async function test() {
  // missing perma
  let failures = [
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

  await is_test_output(
    make_perform_function([
      {
        name: 't_testo.js',
        path: 't_testo.js',
        failures,
        func() {
          fail('Server busy');
        },
      },
    ]),
    [
      '\x1B[38;5;99mStarted\x1B[0m tests/',
      '!Running: t_testo.js, path: t_testo.js',
      '>t_testo.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m tests/',
    ],
    [
      '\x1B[31mFailed:\x1B[0m Server busy',
      "\x1B[31mFailed:\x1B[0m Perma failure 'Server terminates connection' has never been hit",
      '\x1B[31m>t_testo.js\x1B[0m has 2 failure(s)',
    ],
    'missing perma',
  );

  // no perma but intermittent
  failures = [
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
        ['all', 'intermittent', '*', [`Map timeout`], `Map timeout`],
      ],
    ],
  ];

  await is_test_output(
    make_perform_function([
      {
        name: 't_testo.js',
        path: 't_testo.js',
        failures,
        func() {
          fail('Map timeout');
        },
      },
    ]),
    [
      '\x1B[38;5;99mStarted\x1B[0m tests/',
      '!Running: t_testo.js, path: t_testo.js',
      '\x1B[33mWarning:\x1B[0m Map timeout',
      '\x1B[35mIntermittent:\x1B[0m Map timeout',
      '>t_testo.js has 1 intermittent(s)',
      '>t_testo.js has 1 warnings(s)',
      '>t_testo.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m tests/',
    ],
    [],
    'no perma but intermittent',
  );
}
