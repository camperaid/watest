'use strict';

const path = require('path');

const { format_test_output } = require('../../core/base.js');
const { fail } = require('../../core/core.js');
const { spawn } = require('../../core/spawn.js');

const scripts = ['../../index.js'];
for (let script of scripts) {
  let script_exports = require(script);
  for (let e in script_exports) {
    module.exports[e] = script_exports[e];
  }
}

module.exports.run_e2e_tests = async (sample, options = {}) => {
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
              !line.includes('ExperimentalWarning: --experimental-loader') &&
              !line.startsWith('(Use `node --trace-warnings')
          );
        is_stdout ? stdout.push(...lines) : stderr.push(...lines);
      }
    });
  } catch (e) {
    console.error(e);
    fail(`Failed to run ${sample} test`);
  }

  return format_test_output({ stdout, stderr });
};
