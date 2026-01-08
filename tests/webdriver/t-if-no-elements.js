import { do_self_tests, is_ok_output } from './test.js';

const snippet = `
<html><body>
  <input id='input' value='hey'>
</body></html>
`;

export var test = do_self_tests(snippet, async ({ driver }) => {
  // ifNoElements: true path
  await is_ok_output(
    () =>
      driver.ifNoElements(
        '#input-doesnot-exist',
        `ifNoElements true path`,
        () => console.log(`Input doesn't exist`),
        () => console.log(`Input unexpectedly exists`),
      ),
    [
      `Test: ifNoElements true path. Selector: '#input-doesnot-exist'`,
      `Input doesn't exist`,
      `Ok: ifNoElements true path`,
    ],
    [],
    `ifNoElements: true path`,
  );

  // ifNoElements: false path
  await is_ok_output(
    () =>
      driver.ifNoElements(
        '#input',
        `ifNoElements false path`,
        () => console.log(`Input unexpectedly doesn't exist`),
        () => console.log(`Input exists`),
      ),
    [
      `Test: ifNoElements false path. Selector: '#input'`,
      `Input exists`,
      `Ok: ifNoElements false path`,
    ],
    [],
    `ifNoElements: false path`,
  );
});
