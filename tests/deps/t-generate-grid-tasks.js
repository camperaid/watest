import { is, generateGridTasks } from './test.js';

export async function test() {
  const grid = {
    'e2e+': ['tests/deps/samples/unified/tests/e2e'],
    'lib': ['tests/deps/samples/unified/tests/lib'],
    'services': ['tests/deps/samples/unified/tests/services'],
  };

  // Default browser (no webdrivers specified) - no split
  const result1 = await generateGridTasks(grid, []);
  is(Object.keys(result1), ['e2e', 'lib', 'services'], 'default cells');
  is(result1['e2e'].servicers, ['kubernetes'], 'e2e servicers');
  is(result1['services'].servicers, ['docker'], 'services servicers');

  // Multiple browsers - expands + cells
  const result2 = await generateGridTasks(grid, ['chrome', 'firefox']);
  is(
    Object.keys(result2),
    ['e2e-chrome', 'e2e-firefox', 'lib', 'services'],
    'split cells',
  );
  is(result2['e2e-chrome'].webdriver, 'chrome', 'e2e-chrome webdriver');
  is(result2['e2e-firefox'].webdriver, 'firefox', 'e2e-firefox webdriver');
  is(result2['lib'].webdriver, null, 'lib has no webdriver');

  // Filter by paths
  const result3 = await generateGridTasks(grid, [
    'tests/deps/samples/unified/tests/e2e',
  ]);
  is(Object.keys(result3), ['e2e'], 'filtered cells');
  is(
    result3['e2e'].paths,
    ['tests/deps/samples/unified/tests/e2e'],
    'filtered paths',
  );
}
