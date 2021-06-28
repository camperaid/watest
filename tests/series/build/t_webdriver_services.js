'use strict';

const { is, MockSeries } = require('../test.js');

module.exports.test = async () => {
  const test = got => got.name == 'test_wrap';
  const init = got => got.name == 'init';
  const uninit = got => got.name == 'uninit';
  const ts = {
    'e2e': {
      meta: {
        webdriver: true,
        services: ['db'],
      },
      files: ['t_testo.js', 't_presto.js'],
    },
    'e2e/t_testo.js': {
      test() {},
    },
    'e2e/t_presto.js': {
      test() {},
    },
  };

  const series = new MockSeries('', { ts, webdrivers: ['chrome', 'firefox'] });
  const tests = await series.build({
    patterns: [],
    folder: 'e2e',
    virtual_folder: 'e2e',
  });
  series.shutdown();

  is(
    tests,
    [
      {
        name: 'e2e/chrome',
        path: 'e2e/',
        subtests: [
          {
            name: 'e2e/chrome/init',
            path: 'e2e/meta.js',
            func: init,
            failures_info: [],
            skip_on_fail: 'skip-on-fail',
          },
          {
            name: 'e2e/chrome/t_testo.js',
            path: 'e2e/t_testo.js',
            func: test,
            failures_info: [],
            webdriver: 'chrome',
          },
          {
            name: 'e2e/chrome/t_presto.js',
            path: 'e2e/t_presto.js',
            func: test,
            failures_info: [],
            webdriver: 'chrome',
          },
          {
            name: 'e2e/chrome/uninit',
            path: 'e2e/meta.js',
            func: uninit,
            failures_info: [],
            skip_on_fail: 'skip-on-fail',
          },
        ],
      },
      {
        name: 'e2e/firefox',
        path: 'e2e/',
        subtests: [
          {
            name: 'e2e/firefox/init',
            path: 'e2e/meta.js',
            func: init,
            failures_info: [],
            skip_on_fail: 'skip-on-fail',
          },
          {
            name: 'e2e/firefox/t_testo.js',
            path: 'e2e/t_testo.js',
            func: test,
            failures_info: [],
            webdriver: 'firefox',
          },
          {
            name: 'e2e/firefox/t_presto.js',
            path: 'e2e/t_presto.js',
            func: test,
            failures_info: [],
            webdriver: 'firefox',
          },
          {
            name: 'e2e/firefox/uninit',
            path: 'e2e/meta.js',
            func: uninit,
            failures_info: [],
            skip_on_fail: 'skip-on-fail',
          },
        ],
      },
    ],
    'build'
  );
};
