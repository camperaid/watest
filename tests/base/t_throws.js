import { is_output, throws, no_throws } from './test.js';

export async function test() {
  // throws: success
  await is_output(
    () =>
      throws(
        () => {
          throw new Error('Error#1');
        },
        `Error#1`,
        `Throws error#1`,
      ),
    [`Ok: Throws error#1, got: Error#1`],
    [],
    `throws sucess`,
  );

  // throws: fail, unexpected exception
  await is_output(
    () =>
      throws(
        () => {
          throw new Error('Error#2');
        },
        `Error#1`,
        `Wanted error#1`,
      ),
    [],
    [
      `Failed: Wanted error#1;
got:
Error#2
expected:
Error#1
unexpected character: '2' at 6 pos, expected: '1' at '' line
`,
    ],
    `throws fail, unexpected exception`,
  );

  // throws: fail, no exception
  await is_output(
    () => throws(() => {}, `Error#1`, `Wanted error#1`),
    [],
    [`Failed: Wanted error#1: no 'Error#1' exception`],
    `throws fail, no exception`,
  );

  // no_throws(() => {}, `No exceptions`)

  // no_throws: success
  await is_output(
    () => no_throws(() => {}, `No exceptions`),
    [`Ok: No exceptions`],
    [],
    `no throws: sucess`,
  );

  // no_throws: fail
  await is_output(
    () =>
      no_throws(() => {
        throw new Error('Error#1');
      }, `No exceptions`),
    [],
    [
      v => v.startsWith('Error: Error#1'),
      `Failed: No exceptions, got: Error#1 exception`,
    ],
    `no_throws fail`,
  );
}
