import { is_test_output, make_perform_function, success } from '../test.js';

export async function test() {
  // success
  await is_test_output(
    make_perform_function([
      {
        name: 't_testo.js',
        failures: [],
        func() {
          success('Successio!');
        },
      },
    ]),
    [
      '\x1B[38;5;99mStarted\x1B[0m tests/',
      '!Running: t_testo.js, path: undefined',
      '\x1B[32mOk:\x1B[0m Successio!',
      '>t_testo.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m tests/',
      'Testsuite: shutdown',
    ],
    [],
    'success',
  );

  // success: unmatched expected failures
  await is_test_output(
    make_perform_function([
      {
        name: 't_testo.js',
        failures: [
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
        ],
        func() {
          success('Successio!');
        },
      },
    ]),
    [
      '\x1B[38;5;99mStarted\x1B[0m tests/',
      '!Running: t_testo.js, path: undefined',
      '\x1B[32mOk:\x1B[0m Successio!',
      '>t_testo.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m tests/',
      'Testsuite: shutdown',
    ],
    [],
    'success #2',
  );
}
