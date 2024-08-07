import { is, MockSeries } from '../test.js';

export async function test() {
  const test = got => got.name == 'test_wrap';
  const ts = {
    'e2e': {
      meta: {
        webdriver: true,
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

  const series = new MockSeries([], { ts, webdrivers: ['chrome', 'firefox'] });
  const tests = await series.build({
    patterns: [
      {
        path: 'e2e/t_testo.js',
        webdriver: '',
      },
    ],
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
            name: 'e2e/chrome/t_testo.js',
            path: 'e2e/t_testo.js',
            func: test,
            webdriver: 'chrome',
            failures_info: [],
          },
        ],
      },
      {
        name: 'e2e/firefox',
        path: 'e2e/t_testo.js',
        webdriver: 'firefox',
        loader: undefined,
        run_in_child_process: true,
      },
    ],
    'pattern',
  );
}
