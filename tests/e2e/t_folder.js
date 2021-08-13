'use strict';

const { is, run_e2e_tests } = require('./test.js');

module.exports.test = async () => {
  let output = await run_e2e_tests('folder');
  is(
    output.stdout,
    [
      '\x1B[38;5;99mStarted\x1B[0m sample/',
      '\x1B[38;5;99mStarted\x1B[0m sample/unit',
      '!Running: sample/unit/t_test.js, path: tests/unit/t_test.js',
      '\x1B[32mOk:\x1B[0m works!',
      '>sample/unit/t_test.js completed in',
      '\x1B[38;5;243mCompleted\x1B[0m sample/unit',
      '\x1B[102mSuccess!\x1B[0m Total: 1',
      '\x1B[38;5;243mCompleted\x1B[0m sample/',
      'Testsuite: shutdown',
      'Elapsed:',
    ],
    'stdout'
  );

  is(output.stderr, [], 'stderr');
};
