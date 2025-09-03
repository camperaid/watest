import { is_output, throws, no_throws } from './test.js';

export async function test() {
  // throws: success (sync)
  await is_output(
    () =>
      throws(
        () => {
          throw new Error('Error#1');
        },
        `Error#1`,
        `Throws error#1`,
      ),
    [`Ok: Throws error#1, got: Error#1`],
    [],
    `throws success (sync)`,
  );

  // throws: success (async)
  await is_output(
    async () =>
      await throws(
        async () => {
          throw new Error('Error#1');
        },
        `Error#1`,
        `Throws error#1 async`,
      ),
    [`Ok: Throws error#1 async, got: Error#1`],
    [],
    `throws success (async)`,
  );

  // throws: fail, unexpected exception (sync)
  await is_output(
    () =>
      throws(
        () => {
          throw new Error('Error#2');
        },
        `Error#1`,
        `Wanted error#1`,
      ),
    [],
    [
      `Failed: Wanted error#1;
got:
Error#2
expected:
Error#1
unexpected character: '2' at 6 pos, expected: '1' at '' line
`,
    ],
    `throws fail, unexpected exception (sync)`,
  );

  // throws: fail, unexpected exception (async)
  await is_output(
    async () =>
      await throws(
        async () => {
          throw new Error('Error#2');
        },
        `Error#1`,
        `Wanted error#1 async`,
      ),
    [],
    [
      `Failed: Wanted error#1 async;
got:
Error#2
expected:
Error#1
unexpected character: '2' at 6 pos, expected: '1' at '' line
`,
    ],
    `throws fail, unexpected exception (async)`,
  );

  // throws: fail, no exception (sync)
  await is_output(
    () => throws(() => {}, `Error#1`, `Wanted error#1`),
    [],
    [`Failed: Wanted error#1: no 'Error#1' exception`],
    `throws fail, no exception (sync)`,
  );

  // throws: fail, no exception (async)
  await is_output(
    async () => await throws(async () => {}, `Error#1`, `Wanted error#1 async`),
    [],
    [`Failed: Wanted error#1 async: no 'Error#1' exception`],
    `throws fail, no exception (async)`,
  );

  // no_throws: success (sync)
  await is_output(
    () => no_throws(() => {}, `No exceptions`),
    [`Ok: No exceptions`],
    [],
    `no_throws success (sync)`,
  );

  // no_throws: success (async)
  await is_output(
    async () => await no_throws(async () => {}, `No exceptions async`),
    [`Ok: No exceptions async`],
    [],
    `no_throws success (async)`,
  );

  // no_throws: fail (sync)
  await is_output(
    () =>
      no_throws(() => {
        throw new Error('Error#1');
      }, `No exceptions`),
    [],
    [
      v => v.startsWith('Error: Error#1'),
      `Failed: No exceptions, got: Error#1 exception`,
    ],
    `no_throws fail (sync)`,
  );

  // no_throws: fail (async)
  await is_output(
    async () =>
      await no_throws(async () => {
        throw new Error('Error#1');
      }, `No exceptions async`),
    [],
    [
      v => v.startsWith('Error: Error#1'),
      `Failed: No exceptions async, got: Error#1 exception`,
    ],
    `no_throws fail (async)`,
  );

  // throws: accept object descriptor (statusCode + JSON body)
  await is_output(
    () =>
      throws(
        () => {
          const err = new Error(
            'HTTP error code 422 for https://api.digitalocean.com/v2/droplets',
          );
          err.statusCode = 422;
          err.responseBody = JSON.stringify({
            id: 'unprocessable_entity',
            message: 'You specified an invalid image for Droplet creation.',
          });
          throw err;
        },
        {
          statusCode: 422,
          responseBody: JSON.stringify({
            id: 'unprocessable_entity',
            message: 'You specified an invalid image for Droplet creation.',
          }),
        },
        `Throws error descriptor`,
      ),
    [
      `Ok: Throws error descriptor, got: {statusCode: 422, responseBody: '{"id":"unprocessable_entity","message":"You specified an invalid image for Droplet creation."}'}`,
    ],
    [],
    `throws accept object descriptor`,
  );

  // throws: accept RegExp for message matching
  await is_output(
    () =>
      throws(
        () => {
          throw new Error(
            'Unexpected 404 response code for https://example.com/test from droplet 1',
          );
        },
        /404|Unexpected/,
        `Throws with RegExp`,
      ),
    [
      `Ok: Throws with RegExp 'Unexpected 404 response code for https://example.com/test from droplet 1' matches /404|Unexpected/ regexp`,
    ],
    [],
    `throws accept RegExp pattern`,
  );

  // throws: fail RegExp that doesn't match
  await is_output(
    () =>
      throws(
        () => {
          throw new Error('Some other error message');
        },
        /404|Unexpected/,
        `RegExp should match`,
      ),
    [],
    [
      `Failed: RegExp should match 'Some other error message' doesn't match /404|Unexpected/ regexp`,
    ],
    `throws fail RegExp no match`,
  );
}
