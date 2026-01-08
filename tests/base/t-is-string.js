import { is_string, is_output } from './test.js';

export async function test() {
  // success
  await is_output(
    () => is_string('Success', 'Success', `Strings equal`),
    [`[32mOk:[0m Strings equal, got: Success\n`],
    [],
    `success`,
  );

  // failure
  await is_output(
    () => is_string('Success', 'Fail', `Strings not equal`),
    [],
    [
      `Failed: Strings not equal;
got:
Success
expected:
Fail
unexpected character: 'S' at 0 pos, expected: 'F' at '' line\n`,
    ],
    `failure`,
  );
}
