'use strict';

const { do_self_tests, is } = require('./test.js');

const snippet = `
<html><body>
  <div id='div' style='width: 100px; height: 100px; background-color: blue;'></div>
  <script>
    let resolve = null
    let promise = new Promise(r => resolve = r);
    document.body.addEventListener('dblclick', resolve);
    window.getPromise = () => {
      return promise.then(ev => {
        let { x, y } = ev.target.parentNode.getBoundingClientRect();
        return {
          x: ev.clientX - x,
          y: ev.clientY - y,
        };
      });
    };
  </script>
</body></html>
`;

module.exports.test = do_self_tests(snippet, async ({ driver }) => {
  const x = 50;
  const y = 50;
  await driver.doubleClickAt('div', [x, y], `dblclick`);
  is(
    await driver.executeScript('window.getPromise()', `get dblclickat result`),
    {
      x,
      y,
    },
    'check dblclickat results'
  );
});
