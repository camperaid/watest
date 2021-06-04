'use strict';

const { is_string, is_output } = require('./test.js');

module.exports.test = async () => {
  // success
  await is_output(
    () => is_string('Success', 'Success', `Strings equal`),
    [`[32mOk:[0m Strings equal, got: Success\n`],
    [],
    `success`
  );

  // failure
  await is_output(
    () => is_string('Success', 'Fail', `Strings not equal`),
    [],
    [
      `[31mFailed:[0m Strings not equal;
got:
Success
expected:
Fail
unexpected character: 'S' at 0 pos, expected: 'F' at '' line\n`,
    ],
    `failure`
  );
};
