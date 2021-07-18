'use strict';

const { AppDriver, is_ok_output, do_self_tests } = require('./test.js');

const snippet = `
<html><body>
  <input id='input'>
</body></html>
`;

class Input extends AppDriver {
  get Self() {
    return '#input';
  }
  type(text) {
    return super.type(this.Self, text, `Type ${text}`);
  }
}

module.exports.test = do_self_tests(snippet, async session => {
  // AppDriver: chainable
  await is_ok_output(
    () => Input.get(session).type('hello'),
    [
      `Action: Get Input`,
      `Test: Input is shown. Selector: '#input'`,
      `Ok: '#input' has to be unique, got: 1`,
      `Ok: Input is shown`,
      `Action: Input.type into Type hello`,
      `Test: Type into Type hello. Selector: '#input'`,
      `Ok: '#input' has to be unique, got: 1`,
      `Ok: Type into Type hello`,
      `Test: Check Type hello text. Expected: 'hello'. Selector: '#input'`,
      `Ok: Check Type hello text, got: 'hello'`,
      `Ok: Check Type hello text`,
    ],
    [],
    `AppDriver: chainable`
  );
});
