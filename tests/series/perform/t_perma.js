'use strict';

const {
  completed_checkers,
  fail,
  format_todo,
  format_warning,
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
          'perma',
          '*',
          [`Server terminates connection`],
          `Server terminates connection 421 error`,
        ],
      ],
    ],
  ];

  // intermittent
  await is_output(
    perform([
      {
        name: 't_testo.js',
        failures,
        func() {
          fail('Server terminates connection');
        },
      },
    ]),
    [
      running_checker(`t_testo.js`),
      format_warning(`Server terminates connection`),
      format_todo(`Server terminates connection 421 error`),
      ...completed_checkers({
        context: 'tests/',
        name: 't_testo.js',
        warnings: 1,
        todos: 1,
      }),
    ],
    [],
    'perma'
  );
};
