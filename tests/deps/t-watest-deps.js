import { is } from './test.js';
import { spawn } from '../../core/spawn.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function test() {
  let stdout = '';
  let stderr = '';

  await spawn(
    'node',
    ['../../../../bin/watest.js', '--deps', 'tests/e2e'],
    { cwd: path.join(__dirname, 'samples/unified') },
    buffer => {
      for (let { str_data, is_stdout } of buffer) {
        if (is_stdout) stdout += str_data;
        else stderr += str_data;
      }
    },
  );

  is(stderr, '', 'no errors');

  // Filter out Settings lines before JSON
  const jsonStart = stdout.indexOf('{');
  const jsonStr = jsonStart >= 0 ? stdout.slice(jsonStart) : stdout;

  const meta = JSON.parse(jsonStr);
  is(
    meta,
    {
      servicers: ['kubernetes'],
      webdriver: true,
      services: ['db', 'request'],
    },
    'e2e metadata',
  );
}
