'use strict';

const { do_self_tests, is_failure_output, is_ok_output } = require('./test.js');

const snippet = `
<html><body>
  <input id='input-not-visible' hidden>
  <input id='input-visible' value='hey'>
</body></html>
`;

module.exports.test = do_self_tests(snippet, async ({ driver }) => {
  // noElementsOrNotVisible: no elements: success
  await is_ok_output(
    () =>
      driver.noElementsOrNotVisible(
        '#input-doesnot-exist',
        `noElementsOrNotVisible`
      ),
    [
      `Test: noElementsOrNotVisible. Selector: '#input-doesnot-exist'`,
      `Ok: noElementsOrNotVisible`,
    ],
    [],
    `noElementsOrNotVisible:no elements: success`
  );

  // noElementsOrNotVisible: not visible: success
  await is_ok_output(
    () =>
      driver.noElementsOrNotVisible(
        '#input-not-visible',
        `noElementsOrNotVisible`
      ),
    [
      `Test: noElementsOrNotVisible. Selector: '#input-not-visible'`,
      `Ok: noElementsOrNotVisible`,
    ],
    [],
    `noElementsOrNotVisible:not visible:success`
  );

  // noElementsOrNotVisible: visible: failure
  await is_failure_output(
    driver,
    () =>
      driver.noElementsOrNotVisible('#input-visible', `noElementsOrNotVisible`),
    [`Test: noElementsOrNotVisible. Selector: '#input-visible'`],
    [
      `Failed: noElementsOrNotVisible, timeout while waiting to meet criteria`,
      `Failed: noElementsOrNotVisible. Failure details: Got elements count: 1, elements visibility [true], expected: not visible`,
    ],
    `noElementsOrNotVisible:visible:failure`
  );
});
