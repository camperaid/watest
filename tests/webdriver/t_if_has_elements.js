import { do_self_tests, is_ok_output } from './test.js';

const snippet = `
<html><body>
  <input id='input' value='hey'>
</body></html>
`;

export var test = do_self_tests(snippet, async ({ driver }) => {
  // ifHasElements: true path
  await is_ok_output(
    () =>
      driver.ifHasElements(
        '#input',
        `ifHasElements true path`,
        () => console.log(`Input doesn't exist`),
        () => console.log(`Input unexpectedly exists`),
      ),
    [
      `Test: ifHasElements true path. Selector: '#input'`,
      `Input doesn't exist`,
      `Ok: ifHasElements true path`,
    ],
    [],
    `ifHasElements: true path`,
  );

  // ifHasElements: false path
  await is_ok_output(
    () =>
      driver.ifHasElements(
        '#input-doesnot-exist',
        `ifHasElements false path`,
        () => console.log(`Input unexpectedly doesn't exist`),
        () => console.log(`Input exists`),
      ),
    [
      `Test: ifHasElements false path. Selector: '#input-doesnot-exist'`,
      `Input exists`,
      `Ok: ifHasElements false path`,
    ],
    [],
    `ifHasElements: false path`,
  );
});
