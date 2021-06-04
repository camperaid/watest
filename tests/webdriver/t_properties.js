'use strict';

const { eat_failure, eat_ok, do_self_tests, is_output } = require('./test.js');

const snippet = `
<html><body>
  <input id='input' value='hey' class='chorizo'>
  <textarea id='textarea'>hey</textarea>
  <button id='button'><span>button</span></button>
</body></html>
`;

module.exports.test = do_self_tests(snippet, async ({ driver }) => {
  // classNameStateIs: on
  await is_output(
    eat_ok(() =>
      driver.classNameStateIs('#input', 'chorizo', 'on', `classNameStateIs.on`)
    ),
    [
      `Test: classNameStateIs.on. Selector: '#input'`,
      `Ok: #input has chorizo class name`,
      `Ok: classNameStateIs.on`,
    ],
    [],
    `classNameStateIs.on`
  );

  // classNameStateIs: off
  await is_output(
    eat_ok(() =>
      driver.classNameStateIs(
        '#input',
        'chorizo-off',
        'off',
        `classNameStateIs.off`
      )
    ),
    [
      `Test: classNameStateIs.off. Selector: '#input'`,
      `Ok: #input has not chorizo-off class name`,
      `Ok: classNameStateIs.off`,
    ],
    [],
    `classNameStateIs.off`
  );

  // classNameStateIs: failure
  await is_output(
    eat_failure(() =>
      driver.classNameStateIs(
        '#input',
        'chorizo-off',
        'on',
        `classNameStateIs.off`
      )
    ),
    [`Test: classNameStateIs.off. Selector: '#input'`],
    [
      `Failed: #input has chorizo-off class name`,
      `Failed: classNameStateIs.off, timeout while waiting to meet criteria`,
      `Failed: classNameStateIs.off`,
    ],
    `classNameStateIs.failure`
  );

  // innerHTMLIs
  await is_output(
    eat_ok(() =>
      driver.innerHTMLIs('#button', '<span>button</span>', `innerHTMLIs`)
    ),
    [
      `Test: innerHTMLIs. Selector: '#button'`,
      `Ok: innerHTMLIs, HTML match for '#button, got: <span>button</span>`,
      `Ok: innerHTMLIs`,
    ],
    [],
    `innerHTMLIs`
  );

  // innerHTMLIs: failure
  await is_output(
    eat_failure(() => driver.innerHTMLIs('#button', 'button', `innerHTMLIs`)),
    [`Test: innerHTMLIs. Selector: '#button'`],
    [
      `Failed: innerHTMLIs, HTML match for '#button;
got:
<span>button</span>
expected:
button
unexpected character: '<' at 0 pos, expected: 'b' at '' line`,
      `Failed: innerHTMLIs, timeout while waiting to meet criteria`,
      `Failed: innerHTMLIs`,
    ],
    `innerHTMLIs:failure`
  );

  // propertyIs
  await is_output(
    eat_ok(() => driver.propertyIs('#button', 'id', 'button', `propertyIs`)),
    [
      `Test: propertyIs. Selector: '#button'`,
      `Ok: id property value match, got: button`,
      `Ok: propertyIs`,
    ],
    [],
    `propertyIs`
  );

  // propertyIs: failure
  await is_output(
    eat_failure(() =>
      driver.propertyIs('#button', 'id', 'button2', `propertyIs`)
    ),
    [`Test: propertyIs. Selector: '#button'`],
    [
      `Failed: id property value match, string longer than expected, got: 'button' of 6 chars, expected: 'button2' of 7 chars, diff: '2'`,
      `Failed: propertyIs, timeout while waiting to meet criteria`,
      `Failed: propertyIs`,
    ],
    `propertyIs:failure`
  );
});
