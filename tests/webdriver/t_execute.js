import { do_self_tests, is } from './test.js';

const snippet = `
<html><body>
  <input id='input' value='hey'>
  <script>
    function getValue() {
      return document.getElementById('input').value;
    }
    async function getValueAsync() {
      await new Promise(resolve => window.setTimeout(resolve, 0));
      return document.getElementById('input').value;
    }
  </script>
</body></html>
`;

export var test = do_self_tests(snippet, async ({ driver }) => {
  is(
    await driver.executeScript('window.getValue()', `get input value`),
    'hey',
    'get input value sync',
  );
  is(
    await driver.executeScript('window.getValueAsync()', `get input value`),
    'hey',
    'get input value async',
  );
});
