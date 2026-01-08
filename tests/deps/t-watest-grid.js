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
    ['../../../../bin/watest.js', '--grid'],
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

  const grid = JSON.parse(jsonStr);
  is(
    grid,
    {
      e2e: {
        paths: ['tests/e2e'],
        webdriver: null,
        servicers: ['kubernetes'],
        services: ['db', 'request'],
      },
      lib: {
        paths: ['tests/lib'],
        webdriver: null,
        servicers: [],
        services: [],
      },
      services: {
        paths: ['tests/services'],
        webdriver: null,
        servicers: ['docker'],
        services: ['inbucket', 'request'],
      },
    },
    'grid output',
  );
}
