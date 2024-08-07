import { do_self_tests, is_failure_output, is_ok_output } from './test.js';

const snippet = `
<html><body>
  <input id='selected-input' value='hey' class='chorizo'>
  <input id='unselected-input' value='key'>
  <script>
    document.getElementById('selected-input').select();
  </script>
</body></html>
`;

export var test = do_self_tests(snippet, async ({ driver }) => {
  // textSelected
  await is_ok_output(
    () => driver.textSelected('#selected-input', `textSelected`),
    [
      `Test: textSelected. Expected: text should be selected. Selector: '#selected-input'`,
      `Ok: textSelected: text is selected`,
      `Ok: textSelected`,
    ],
    [],
    `textSelected`,
  );

  // textSelected:failure
  await is_failure_output(
    driver,
    () => driver.textSelected('#unselected-input', `textSelected`),
    [
      `Test: textSelected. Expected: text should be selected. Selector: '#unselected-input'`,
    ],
    [
      `Failed: textSelected: text is selected`,
      `Failed: textSelected, timeout while waiting to meet criteria`,
      `Failed: textSelected`,
    ],
    `textSelected:failure`,
  );
});
