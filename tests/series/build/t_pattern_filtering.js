import { is, MockSeries } from '../test.js';

export async function test() {
  // Test that buildSubtests only processes subfolders that match patterns
  // This test tracks which directories are actually accessed to verify the optimization

  const accessedDirs = [];

  class TrackingMockSeries extends MockSeries {
    loadTestMeta(folder) {
      accessedDirs.push(folder);
      return super.loadTestMeta(folder);
    }

    getTestFileList(folder) {
      accessedDirs.push(folder);
      return super.getTestFileList(folder);
    }
  }

  const ts = {
    'tests': {
      meta: {
        folders: ['unit', 'integration', 'e2e'],
      },
    },
    'tests/unit': {
      meta: {
        folders: ['base', 'core'],
      },
    },
    'tests/unit/base': {
      files: ['t_test1.js'],
    },
    'tests/unit/base/t_test1.js': {
      test() {},
    },
    'tests/unit/core': {
      files: ['t_test2.js'],
    },
    'tests/unit/core/t_test2.js': {
      test() {},
    },
    'tests/integration': {
      files: ['t_integration.js'],
    },
    'tests/integration/t_integration.js': {
      test() {},
    },
    'tests/e2e': {
      files: ['t_e2e.js'],
    },
    'tests/e2e/t_e2e.js': {
      test() {},
    },
  };

  const series = new TrackingMockSeries([], { ts });

  // Test 1: When targeting a specific test, only relevant folders should be processed
  accessedDirs.length = 0; // Clear the array

  const tests = await series.build({
    patterns: [
      {
        path: 'tests/unit/base/t_test1.js',
        webdriver: '',
      },
    ],
    folder: 'tests',
    virtual_folder: 'mac',
  });
  series.shutdown();

  // Should only build the unit folder and its relevant subfolders
  // Should NOT build integration or e2e folders
  const testNames = getAllTestNames(tests);

  // Should include the targeted test and its path
  is(
    testNames.includes('mac/unit/base/t_test1.js'),
    true,
    'Should include the targeted test',
  );

  // Should NOT include tests from unrelated folders
  is(
    testNames.includes('mac/integration/t_integration.js'),
    false,
    'Should not include integration tests when targeting unit test',
  );

  is(
    testNames.includes('mac/e2e/t_e2e.js'),
    false,
    'Should not include e2e tests when targeting unit test',
  );

  // Check directory access optimization - this will fail with commented optimization
  is(
    accessedDirs.includes('tests/integration'),
    false,
    'Should not access integration directory when targeting unit test',
  );

  is(
    accessedDirs.includes('tests/e2e'),
    false,
    'Should not access e2e directory when targeting unit test',
  );

  // Test 2: When no patterns specified, all folders should be processed
  accessedDirs.length = 0; // Clear the array

  const allTests = await series.build({
    patterns: [],
    folder: 'tests',
    virtual_folder: 'mac',
  });

  const allTestNames = getAllTestNames(allTests);

  // Should include all tests when no patterns specified
  is(
    allTestNames.includes('mac/unit/base/t_test1.js'),
    true,
    'Should include unit test when no patterns',
  );

  is(
    allTestNames.includes('mac/integration/t_integration.js'),
    true,
    'Should include integration test when no patterns',
  );

  is(
    allTestNames.includes('mac/e2e/t_e2e.js'),
    true,
    'Should include e2e test when no patterns',
  );

  // When no patterns, all directories should be accessed
  is(
    accessedDirs.includes('tests/integration'),
    true,
    'Should access integration directory when no patterns specified',
  );

  is(
    accessedDirs.includes('tests/e2e'),
    true,
    'Should access e2e directory when no patterns specified',
  );
}

function getAllTestNames(tests) {
  const names = [];

  function collectNames(testList) {
    for (const test of testList) {
      if (test.subtests) {
        collectNames(test.subtests);
      } else if (
        test.name &&
        !test.name.includes('/init') &&
        !test.name.includes('/uninit')
      ) {
        names.push(test.name);
      }
    }
  }

  collectNames(tests);
  return names;
}
