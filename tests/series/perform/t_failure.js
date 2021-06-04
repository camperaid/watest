'use strict';

const {
  completed_checkers,
  format_failure,
  fail,
  is_output,
  perform,
  running_checker,
} = require('../test.js');

module.exports.test = async () => {
  const failures = [
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

  // fail
  await is_output(
    perform([
      {
        name: 't_testo.js',
        path: 't_testo.js',
        failures,
        func() {
          fail('Failio');
        },
      },
    ]),
    [
      running_checker(`t_testo.js`, `t_testo.js`),
      ...completed_checkers({ context: 'tests/', name: `t_testo.js` }),
    ],
    [format_failure('Failio'), format_failure(`has 1 failure(s)`, `>t_testo.js`)],
    'fail'
  );
};
