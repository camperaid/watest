import { do_self_tests, is } from './test.js';

const snippet = `
<html><body>
  <input id='input'>
  <script>
    let resolve = null
    let promise = new Promise(r => resolve = r);
    document.body.addEventListener('dblclick', resolve);
    window.getPromise = () => {
      return promise.then(() => true);
    }
  </script>
</body></html>
`;

export var test = do_self_tests(snippet, async ({ driver }) => {
  await driver.doubleClick('input', `dblclick input`);
  is(
    await driver.executeScript('window.getPromise()', `get dblclick result`),
    true,
    'check dblclick result',
  );
});
