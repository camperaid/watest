import { AppDriver, is, do_self_tests } from './test.js';

const snippet = `
<html><body>
  <form class='form'>
    <input class='input'>
    <button class='button'>button</button>
  </form>
</body></html>
`;

class Body extends AppDriver {
  getSelectors() {
    return {
      Self: 'body',
      Form: {
        Self: `.form`,
        Input: `.input`,
        Button: `.button`,
      },
    };
  }
}

export var test = do_self_tests(snippet, async session => {
  let body = await Body.get(session);
  is(body.Self, 'body', `AppDriver selectors: Self`);
  is(body.Form.Self, 'body .form', `AppDriver selectors: Form.Self`);
  is(body.Form.Input, 'body .form .input', `AppDriver selectors: Form.Input`);
  is(
    body.Form.Button,
    'body .form .button',
    `AppDriver selectors: Form.Button`,
  );
});
