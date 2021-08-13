'use strict';

const { is, MockSeries } = require('../test.js');

module.exports.test = async () => {
  const init = got => got.name == 'init';
  const func = got => got.name == 'test_wrap';
  const uninit = got => got.name == 'uninit';

  const ts = {
    'tests': {
      meta: {
        folders: ['unit', 'e2e'],
        init() {},
        uninit() {},
      },
    },
    'tests/unit': {
      files: ['t_testo.js'],
    },
    'tests/unit/t_testo.js': {
      test() {},
    },
    'tests/e2e': {
      meta: {
        webdriver: true,
        folders: ['controls'],
      },
      files: ['t_presto.js'],
    },
    'tests/e2e/controls': {
      files: ['t_input.js'],
    },
    'tests/e2e/controls/t_input.js': {
      test() {},
    },
    'tests/e2e/t_presto.js': {
      test() {},
    },
  };

  const series = new MockSeries([], { ts, webdrivers: ['chrome', 'firefox'] });
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
        name: 'mac/init',
        path: 'tests/meta.js',
        func: init,
        skip_on_fail: 'skip-on-fail',
        failures_info: [],
        init_or_uninit: true,
      },
      {
        name: 'mac/unit',
        path: 'tests/unit/',
        subtests: [
          {
            name: 'mac/unit/t_testo.js',
            path: 'tests/unit/t_testo.js',
            func,
            webdriver: '',
            failures_info: [],
          },
        ],
      },
      {
        name: 'mac/e2e',
        path: 'tests/e2e/',
        subtests: [
          {
            name: 'mac/e2e/chrome',
            path: 'tests/e2e/',
            subtests: [
              {
                name: 'mac/e2e/chrome/t_presto.js',
                path: 'tests/e2e/t_presto.js',
                func,
                webdriver: 'chrome',
                failures_info: [],
              },
              {
                name: 'mac/e2e/chrome/controls',
                path: 'tests/e2e/controls/',
                subtests: [
                  {
                    name: 'mac/e2e/chrome/controls/t_input.js',
                    path: 'tests/e2e/controls/t_input.js',
                    func,
                    webdriver: 'chrome',
                    failures_info: [],
                  },
                ],
              },
            ],
          },
          {
            name: 'mac/e2e/firefox',
            path: 'tests/e2e/',
            loader: undefined,
            webdriver: 'firefox',
            run_in_child_process: true,
          },
        ],
      },
      {
        name: 'mac/uninit',
        path: 'tests/meta.js',
        func: uninit,
        skip_on_fail: 'skip-on-fail',
        failures_info: [],
        init_or_uninit: true,
      },
    ],
    'build'
  );
};
