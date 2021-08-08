'use strict';

const { is, MockSeries } = require('../test.js');

module.exports.test = async () => {
  const ts = {
    'tests': {
      meta: {
        folders: ['unit'],
      },
    },
    'tests/unit': {
      meta: {
        folders: ['base', 'core'],
        loader: true,
      },
    },
    'tests/unit/base': {
      files: ['t_testo.js'],
    },
    'tests/unit/base/t_testo.js': {
      test() {},
    },
    'tests/unit/core': {
      files: ['t_presto.js'],
    },
    'tests/unit/core/t_presto.js': {
      test() {},
    },
  };

  const series = new MockSeries([], { ts });
  const tests = await series.build({
    patterns: [
      {
        path: 'tests/unit/base',
        webdriver: '',
      },
      {
        path: 'tests/unit/core',
        webdriver: '',
      },
    ],
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
            name: 'mac/unit',
            path: 'tests/unit/base',
            loader: v => v.endsWith('tests/unit/meta.mjs'),
            loader_parent_virtual_folder: 'mac',
          },
          {
            name: 'mac/unit',
            path: 'tests/unit/core',
            loader: v => v.endsWith('tests/unit/meta.mjs'),
            loader_parent_virtual_folder: 'mac',
          },
        ],
      },
    ],
    'pattern'
  );
};
