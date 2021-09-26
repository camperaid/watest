'use strict';

const {
  do_self_tests,
  is_ok_output,
} = require('./test.js');

const snippet = `
<html>
<script>
window.getSelection = selector => {
  let el = document.querySelector(selector);
  return [el.selectionStart, el.selectionEnd];
};
</script>
<body>
  <input value='hey'>
  <textarea>hey</textarea>
</body>
</html>
`;

module.exports.test = do_self_tests(snippet, async ({ driver }) => {
  let stdout = driver.firefox
    ? [
        `Test: select input text press Ctrl+A. Selector: 'input'`,
        `Ok: 'input' has to be unique, got: 1`,
        `Ok: select input text press Ctrl+A`,
      ]
    : [`Test: select input text`, `Ok: select input text`];

  // selectAll:input
  await is_ok_output(
    () => driver.selectAll('input', `select input text`),
    stdout,
    [],
    `selectAll:input`
  );

  await driver.scriptRetvalIs(
    `window.getSelection('input')`,
    [0, 3],
    'input text is selected'
  );

  // selectAll:textarea
  stdout = driver.firefox
    ? [
        `Test: select textarea text press Ctrl+A. Selector: 'textarea'`,
        `Ok: 'textarea' has to be unique, got: 1`,
        `Ok: select textarea text press Ctrl+A`,
      ]
    : [`Test: select textarea text`, `Ok: select textarea text`];

  await is_ok_output(
    () => driver.selectAll('textarea', `select textarea text`),
    stdout,
    [],
    `selectAll:textarea`
  );

  await driver.scriptRetvalIs(
    `window.getSelection('textarea')`,
    [0, 3],
    'textarea text is selected'
  );
});
