'use strict';

const {
  completed_checkers,
  fail,
  format_failure,
  format_intermittent,
  format_warning,
  is_output,
  perform,
  running_checker,
} = require('../test.js');

module.exports.test = async () => {
  // missing perma
  let failures = [
    [
      't_testo.js',
      [
        [
          'all',
          'perma',
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
          fail('Server busy');
        },
      },
    ]),
    [
      running_checker(`t_testo.js`, 't_testo.js',),
      ...completed_checkers({ context: 'tests/', name: 't_testo.js' }),
    ],
    [
      format_failure(`Server busy`),
      format_failure(
        `Perma failure 'Server terminates connection' has never been hit`
      ),
      format_failure(`has 2 failure(s)`, `>t_testo.js`),
    ],
    'missing perma'
  );

  // no perma but intermittent
  failures = [
    [
      't_testo.js',
      [
        [
          'all',
          'perma',
          '*',
          [`Server terminates connection`],
          `Server terminates connection 421 error`,
        ],
        ['all', 'intermittent', '*', [`Map timeout`], `Map timeout`],
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
          fail('Map timeout');
        },
      },
    ]),
    [
      running_checker(`t_testo.js`, 't_testo.js',),
      format_warning(`Map timeout`),
      format_intermittent(`Map timeout`),
      ...completed_checkers({
        context: 'tests/',
        name: `t_testo.js`,
        warnings: 1,
        intermittents: 1,
      }),
    ],
    [],
    'no perma but intermittent'
  );
};
