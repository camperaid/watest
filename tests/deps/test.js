export * from '../test.js';
export * from '../../core/deps.js';

import { is } from '../test.js';
import { spawn } from '../../core/spawn.js';

/**
 * Helper to test watest --deps command
 * @param {string[]} paths - Paths to pass to --deps (empty array for no args)
 * @param {string} samplesPath - Path to samples directory
 * @param {Object} expected - Expected metadata result
 */
export async function testDeps(paths, samplesPath, expected) {
  let stdout = '';
  let stderr = '';

  const args = ['../../../../bin/watest.js', '--deps', ...paths];

  await spawn('node', args, { cwd: samplesPath }, buffer => {
    for (let { str_data, is_stdout } of buffer) {
      if (is_stdout) stdout += str_data;
      else stderr += str_data;
    }
  });

  is(stderr, '', 'no errors');

  // Filter out Settings lines before JSON
  const jsonStart = stdout.indexOf('{');
  const jsonStr = jsonStart >= 0 ? stdout.slice(jsonStart) : stdout;

  const meta = JSON.parse(jsonStr);
  const pathsDesc =
    paths.length === 0 ? 'no args (defaults to tests/)' : paths.join(', ');
  is(meta, expected, `deps for ${pathsDesc}`);
}
