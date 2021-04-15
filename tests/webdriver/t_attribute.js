'use strict';

const { eat_failure, eat_ok, do_self_tests, is_output } = require('./test.js');

const snippet = `
<html><body>
  <input id='input' value='hey'>
</body></html>
`;

module.exports.test = do_self_tests(snippet, async ({ driver }) => {
  // attributeIs: success
  await is_output(
    eat_ok(() => driver.attributeIs('#input', 'value', 'hey', `attributeIs`)),
    [
      `Test: attributeIs. Expected: 'hey'. Selector: '#input'`,
      `Ok: attributeIs, got: 'hey'`,
      `Ok: attributeIs`,
    ],
    [],
    `attributeIs:success`
  );

  // attributeIs: failure
  await is_output(
    eat_failure(() =>
      driver.attributeIs('#input', 'value', 'he', `attributeIs`)
    ),
    [`Test: attributeIs. Expected: 'he'. Selector: '#input'`],
    [
      `Failed: attributeIs, got: 'hey', expected: 'he'`,
      `Failed: attributeIs, timeout while waiting to meet criteria`,
      `Failed: attributeIs`,
    ],
    `attributeIs:failed`
  );

  // attributeContains: success
  await is_output(
    eat_ok(() =>
      driver.attributeContains('#input', 'value', 'he', `attributeContains`)
    ),
    [
      `Test: attributeContains. Expected: contains 'he'. Selector: '#input'`,
      `Ok: attributeContains, got: 'hey'`,
      `Ok: attributeContains`,
    ],
    [],
    `attributeContains:success`
  );
});
