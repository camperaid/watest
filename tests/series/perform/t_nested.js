'use strict';

const {
  completed_checkers,
  format_completed,
  format_ok,
  is_output,
  perform,
  success,
  running_checker,
} = require('../test.js');

module.exports.test = async () => {
  await is_output(
    perform([
      {
        name: 'unit',
        subtests: [
          {
            name: 'unit/base',
            subtests: [
              {
                name: 't_testo.js',
                path: 't_testo.js',
                failures: [],
                func() {
                  success('SuccessioUno!');
                },
              },
            ],
          },
          {
            name: 'unit/core',
            subtests: [
              {
                name: 't_pesto.js',
                path: 't_pesto.js',
                failures: [],
                func() {
                  success('SuccessioDuo!');
                },
              },
            ],
          },
        ],
      },
    ]),
    [
      running_checker(`t_testo.js`, `t_testo.js`),
      format_ok(`SuccessioUno!`),
      ...completed_checkers({ context: 'unit/base', name: 't_testo.js' }),
      running_checker(`t_pesto.js`, `t_pesto.js`),
      format_ok(`SuccessioDuo!`),
      ...completed_checkers({ context: 'unit/core', name: 't_pesto.js' }),
      format_completed(`unit`),
      format_completed(`tests/`)
    ],
    [],
    'nested'
  );
};
