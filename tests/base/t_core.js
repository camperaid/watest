'use strict';

const { colorify, group, fail, success, is_output } = require('./test.js');

module.exports.test = async () => {
  // console.log
  await is_output(() => console.log(3), [`[33m3[39m\n`], [], `console.log(3)`);

  // console.error
  await is_output(() => console.error(3), [], [`[33m3[39m\n`], `console.error(3)`);

  // group(msg)
  await is_output(
    () => group('message'),
    [colorify('group', `Group:`, 'message')],
    [],
    `group(msg)`
  );

  // group(msg, label);
  await is_output(
    () => group('message', 'Block'),
    [colorify('group', `Block:`, 'message')],
    [],
    `group(msg, label)`
  );

  // success()
  await is_output(() => success('Success'), [`Ok: Success`], [], `success()`);

  // fail()
  await is_output(() => fail('Fail'), [], [`Failed: Fail`], `fail()`);
};
