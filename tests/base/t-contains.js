import { contains, is_output } from './test.js';

export async function test() {
  // string: success
  await is_output(
    () => contains('green cat', 'cat', `String contains`),
    [`Ok: String contains, got: 'green cat'`],
    [],
    `success`,
  );

  // string: failure: expected string, got array
  await is_output(
    () => contains([], 'green cat', `String contains`),
    [],
    [`Failed: String contains, expected string, got object: []`],
    `failure`,
  );

  // string, empty array: success (contains all of nothing)
  await is_output(
    () => contains('cat', [], `String contains`),
    [`Ok: String contains, got: 'cat'`],
    [],
    `string empty array`,
  );

  // string: failure: doesn't contains
  await is_output(
    () => contains('cat', 'green cat', `String contains`),
    [],
    [
      `Failed: String contains, got string doesn't contain expected string, got: 'cat', expected: 'green cat'`,
    ],
    `failure`,
  );

  // string, string[]: success
  await is_output(
    () =>
      contains(
        'green cat on a mat',
        ['green', 'cat', 'mat'],
        `String contains all`,
      ),
    [`Ok: String contains all, got: 'green cat on a mat'`],
    [],
    `string array success`,
  );

  // string, string[]: partial failure
  await is_output(
    () =>
      contains(
        'green cat on a mat',
        ['green', 'dog', 'mat'],
        `String contains all`,
      ),
    [],
    [
      `Failed: String contains all, got string doesn't contain expected string, got: 'green cat on a mat', expected: 'dog'`,
    ],
    `string array failure`,
  );

  // array: success
  await is_output(
    () => contains([0, 1], [1], `Array contains`),
    [`Ok: Array contains, got: [0, 1]`],
    [],
    `success`,
  );

  // array: failure
  await is_output(
    () => contains([0, 1], [1, 3], `Array contains`),
    [],
    [`Failed: Array contains, array has no expected item 3, got: [0, 1]`],
    `failure`,
  );
}
