'use strict';

const { contains, is_output } = require('./test.js');

module.exports.test = async () => {
  // success
  await is_output(
    () => contains([0, 1], [1], `Contains`),
    [`Ok: Contains, got: [0, 1]`],
    [],
    `success`
  );

  // failure
  await is_output(
    () => contains([0, 1], [1, 3], `Contains`),
    [],
    [`Failed: Array has no expected item 3`],
    `failure`
  );
};
