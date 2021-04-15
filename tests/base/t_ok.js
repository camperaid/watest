'use strict';

const { ok, is_output } = require('./test.js');

module.exports.test = async () => {
  // ok() sucess
  await is_output(() => ok(true, `Ok`), [`Ok: Ok`], [], `ok() sucess`);

  // ok() failure
  await is_output(
    () => ok(false, `Not ok`),
    [],
    [`Failed: Not ok`],
    `ok() failure`
  );
};
