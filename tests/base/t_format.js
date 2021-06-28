'use strict';

const { colorify, parse } = require('../../core/format.js');
const { is } = require('../../index.js');

module.exports.test = () => {
  is(
    parse(colorify('failure', 'Failed!', 'Oops')),
    {
      color: 'failure',
      label: 'Failed!',
      msg: 'Oops',
    },
    'Parse'
  );
};
