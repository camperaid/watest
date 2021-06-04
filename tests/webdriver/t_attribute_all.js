'use strict';

const { eat_failure, eat_ok, do_self_tests, is_output } = require('./test.js');

const snippet = `
<html><body>
  <input id='input' value='hey'>
  <input id='input2' value='chacha'>
</body></html>
`;

module.exports.test = do_self_tests(snippet, async ({ driver }) => {
  // attributeContainsAll: success
  await is_output(
    eat_ok(() =>
      driver.attributeContainsAll(
        'input',
        'value',
        ['he', 'hacha'],
        `attributeContainsAll`
      )
    ),
    [
      `Test: attributeContainsAll. Expected: ['he', 'hacha']. Selector: 'input'`,
      `Ok: attributeContainsAll, match attribute values, got: ['hey', 'chacha']`,
      `Ok: attributeContainsAll`,
    ],
    [],
    `attributeContainsAll:success`
  );

  // attributeContainsAll: failure
  await is_output(
    eat_failure(() =>
      driver.attributeContainsAll(
        'input',
        'value',
        ['hey', 'chachacha'],
        `attributeContainsAll`
      )
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
    `attributeContainsAll:failure`
  );
});
