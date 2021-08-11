'use strict';

const {
  format_completed,
  format_failure,
  format_failures,
  format_success,
  parse,
  parse_failure,
} = require('../../core/format.js');
const { is } = require('../../index.js');

module.exports.test = () => {
  // parse: failure
  is(
    parse(format_failure('Oops')),
    {
      color: 'failure',
      label: 'Failed:',
      msg: 'Oops',
    },
    'parse: failure'
  );

  // parse: completed
  is(
    parse(format_completed('Yes')),
    {
      color: 'completed',
      label: 'Completed',
      msg: 'Yes',
    },
    'parse: completed'
  );

  // parse: failures
  is(
    parse(format_failures(1, 'mac/webdriver/chrome/t_locmarker_click.js')),
    {
      color: 'failures',
      label: '>mac/webdriver/chrome/t_locmarker_click.js',
      msg: 'Failure count: 1',
    },
    'parse: failures'
  );

  // parse: success
  is(
    parse(format_success(1, 'mac/webdriver')),
    {
      color: 'success',
      label: 'mac/webdriver',
      msg: 'Total: 1',
    },
    'parse: success'
  );

  // parse_failure
  is(
    parse_failure(
      format_failure(
        'has 4 failure(s)',
        '>mac/webdriver/ui-blocks/firefox/map/t_locmarker_click.js'
      )
    ),
    {
      name: 'mac/webdriver/ui-blocks/firefox/map/t_locmarker_click.js',
      count: '4',
    }
  );
};
