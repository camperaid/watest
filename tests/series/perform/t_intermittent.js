'use strict';

const {
  completed_checkers,
  format_intermittent,
  format_warning,
  fail,
  is_output,
  perform,
  running_checker,
} = require('../test.js');

module.exports.test = async () => {
  // intermittent
  let failures = [
    [
      't_testo.js',
      [
        [
          'all',
          'intermittent',
          '*',
          [`Server terminates connection`],
          `Server terminates connection 421 error`,
        ],
      ],
    ],
  ];

  await is_output(
    perform([
      {
        name: 't_testo.js',
        path: 't_testo.js',
        failures,
        func() {
          fail('Server terminates connection');
        },
      },
    ]),
    [
      running_checker(`t_testo.js`, `t_testo.js`),
      format_warning(`Server terminates connection`),
      format_intermittent(`Server terminates connection 421 error`),
      ...completed_checkers({
        context: 'tests/',
        name: 't_testo.js',
        intermittents: 1,
        warnings: 1,
      }),
    ],
    [],
    'intermittent'
  );

  // generic intermittent
  failures = [
    [
      '*',
      [
        [
          'all',
          'intermittent',
          '*',
          [`Map retrieveBounds timeout`, `*`],
          `Map timeout`,
        ],
      ],
    ],
  ];

  await is_output(
    perform([
      {
        name: 't_testo_1.js',
        path: 't_testo_1.js',
        failures,
        func() {
          fail('Map retrieveBounds timeout');
        },
      },
      {
        name: 't_testo_2.js',
        path: 't_testo_2.js',
        failures,
        func() {
          fail('Map retrieveBounds timeout');
          fail('Map retrieveBounds timeout');
          fail('Dialog is shown');
        },
      },
    ]),
    [
      running_checker('t_testo_1.js', 't_testo_1.js'),
      format_warning(`Map retrieveBounds timeout`),
      ...completed_checkers({ name: 't_testo_1.js', warnings: 1 }),
      running_checker('t_testo_2.js', 't_testo_2.js'),
      format_warning(`Map retrieveBounds timeout`),
      format_warning(`Map retrieveBounds timeout`),
      format_intermittent(`Map timeout`),
      format_warning(`Dialog is shown`),
      format_intermittent(`Map timeout`),
      ...completed_checkers({
        context: 'tests/',
        name: 't_testo_2.js',
        warnings: 3,
        intermittents: 2,
      }),
    ],
    [],
    'generic intermittent'
  );
};
