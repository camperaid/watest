import { testDeps } from './test.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const unifiedSamplePath = path.join(__dirname, 'samples/unified');
const nestedSamplePath = path.join(__dirname, 'samples/nested');

export async function test() {
  // Test specific path: tests/e2e
  await testDeps(['tests/e2e'], unifiedSamplePath, {
    servicers: ['kubernetes'],
    webdriver: true,
    services: ['db', 'nginx', 'request'],
  });

  // Test no arguments (should default to tests/)
  await testDeps([], unifiedSamplePath, {
    servicers: ['kubernetes', 'docker'],
    webdriver: true,
    services: ['db', 'nginx', 'request', 'inbucket'],
  });

  // Test with deeply nested test file path
  await testDeps(['tests/services/ws/webservice/t-ws.js'], nestedSamplePath, {
    servicers: ['docker'],
    webdriver: false,
    services: ['ws'],
  });

  // Test with nested directory path
  await testDeps(['tests/services/ws/webservice'], nestedSamplePath, {
    servicers: ['docker'],
    webdriver: false,
    services: ['ws'],
  });
}
