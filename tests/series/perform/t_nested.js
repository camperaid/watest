import { is_test_output, make_perform_function, success } from '../test.js';

export async function test() {
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
                failures: [],
                func() {
                  success('SuccessioUno!');
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
                failures: [],
                func() {
                  success('SuccessioDuo!');
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
      '\x1B[32mOk:\x1B[0m SuccessioUno!',
      '>t_testo.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m unit/base',
      '\x1B[38;5;99mStarted\x1B[0m unit/core',
      '!Running: t_pesto.js, path: t_pesto.js',
      '\x1B[32mOk:\x1B[0m SuccessioDuo!',
      '>t_pesto.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m unit/core',
      '\x1B[38;5;243mCompleted\x1B[0m unit',
      '\x1B[38;5;243mCompleted\x1B[0m tests/',
    ],
    [],
    'nested',
  );
}
