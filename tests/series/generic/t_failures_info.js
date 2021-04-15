'use strict';

const { is, Series } = require('../test.js');

module.exports.test = () => {
  // failuresInfo: all
  let failures = [
    [
      't_production_mail.js',
      [
        [
          'all',
          'intermittent',
          null,
          [
            `Server terminates connection. response=421 4.7.0 Try again later, closing connection.`,
          ],
          `Server terminates connection 421 error`,
        ],
      ],
    ],
  ];
  is(
    Series.failuresInfo({ failures, testname: 't_production_mail.js' }),
    [
      {
        type: 'intermittent',
        group: null,
        list: [
          'Server terminates connection. response=421 4.7.0 Try again later, closing connection.',
        ],
        msg: 'Server terminates connection 421 error',
      },
    ],
    `all`
  );

  // failuresInfo: win-chrome
  failures = [
    [
      't_loc_refresh.js',
      [
        [
          'win-chrome',
          'intermittent',
          'Wait for LocInfo for Upper Mazinaw Lake',
          [
            `LocInfo panel is shown`,
            `LocInfo title`,
            `Waiting until element is visible`,
          ],
          `No LocInfo is shown, InfoWindow with no title is shown instead`,
        ],
      ],
    ],
  ];
  is(
    Series.failuresInfo({
      failures,
      webdriver: 'chrome',
      platform: 'win32',
      testname: 't_loc_refresh.js',
    }),
    [
      {
        type: 'intermittent',
        group: 'Wait for LocInfo for Upper Mazinaw Lake',
        list: [
          'LocInfo panel is shown',
          'LocInfo title',
          'Waiting until element is visible',
        ],
        msg: 'No LocInfo is shown, InfoWindow with no title is shown instead',
      },
    ],
    `win-chrome`
  );

  // all-firefox
  failures = [
    [
      't_map.js',
      [
        [
          'all-firefox',
          'intermittent',
          'Wait for LocInfo for Killarney Provincial Park',
          [
            `LocInfo panel is shown. Failure details: ""`,
            `LocInfo title. Failure details: ""`,
            `Waiting until element is visible`,
          ],
          `Double click triggers intermittently when Killarney marker is clicked, what makes create-trip-dialog showing`,
        ],
        [
          'win-chrome',
          'intermittent',
          'Check markers. Expected: locInfo_tmp',
          [
            `script retval match, got: [{"lat":46.0130472,"lng":-81.4017498,"name":"Killarney Provincial Park","type":"standard","x":-1,"y":0},{"lat":46.0130472,"lng":-81.4017498,"type":"locInfo_tmp","x":-1,"y":0}], expected: [{"type":"locInfo_tmp"}]`,
            `Invoke getOnScreenMarkers script`,
            `Waiting until script list matches`,
          ],
          `Standard marker is shown instead a temporary icon`,
        ],
      ],
    ],
  ];
  is(
    Series.failuresInfo({
      failures,
      webdriver: 'firefox',
      platform: 'win32',
      testname: 't_map.js',
    }),
    [
      {
        type: 'intermittent',
        group: 'Wait for LocInfo for Killarney Provincial Park',
        list: [
          'LocInfo panel is shown. Failure details: ""',
          'LocInfo title. Failure details: ""',
          'Waiting until element is visible',
        ],
        msg:
          'Double click triggers intermittently when Killarney marker is clicked, what makes create-trip-dialog showing',
      },
    ],
    'all-firefox'
  );

  // chrome-mobile
  failures = [
    [
      't_enter.js',
      [
        [
          'all-chrome',
          'perma',
          `Check items:
      accessories
        matches
      food
    `,
          [
            `HTML match for '#editor'`,
            `Get checklist. Failure details: {"got":"<ul><li>accessories</li><ul><li>matches</li></ul><li>food</li></ul>","expected":"<ul><li>accessories</li><ul><li>matches</li></ul></ul><ul><li>food</li></ul>","msg":"HTML match for '#editor'"}`,
            `Waiting until element has HTML`,
          ],
        ],
        [
          'all-chrome-mobile',
          'perma',
          `Check items:
      accessories
        matches
      food
    `,
          [
            `HTML match for '#editor'`,
            `Get checklist. Failure details: {"got":"<ul><li>accessories</li><ul><li>matches</li></ul><li>food</li></ul>","expected":"<ul><li>accessories</li><ul><li>matches</li></ul></ul><ul><li>food</li></ul>","msg":"HTML match for '#editor'"}`,
            `Waiting until element has HTML`,
          ],
        ],
      ],
    ],
  ];
  is(
    Series.failuresInfo({
      failures,
      webdriver: 'chrome-mobile',
      platform: 'win32',
      testname: 't_enter.js',
    }),
    [
      {
        type: 'perma',
        group: `Check items:
      accessories
        matches
      food
    `,
        list: [
          `HTML match for '#editor'`,
          `Get checklist. Failure details: {"got":"<ul><li>accessories</li><ul><li>matches</li></ul><li>food</li></ul>","expected":"<ul><li>accessories</li><ul><li>matches</li></ul></ul><ul><li>food</li></ul>","msg":"HTML match for '#editor'"}`,
          `Waiting until element has HTML`,
        ],
        msg: undefined,
      },
    ],
    'chrome-mobile'
  );

  // common failures aka '*' test filters
  failures = [
    [
      't_production_mail.js',
      [
        [
          'all',
          'intermittent',
          '*',
          [
            `Server terminates connection. response=421 4.7.0 Try again later, closing connection.`,
          ],
          `Server terminates connection 421 error`,
        ],
      ],
    ],
    [
      '*',
      [
        [
          'all',
          'intermittent',
          '*',
          [`socket hangup`],
          `Intermittent socket hangup`,
        ],
      ],
    ],
  ];
  is(
    Series.failuresInfo({ failures, testname: 't_production_mail.js' }),
    [
      {
        type: 'intermittent',
        group: '*',
        list: [
          'Server terminates connection. response=421 4.7.0 Try again later, closing connection.',
        ],
        msg: 'Server terminates connection 421 error',
      },
      {
        type: 'intermittent',
        group: '*',
        list: [`socket hangup`],
        msg: 'Intermittent socket hangup',
      },
    ],
    `common`
  );
};
