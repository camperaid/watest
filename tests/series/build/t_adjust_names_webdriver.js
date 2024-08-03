import { is, MockSeries } from '../test.js';

export async function test() {
  const test = got => got.name == 'test_wrap';
  const ts = {
    'tests': {
      meta: {
        folders: ['webdriver'],
      },
    },
    'tests/webdriver': {
      meta: {
        folders: ['end-to-end'],
        webdriver: true,
      },
    },
    'tests/webdriver/end-to-end': {
      meta: {
        folders: ['sharing'],
      },
    },
    'tests/webdriver/end-to-end/sharing': {
      files: ['t_shared_editing.js'],
    },
    'tests/webdriver/end-to-end/sharing/t_shared_editing.js': {
      test() {},
    },
  };

  const series = new MockSeries([], { ts, webdrivers: ['chrome', 'firefox'] });
  const tests = await series.build({
    patterns: [
      {
        path: 'tests/webdriver/end-to-end/sharing/t_shared_editing.js',
        webdriver: 'chrome',
      },
    ],
    folder: 'tests',
    virtual_folder: 'mac',
  });
  series.adjustTestNames(tests, '2');
  series.shutdown();

  is(
    tests,
    [
      {
        name: 'mac/webdriver',
        path: 'tests/webdriver/',
        subtests: [
          {
            name: 'mac/webdriver/chrome',
            path: 'tests/webdriver/',
            subtests: [
              {
                name: 'mac/webdriver/chrome/end-to-end',
                path: 'tests/webdriver/end-to-end/',
                subtests: [
                  {
                    name: 'mac/webdriver/chrome/end-to-end/sharing2',
                    path: 'tests/webdriver/end-to-end/sharing/',
                    subtests: [
                      {
                        name: 'mac/webdriver/chrome/end-to-end/sharing2/t_shared_editing.js',
                        path: 'tests/webdriver/end-to-end/sharing/t_shared_editing.js',
                        func: test,
                        webdriver: 'chrome',
                        failures_info: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    'build',
  );
}
