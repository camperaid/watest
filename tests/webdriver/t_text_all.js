'use strict';

const { eat_failure, eat_ok, do_self_tests, is_output } = require('./test.js');

const snippet = `
<html><body>
  <p>Paragraph</p>
  <p>Maragraph</p>
</body></html>
`;

module.exports.test = do_self_tests(snippet, async ({ driver }) => {
  // textIs: success
  await is_output(
    eat_ok(() =>
      driver.textIsAll('p', ['Paragraph', 'Maragraph'], `textIsAll`)
    ),
    [
      `Test: textIsAll. Expected: ['Paragraph', 'Maragraph']. Selector: 'p'`,
      `Ok: textIsAll, match text, got: ['Paragraph', 'Maragraph']`,
      `Ok: textIsAll`,
    ],
    [],
    `textIsAll:success`
  );

  // textIs: failure
  await is_output(
    eat_failure(() => driver.textIsAll('p', ['Para', 'Mara'], `textIsAll`)),
    [`Test: textIsAll. Expected: ['Para', 'Mara']. Selector: 'p'`],
    [
      `Failed: textIsAll, match text: unexpected value: ['Paragraph', 'Maragraph'], expected: ['Para', 'Mara']`,
      `Failed: textIsAll, match text`,
      `Failed: textIsAll, timeout while waiting to meet criteria`,
      `Failed: textIsAll`,
    ],
    `textIsAll:failure`
  );

  // textIs: ambigious
  await is_output(
    eat_failure(() => driver.textIsAll('p', ['Para'], `textIsAll`)),
    [`Test: textIsAll. Expected: ['Para']. Selector: 'p'`],
    [
      `Failed: textIsAll, ambigious 'p' selector, got 2 elements, expected 1`,
      `Failed: textIsAll`,
    ],
    `textIsAll:ambigious`
  );

  // textIs: no elements
  await is_output(
    eat_failure(() => driver.textIs('#p-not-exists', ['Para'], `textIsAll`)),
    [`Test: textIsAll. Expected: ['Para']. Selector: '#p-not-exists'`],
    [
      `Failed: textIsAll, no elements matching '#p-not-exists' selector`,
      `Failed: textIsAll`,
    ],
    `textIsAll:noelements`
  );
});
