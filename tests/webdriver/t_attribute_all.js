import { do_self_tests, is_failure_output, is_ok_output } from './test.js';

const snippet = `
<html><body>
  <input id='input' value='hey'>
  <input id='input2' value='chacha'>
</body></html>
`;

export var test = do_self_tests(snippet, async ({ driver }) => {
  // attributeContainsAll: success
  await is_ok_output(
    () =>
      driver.attributeContainsAll(
        'input',
        'value',
        ['he', 'hacha'],
        `attributeContainsAll`,
      ),
    [
      `Test: attributeContainsAll. Expected: ['he', 'hacha']. Selector: 'input'`,
      `Ok: attributeContainsAll, match attribute values, got: ['hey', 'chacha']`,
      `Ok: attributeContainsAll`,
    ],
    [],
    `attributeContainsAll:success`,
  );

  // attributeContainsAll: failure
  await is_failure_output(
    driver,
    () =>
      driver.attributeContainsAll(
        'input',
        'value',
        ['hey', 'chachacha'],
        `attributeContainsAll`,
      ),
    [
      `Test: attributeContainsAll. Expected: ['hey', 'chachacha']. Selector: 'input'`,
    ],
    [
      `Failed: attributeContainsAll, match attribute values: unexpected value: ['hey', 'chacha'], expected: ['hey', 'chachacha']`,
      `Failed: attributeContainsAll, match attribute values`,
      `Failed: attributeContainsAll, timeout while waiting to meet criteria`,
      `Failed: attributeContainsAll`,
    ],
    `attributeContainsAll:failure`,
  );
});
