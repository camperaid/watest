import { is, MockSeries } from '../test.js';

export async function test() {
  const test = got => got.name == 'test_wrap';
  const ts = {
    'unit': {
      meta: {
        folders: ['base', 'core'],
      },
    },
    'unit/base': {
      meta: {
        folders: ['generic'],
      },
      files: ['t_testo.js'],
    },
    'unit/base/t_testo.js': {
      test() {},
    },
    'unit/base/generic': {
      files: ['t_nahimov.js'],
    },
    'unit/base/generic/t_nahimov.js': {
      test() {},
    },
    'unit/core': {
      files: ['t_presto.js'],
    },
    'unit/core/t_presto.js': {
      test() {},
    },
  };

  const series = new MockSeries([], { ts });
  const tests = await series.build({
    patterns: [],
    folder: 'unit',
    virtual_folder: 'unit',
  });
  series.adjustTestNames(tests, '2');
  series.shutdown();

  is(
    tests,
    [
      {
        name: 'unit/base2',
        path: 'unit/base/',
        subtests: [
          {
            name: 'unit/base2/t_testo.js',
            path: 'unit/base/t_testo.js',
            func: test,
            failures_info: [],
            webdriver: '',
          },
          {
            name: 'unit/base2/generic',
            path: 'unit/base/generic/',
            subtests: [
              {
                name: 'unit/base2/generic/t_nahimov.js',
                path: 'unit/base/generic/t_nahimov.js',
                func: test,
                failures_info: [],
                webdriver: '',
              },
            ],
          },
        ],
      },
      {
        name: 'unit/core2',
        path: 'unit/core/',
        subtests: [
          {
            name: 'unit/core2/t_presto.js',
            path: 'unit/core/t_presto.js',
            func: test,
            failures_info: [],
            webdriver: '',
          },
        ],
      },
    ],
    'build',
  );
}
