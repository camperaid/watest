import { ok, contains } from '../../index.js';
import { runCommand, runBashScript, execCommand } from '../../core/system.js';

export async function test() {
  // Test 1: runCommand with echo
  {
    const result = await runCommand('echo', ['hello', 'world']);
    ok(result.exitCode === 0, 'echo command should succeed');
    ok(result.stdout === 'hello world', 'stdout should contain echo output');
    ok(result.stderr === '', 'stderr should be empty');
    ok(result.stdoutLines.length === 1, 'should have one stdout line');
    ok(result.stdoutLines[0] === 'hello world', 'stdout line should match');
  }

  // Test 2: runBashScript with simple script
  {
    const script = 'echo "test script"; echo "line 2"';
    const result = await runBashScript(script);
    ok(result.exitCode === 0, 'bash script should succeed');
    contains(result.stdout, 'test script', 'should contain first echo');
    contains(result.stdout, 'line 2', 'should contain second echo');
    ok(result.stdoutLines.length === 2, 'should have two stdout lines');
  }

  // Test 3: execCommand for simple cases
  {
    const output = await execCommand('echo', ['simple test']);
    ok(output === 'simple test', 'execCommand should return stdout directly');
  }

  // Test 4: runCommand with failing command
  {
    const result = await runCommand('bash', ['-c', 'echo "error" >&2; exit 1']);
    ok(result.exitCode === 1, 'failing command should return exit code 1');
    ok(result.stdout === '', 'stdout should be empty');
    ok(result.stderr === 'error', 'stderr should contain error message');
  }

  // Test 5: execCommand should throw on failure
  {
    let threw = false;
    try {
      await execCommand('bash', ['-c', 'exit 1']);
    } catch (error) {
      threw = true;
      contains(error.message, 'exit code 1', 'error should mention exit code');
    }
    ok(threw, 'execCommand should throw on non-zero exit code');
  }

  // Test 6: runBashScript with arguments
  {
    const script = 'echo "arg1: $1, arg2: $2"';
    const result = await runBashScript(script, ['first', 'second']);
    ok(result.exitCode === 0, 'bash script with args should succeed');
    contains(result.stdout, 'arg1: first', 'should pass first argument');
    contains(result.stdout, 'arg2: second', 'should pass second argument');
  }
}
