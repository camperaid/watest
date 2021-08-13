'use strict';

const { is, MockSeries } = require('../test.js');

module.exports.test = async () => {
  const test = got => got.name == 'test_wrap';
  const ts = {
    'tests': {
      meta: {
        folders: ['unit', 'e2e'],
      },
    },
    'tests/unit': {
      files: ['t_unito.js'],
    },
    'tests/unit/t_unito.js': {
      test() {},
    },
    'tests/e2e': {
      meta: {
        webdriver: true,
      },
      files: ['t_testo.js'],
    },
    'tests/e2e/t_testo.js': {
      test() {},
    },
  };

  const series = new MockSeries('', { ts, webdrivers: ['firefox'] });
  const tests = await series.build({
    patterns: [],
    folder: 'tests',
    virtual_folder: 'myrun',
  });
  series.shutdown();

  is(
    tests,
    [
      {
        name: 'myrun/unit',
        path: 'tests/unit/',
        subtests: [
          {
            name: 'myrun/unit/t_unito.js',
            path: 'tests/unit/t_unito.js',
            func: test,
            webdriver: '',
            failures_info: [],
          },
        ],
      },
      {
        name: 'myrun/e2e',
        path: 'tests/e2e/',
        subtests: [
          {
            name: 'myrun/e2e/firefox',
            path: 'tests/e2e/',
            loader: undefined,
            webdriver: 'firefox',
            run_in_child_process: true,
          },
        ],
      },
    ],
    'build'
  );
};
