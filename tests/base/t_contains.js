'use strict';

const { contains, is_output } = require('./test.js');

module.exports.test = async () => {
  // string: success
  await is_output(
    () => contains('green cat', 'cat', `String contains`),
    [`Ok: String contains, got: 'green cat'`],
    [],
    `success`
  );

  // string: failure: expected string, got array
  await is_output(
    () => contains([], 'green cat', `String contains`),
    [],
    [`Failed: String contains, expected string, got object: []`],
    `failure`
  );

  // string: failure: got string, expected array
  await is_output(
    () => contains('cat', [], `String contains`),
    [],
    [`Failed: String contains, got string, expected object: []`],
    `failure`
  );

  // string: failure: doesn't contains
  await is_output(
    () => contains('cat', 'green cat', `String contains`),
    [],
    [`Failed: String contains, got string doesn't contain expected string, got: 'cat', expected: 'green cat'`],
    `failure`
  );

  // array: success
  await is_output(
    () => contains([0, 1], [1], `Array contains`),
    [`Ok: Array contains, got: [0, 1]`],
    [],
    `success`
  );

  // array: failure
  await is_output(
    () => contains([0, 1], [1, 3], `Array contains`),
    [],
    [`Failed: Array contains, array has no expected item 3, got: [0, 1]`],
    `failure`
  );
};
