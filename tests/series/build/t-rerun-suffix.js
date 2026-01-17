import { is, MockSeries } from '../test.js';

export async function test() {
  const test = got => got.name == 'test_wrap';
  const ts = {
    'www': {
      meta: {
        folders: ['ui', 'api'],
      },
    },
    'www/ui': {
      files: ['t_login.js'],
    },
    'www/ui/t_login.js': {
      test() {},
    },
    'www/api': {
      files: ['t_search.js'],
    },
    'www/api/t_search.js': {
      test() {},
    },
  };

  const series = new MockSeries([], { ts });
  const tests = await series.build({
    patterns: [],
    folder: 'www',
    virtual_folder: 'linux/www',
  });
  series.applyRerunSuffix(tests, '5');
  series.shutdown();

  is(
    tests,
    [
      {
        name: 'linux/www-5/ui',
        path: 'www/ui/',
        subtests: [
          {
            name: 'linux/www-5/ui/t_login.js',
            path: 'www/ui/t_login.js',
            func: test,
            failures_info: [],
            webdriver: '',
          },
        ],
      },
      {
        name: 'linux/www-5/api',
        path: 'www/api/',
        subtests: [
          {
            name: 'linux/www-5/api/t_search.js',
            path: 'www/api/t_search.js',
            func: test,
            failures_info: [],
            webdriver: '',
          },
        ],
      },
    ],
    'rerun suffix transforms linux/www → linux/www-5',
  );
}
