'use strict';

const { do_self_tests, is_failure_output, is_ok_output } = require('./test.js');

const snippet = `
<html><body>
  <input id='input' value='hey'>
  <input id='input2' value='bo'>
  <script>
    function getValue() {
      return document.getElementById('input').value;
    }
    function getValues() {
      return Array.from(document.querySelectorAll('input')).map(el => el.value);
    }
  </script>
</body></html>
`;

module.exports.test = do_self_tests(snippet, async ({ driver }) => {
  // scriptRetvalIs: success
  await is_ok_output(
    () => driver.scriptRetvalIs('window.getValue()', 'hey', `scriptRetvalIs`),
    [
      `Test: scriptRetvalIs. Expected: 'hey'`,
      `Ok: scriptRetvalIs, script retval, got: hey`,
      `Ok: scriptRetvalIs`,
    ],
    [],
    `scriptRetvalIs:success`
  );

  // scriptRetvalIs: failure
  await is_failure_output(
    () => driver.scriptRetvalIs('window.getValue()', 'heo', `scriptRetvalIs`),
    [`Test: scriptRetvalIs. Expected: 'heo'`],
    [
      `Failed: scriptRetvalIs, script retval;
got:
hey
expected:
heo
unexpected character: 'y' at 2 pos, expected: 'o' at '' line`,
      `Failed: scriptRetvalIs, timeout while waiting to meet criteria`,
      `Failed: scriptRetvalIs`,
    ],
    `scriptRetvalIs:failed`
  );

  // scriptRetvalContains: success
  await is_ok_output(
    () =>
      driver.scriptRetvalContains(
        'window.getValues()',
        ['hey'],
        `scriptRetvalContains`
      ),
    [
      `Test: scriptRetvalContains. Expected: ['hey']`,
      `Ok: script retval contains ['hey'], got: ['hey', 'bo']`,
      `Ok: scriptRetvalContains`,
    ],
    [],
    `scriptRetvalContains:success`
  );

  // scriptRetvalContains: failure
  await is_failure_output(
    () =>
      driver.scriptRetvalContains(
        'window.getValues()',
        ['heo'],
        `scriptRetvalContains`
      ),
    [`Test: scriptRetvalContains. Expected: ['heo']`],
    [
      `Failed: Array has no expected item 'heo'`,
      `Failed: scriptRetvalContains, timeout while waiting to meet criteria`,
      `Failed: scriptRetvalContains`,
    ],
    `scriptRetvalContains:failed`
  );
});
