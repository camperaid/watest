import { spawn } from './spawn.js';

/**
 * Run a shell command and capture its output
 * @param {string} cmd - Command to run
 * @param {string[]} args - Command arguments
 * @param {object} options - Spawn options
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number, stdoutLines: string[], stderrLines: string[]}>}
 */
export async function runCommand(cmd, args = [], options = {}) {
  let stdout = [];
  let stderr = [];
  let exitCode = 0;

  try {
    exitCode = await spawn(cmd, args, options, buffer => {
      for (let { str_data, is_stdout } of buffer) {
        const lines = str_data.split('\n').filter(line => line);
        if (is_stdout) {
          stdout.push(...lines);
        } else {
          stderr.push(...lines);
        }
      }
    });
  } catch (code) {
    exitCode = code;
  }

  return {
    stdout: stdout.join('\n'),
    stderr: stderr.join('\n'),
    exitCode,
    stdoutLines: stdout,
    stderrLines: stderr,
  };
}

/**
 * Run a bash script with proper error handling
 * @param {string} script - Bash script content
 * @param {string[]} args - Script arguments
 * @param {object} options - Spawn options
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number, stdoutLines: string[], stderrLines: string[]}>}
 */
export async function runBashScript(script, args = [], options = {}) {
  return runCommand('bash', ['-c', script, '--', ...args], options);
}

/**
 * Run a shell command and return only stdout (for simple cases)
 * @param {string} cmd - Command to run
 * @param {string[]} args - Command arguments
 * @param {object} options - Spawn options
 * @returns {Promise<string>} stdout content
 */
export async function execCommand(cmd, args = [], options = {}) {
  const result = await runCommand(cmd, args, options);
  if (result.exitCode !== 0) {
    throw new Error(
      `Command failed with exit code ${result.exitCode}: ${result.stderr}`,
    );
  }
  return result.stdout;
}

// Export the raw spawn function for advanced use cases
export { spawn };
