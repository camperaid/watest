'use strict';

const { is_output, is_primitive } = require('./test.js');

module.exports.test = async () => {
  is_primitive(3, 3, `Equal`);

  // number sucess
  await is_output(
    () => is_primitive(3, 3, `Equal`),
    [`[32mOk:[0m Equal, got: 3`],
    [],
    `number sucess`
  );

  // number failure
  await is_output(
    () => is_primitive(3, 4, `Not equal`),
    [],
    [`Failed: Not equal, got: 3, expected: 4`],
    `number failure`
  );

  // string sucess
  await is_output(
    () => is_primitive('3', '3', `Equal`),
    [`[32mOk:[0m Equal, got: 3`],
    [],
    `string sucess`
  );

  // string failure
  await is_output(
    () => is_primitive('3', '4', `Not equal`),
    [],
    [
      `Failed: Not equal;
got:
3
expected:
4
unexpected character: '3' at 0 pos, expected: '4' at '' line
`,
    ],
    `string failure`
  );

  // regexp sucess
  await is_output(
    () => is_primitive('34', /^\d+$/, `Equal`),
    [`[32mOk:[0m Equal '34' matches /^\\d+$/ regexp`],
    [],
    `regexp sucess`
  );

  // regexp failure
  await is_output(
    () => is_primitive('34a', /^\d+$/, `Equal`),
    [],
    [`Failed: Equal '34a' doesn't match /^\\d+$/ regexp`],
    `regexp failure`
  );

  // function sucess
  await is_output(
    () => is_primitive('34', () => true, `Equal`),
    [`[32mOk:[0m Equal, got: '34'`],
    [],
    `function sucess`
  );

  // function failure
  await is_output(
    () => is_primitive('34a', () => false, `Equal`),
    [],
    [`Failed: Equal, got: '34a', expected: () => false`],
    `function failure`
  );

  // type mispatch failure
  await is_output(
    () => is_primitive(3, '3', `Not equal`),
    [],
    [
      `Failed: Not equal type mismatch, got type: number, expected type: string, got value: 3, expected value: '3'`,
    ],
    `type mispatch failure failure`
  );
};
