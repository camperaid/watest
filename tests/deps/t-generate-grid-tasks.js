import { is } from './test.js';
import { spawn } from '../../core/spawn.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesPath = path.join(__dirname, 'samples/unified');

export async function test() {
  // Default browser (no webdrivers specified) - no split
  const result1 = await testGrid([], samplesPath);
  is(Object.keys(result1), ['e2e', 'lib', 'services'], 'default cells');
  is(result1['e2e'].servicers, ['kubernetes'], 'e2e servicers');
  is(result1['services'].servicers, ['docker'], 'services servicers');

  // Multiple browsers - expands + cells
  const result2 = await testGrid(['chrome', 'firefox'], samplesPath);
  is(
    Object.keys(result2),
    ['e2e-chrome', 'e2e-firefox', 'lib', 'services'],
    'split cells',
  );
  is(result2['e2e-chrome'].webdriver, 'chrome', 'e2e-chrome webdriver');
  is(result2['e2e-firefox'].webdriver, 'firefox', 'e2e-firefox webdriver');
  is(result2['lib'].webdriver, null, 'lib has no webdriver');

  // Filter by paths
  const result3 = await testGrid(['tests/e2e'], samplesPath);
  is(Object.keys(result3), ['e2e'], 'filtered cells');
  is(result3['e2e'].paths, ['tests/e2e'], 'filtered paths');
}

async function testGrid(args, cwd) {
  let stdout = '';
  const watestBin = path.join(__dirname, '../../bin/watest.js');

  await spawn('node', [watestBin, '--grid', ...args], { cwd }, buffer => {
    for (let { str_data, is_stdout } of buffer) {
      if (is_stdout) stdout += str_data;
    }
  });

  const jsonStart = stdout.indexOf('{');
  if (jsonStart < 0) {
    throw new Error(`No JSON in output: ${stdout}`);
  }
  return JSON.parse(stdout.slice(jsonStart));
}
