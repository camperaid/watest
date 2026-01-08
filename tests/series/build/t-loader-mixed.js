import { is, MockSeries } from '../test.js';

export async function test() {
  const test = got => got.name == 'test_wrap';
  const ts = {
    'tests': {
      meta: {
        folders: ['unit', 'ui'],
      },
    },
    'tests/unit': {
      files: ['t_testo.js'],
    },
    'tests/unit/t_testo.js': {
      test() {},
    },
    'tests/ui': {
      meta: {
        loader: true,
      },
      files: ['t_presto.js'],
    },
    'tests/ui/t_presto.js': {
      test() {},
    },
  };

  const series = new MockSeries([], { ts });
  const tests = await series.build({
    patterns: [],
    folder: 'tests',
    virtual_folder: 'mac',
  });
  series.shutdown();

  is(
    tests,
    [
      {
        name: 'mac/unit',
        path: 'tests/unit/',
        subtests: [
          {
            name: 'mac/unit/t_testo.js',
            path: 'tests/unit/t_testo.js',
            func: test,
            webdriver: '',
            failures_info: [],
          },
        ],
      },
      {
        name: 'mac/ui',
        path: 'tests/ui/',
        loader: v => v.endsWith('tests/ui/meta.mjs'),
        webdriver: '',
        run_in_child_process: true,
      },
    ],
    'pattern',
  );
}
