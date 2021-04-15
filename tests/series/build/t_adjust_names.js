'use strict';

const { is, MockSeries } = require('../test.js');

module.exports.test = async () => {
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
  const tests = series.build({ patterns: [], folder: 'unit', virtual_folder: 'unit' });
  series.adjustTestNames(tests, '2');
  series.shutdown();

  is(
    tests,
    [
      {
        name: 'unit/base2',
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
    'build'
  );
};
