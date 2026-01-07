import { colorify, group, fail, success, is_output } from './test.js';

export async function test() {
  // console.log - Node adds yellow color codes to numbers in TTY
  const colored3 = `\x1b[33m3\x1b[39m\n`;

  await is_output(
    () => console.log(3),
    [colored3],
    [],
    `console.log(3)`,
  );

  // console.error
  await is_output(
    () => console.error(3),
    [],
    [colored3],
    `console.error(3)`,
  );

  // group(msg)
  await is_output(
    () => group('message'),
    [colorify('group', `Group:`, 'message')],
    [],
    `group(msg)`,
  );

  // group(msg, label);
  await is_output(
    () => group('message', 'Block'),
    [colorify('group', `Block:`, 'message')],
    [],
    `group(msg, label)`,
  );

  // success()
  await is_output(() => success('Success'), [`Ok: Success`], [], `success()`);

  // fail()
  await is_output(() => fail('Fail'), [], [`Failed: Fail`], `fail()`);
}
