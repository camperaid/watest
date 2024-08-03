import { do_self_tests, is } from './test.js';

const snippet = `
<html><body>
  <div id='div' style='width: 100px; height: 100px; background-color: yellow;'></div>
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
    document.addEventListener('click', ev => {
      let el = document.createElement('span');
      el.style.backgroundColor = 'blue';
      el.style.position = 'absolute';
      el.style.top = ev.clientY;
      el.style.left = ev.clientX;
      el.style.width = '10px';
      el.style.height = '10px';
      document.body.append(el);
    });
  </script>
</body></html>
`;

export var test = do_self_tests(snippet, async ({ driver }) => {
  await driver.doubleClickAt('div', [0, 0], `dblclick`);
  is(
    await driver.executeScript('window.getPromise()', `get dblclickat result`),
    {
      x: 50,
      y: 50,
    },
    'check dblclickat results',
  );
});
