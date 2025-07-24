import { is_test_output, make_perform_function } from '../test.js';

export async function test() {
  // fail
  await is_test_output(
    make_perform_function([
      {
        name: 't_testo.js',
        path: 't_testo.js',
        failures: [],
        func() {},
      },
    ]),
    [
      '\x1B[38;5;99mStarted\x1B[0m tests/',
      '!Running: t_testo.js, path: t_testo.js',
      '>t_testo.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m tests/',
      'Testsuite: shutdown',
    ],
    [
      '\x1B[31mFailed:\x1B[0m Neighter failure nor success in t_testo.js',
      '\x1B[31m>t_testo.js\x1B[0m has 1 failure(s)',
    ],
    'fail',
  );
}
