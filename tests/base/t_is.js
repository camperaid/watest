import { is, is_output } from './test.js';

export async function test() {
  // is() sucess
  await is_output(
    () => is(3, 3, `Equal`),
    [`Ok: Equal, got: 3`],
    [],
    `is() sucess`,
  );

  // is() failure
  await is_output(
    () => is(3, 4, `Not equal`),
    [],
    [`Failed: Not equal, got: 3, expected: 4`],
    `is() failure`,
  );

  // is() regexp sucess
  await is_output(
    () => is('34', /^\d+$/, `Equal`),
    [`Ok: Equal '34' matches /^\\d+$/ regexp`],
    [],
    `is() regexp sucess`,
  );

  // is() regexp failure
  await is_output(
    () => is('34a', /^\d+$/, `Equal`),
    [],
    [`Failed: Equal '34a' doesn't match /^\\d+$/ regexp`],
    `is() regexp failure`,
  );

  // is() object sucess
  await is_output(
    () => is({ field: 'hey' }, { field: 'hey' }, `Objects equal`),
    [`Ok: Objects equal, got: {field: 'hey'}`],
    [],
    `is() object sucess`,
  );

  // is() object failure
  await is_output(
    () => is({ field: 'hey' }, { field: 'pey' }, `Objects not equal`),
    [],
    [
      `Failed: Objects not equal: 'field' field value mismatch;\ngot:\nhey\nexpected:\npey\nunexpected character: 'h' at 0 pos, expected: 'p' at '' line`,
      `Failed: Objects not equal`,
    ],
    `is() object failure`,
  );
}
