'use strict';

const { eat_failure, eat_ok, do_self_tests, is_output } = require('./test.js');

const snippet = `
<html><body>
  <p id='p'>Paragraph</p>
  <p id='p-empty'></p>
  <input id='input' value='hey' class='chorizo'>
  <textarea id='textarea'>hey</textarea>
</body></html>
`;

module.exports.test = do_self_tests(snippet, async ({ driver }) => {
  // textIs: success
  await is_output(
    eat_ok(() => driver.textIs('#p', 'Paragraph', `textIs`)),
    [
      `Test: textIs. Expected: 'Paragraph'. Selector: '#p'`,
      `Ok: textIs, got: 'Paragraph'`,
      `Ok: textIs`,
    ],
    [],
    `textIs`
  );

  // textIs: failure
  await is_output(
    eat_failure(() => driver.textIs('#p', 'Para', `textIs`)),
    [`Test: textIs. Expected: 'Para'. Selector: '#p'`],
    [
      `Failed: textIs, got: 'Paragraph', expected: 'Para'`,
      `Failed: textIs, timeout while waiting to meet criteria`,
      `Failed: textIs`,
    ],
    `textIs:failure`
  );

  // textIs: ambigious
  await is_output(
    eat_failure(() => driver.textIs('p', 'Para', `textIs`)),
    [`Test: textIs. Expected: 'Para'. Selector: 'p'`],
    [
      `Failed: textIs, ambigious 'p' selector, got 2 elements, expected 1`,
      `Failed: textIs`,
    ],
    `textIs:ambigious`
  );

  // textIs: no elements
  await is_output(
    eat_failure(() => driver.textIs('#p-not-exists', 'Para', `textIs`)),
    [`Test: textIs. Expected: 'Para'. Selector: '#p-not-exists'`],
    [
      `Failed: textIs, no elements matching '#p-not-exists' selector`,
      `Failed: textIs`,
    ],
    `textIs:noelements`
  );

  // textIs: input
  await is_output(
    eat_ok(() => driver.textIs('#input', 'hey', `textIs`)),
    [
      `Test: textIs. Expected: 'hey'. Selector: '#input'`,
      `Ok: textIs, got: 'hey'`,
      `Ok: textIs`,
    ],
    [],
    `textIs:input`
  );

  // textIs: textarea
  await is_output(
    eat_ok(() => driver.textIs('#textarea', 'hey', `textIs`)),
    [
      `Test: textIs. Expected: 'hey'. Selector: '#textarea'`,
      `Ok: textIs, got: 'hey'`,
      `Ok: textIs`,
    ],
    [],
    `textIs:textarea`
  );

  // textStartsWith: success
  await is_output(
    eat_ok(() => driver.textStartsWith('#p', 'Para', `textStartsWith`)),
    [
      `Test: textStartsWith. Expected: starts with 'Para'. Selector: '#p'`,
      `Ok: textStartsWith, got: 'Paragraph'`,
      `Ok: textStartsWith`,
    ],
    [],
    `textStartsWith`
  );

  // textStartsWith: failure
  await is_output(
    eat_failure(() => driver.textStartsWith('#p', 'Mara', `textStartsWith`)),
    [`Test: textStartsWith. Expected: starts with 'Mara'. Selector: '#p'`],
    [
      `Failed: textStartsWith, got: 'Paragraph', expected: starts with 'Mara'`,
      `Failed: textStartsWith, timeout while waiting to meet criteria`,
      `Failed: textStartsWith`,
    ],
    `textStartsWith:failure`
  );

  // textEmpty: success
  await is_output(
    eat_ok(() => driver.textEmpty('#p-empty', `textEmpty`)),
    [
      `Test: textEmpty. Expected: no text. Selector: '#p-empty'`,
      `Ok: textEmpty, got: ''`,
      `Ok: textEmpty`,
    ],
    [],
    `textEmpty`
  );
});
