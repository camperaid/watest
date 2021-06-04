'use strict';

const {
  completed_checkers,
  format_ok,
  is_output,
  perform,
  success,
  running_checker,
} = require('../test.js');

module.exports.test = async () => {
  // success
  await is_output(
    perform([
      {
        name: 't_testo.js',
        failures: [],
        func() {
          success('Successio!');
        },
      },
    ]),
    [
      running_checker(`t_testo.js`),
      format_ok('Successio!'),
      ...completed_checkers({ context: 'tests/', name: 't_testo.js' }),
    ],
    [],
    'success'
  );

  // success: unmatched expected failures
  await is_output(
    perform([
      {
        name: 't_testo.js',
        failures: [
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
        ],
        func() {
          success('Successio!');
        },
      },
    ]),
    [
      running_checker(`t_testo.js`),
      format_ok('Successio!'),
      ...completed_checkers({ context: 'tests/', name: 't_testo.js' }),
    ],
    [],
    'success #2'
  );
};
