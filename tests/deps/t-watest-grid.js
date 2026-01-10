import { is, testGrid } from './test.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesPath = path.join(__dirname, 'samples/unified');

export async function test() {
  // Default browsers from .watestrc.js (chrome, firefox) - splits + cells
  const result1 = await testGrid([], samplesPath);
  is(
    result1,
    {
      'e2e-chrome': {
        paths: ['tests/e2e'],
        webdrivers: 'chrome',
        servicers: ['kubernetes'],
        services: ['db', 'nginx', 'request'],
      },
      'e2e-firefox': {
        paths: ['tests/e2e'],
        webdrivers: 'firefox',
        servicers: ['kubernetes'],
        services: ['db', 'nginx', 'request'],
      },
      'integration': {
        paths: ['tests/integration'],
        webdrivers: 'chrome firefox',
        servicers: ['docker'],
        services: ['db'],
      },
      'lib': {
        paths: ['tests/lib'],
        webdrivers: '',
        servicers: [],
        services: [],
      },
      'services': {
        paths: ['tests/services'],
        webdrivers: '',
        servicers: ['docker'],
        services: ['inbucket', 'request'],
      },
    },
    'default browsers split + cells',
  );

  // Single browser - no split even for + cells
  const result2 = await testGrid(['chrome'], samplesPath);
  is(
    result2,
    {
      e2e: {
        paths: ['tests/e2e'],
        webdrivers: 'chrome',
        servicers: ['kubernetes'],
        services: ['db', 'nginx', 'request'],
      },
      integration: {
        paths: ['tests/integration'],
        webdrivers: 'chrome',
        servicers: ['docker'],
        services: ['db'],
      },
      lib: {
        paths: ['tests/lib'],
        webdrivers: '',
        servicers: [],
        services: [],
      },
      services: {
        paths: ['tests/services'],
        webdrivers: '',
        servicers: ['docker'],
        services: ['inbucket', 'request'],
      },
    },
    'single browser no split',
  );

  // Multiple browsers without split (no + cells, explicit browsers)
  const result3 = await testGrid(
    ['tests/lib', 'chrome', 'firefox'],
    samplesPath,
  );
  is(
    result3,
    {
      lib: {
        paths: ['tests/lib'],
        webdrivers: '',
        servicers: [],
        services: [],
      },
    },
    'no webdriver cell with multiple browsers',
  );

  // Filter by paths with multiple browsers (+ cell splits)
  const result4 = await testGrid(
    ['tests/e2e', 'chrome', 'firefox'],
    samplesPath,
  );
  is(
    result4,
    {
      'e2e-chrome': {
        paths: ['tests/e2e'],
        webdrivers: 'chrome',
        servicers: ['kubernetes'],
        services: ['db', 'nginx', 'request'],
      },
      'e2e-firefox': {
        paths: ['tests/e2e'],
        webdrivers: 'firefox',
        servicers: ['kubernetes'],
        services: ['db', 'nginx', 'request'],
      },
    },
    'filtered paths with split',
  );
}
