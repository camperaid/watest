import path from 'path';
import { fileURLToPath } from 'url';

import { format_test_output } from '../../core/base.js';
import { fail } from '../../core/core.js';
import { spawn } from '../../core/spawn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export * from '../../index.js';

export async function run_e2e_tests(sample, options = {}) {
  let stdout = [];
  let stderr = [];

  let spawn_options = {
    env: Object.assign({}, process.env),
  };
  if (options.webdrivers) {
    spawn_options.env.webdrivers = JSON.stringify(options.webdrivers);
  }

  try {
    let args = ['--prefix', path.join(__dirname, `samples/${sample}`), 'test'];
    if (options.patterns) {
      args.push(...options.patterns);
    }
    await spawn('npm', args, spawn_options, buffer => {
      for (let { str_data, is_stdout } of buffer) {
        let lines = str_data
          .split('\n')
          .filter(
            line =>
              line &&
              !line.startsWith('> @camperaid/watest') &&
              !line.startsWith('> watest') &&
              !line.startsWith('Settings:') &&
              !line.includes('ExperimentalWarning: `--experimental-loader`') &&
              !line.includes(
                `--import 'data:text/javascript,import { register }`,
              ) &&
              !line.startsWith('(Use `node --trace-warnings'),
          );
        is_stdout ? stdout.push(...lines) : stderr.push(...lines);
      }
    });
  } catch (e) {
    console.error(e);
    fail(`Failed to run ${sample} test`);
  }

  return format_test_output({ stdout, stderr });
}
