import { is, collectNestedMeta } from './test.js';

export async function test() {
  const meta1 = await collectNestedMeta([
    'tests/deps/samples/unified/tests/e2e',
  ]);
  is(
    meta1,
    {
      servicers: ['kubernetes'],
      webdriver: true,
      services: ['db', 'request'],
    },
    'e2e',
  );

  const meta2 = await collectNestedMeta([
    'tests/deps/samples/unified/tests/services',
  ]);
  is(
    meta2,
    {
      servicers: ['docker'],
      webdriver: false,
      services: ['inbucket', 'request'],
    },
    'services',
  );
}
