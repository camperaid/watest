'use strict';

const { is, MockSeries } = require('../test.js');

module.exports.test = async () => {
  const test = got => got.name == 'test_wrap';
  const ts = {
    'e2e': {
      meta: {
        webdriver: true,
        folders: ['core'],
      },
    },
    'e2e/core': {
      files: ['t_core.js'],
    },
    'e2e/core/t_core.js': {
      test() {},
    },
  };

  const series = new MockSeries('', { ts, webdrivers: ['chrome', 'firefox'] });
  const tests = series.build({ patterns: [], folder: 'e2e', virtual_folder: 'e2e' });
  series.shutdown();

  is(
    tests,
    [
      {
        name: 'e2e/chrome',
        subtests: [
          {
            name: 'e2e/chrome/core',
            subtests: [
              {
                name: 'e2e/chrome/core/t_core.js',
                path: 'e2e/core/t_core.js',
                func: test,
                failures_info: [],
                webdriver: 'chrome',
              },
            ],
          },
        ],
      },
      {
        name: 'e2e/firefox',
        subtests: [
          {
            name: 'e2e/firefox/core',
            subtests: [
              {
                name: 'e2e/firefox/core/t_core.js',
                path: 'e2e/core/t_core.js',
                func: test,
                failures_info: [],
                webdriver: 'firefox',
              },
            ],
          },
        ],
      },
    ],
    'build'
  );
};
