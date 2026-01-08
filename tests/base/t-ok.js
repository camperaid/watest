import { ok, is_output } from './test.js';

export async function test() {
  // ok() sucess
  await is_output(() => ok(true, `Ok`), [`Ok: Ok`], [], `ok() sucess`);

  // ok() failure
  await is_output(
    () => ok(false, `Not ok`),
    [],
    [`Failed: Not ok`],
    `ok() failure`,
  );
}
