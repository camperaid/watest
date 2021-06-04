'use strict';

const { is } = require('../../index.js');
const { stringify } = require('../../core/util.js');

module.exports.test = () => {
  is(stringify(null), `null`, 'null');
  is(stringify(3), `3`, 'number');
  is(stringify('hi'), `'hi'`, 'string');
  is(stringify([3, 4]), `[3, 4]`, 'numeric array');
  is(stringify(['Para', 'Mara']), `['Para', 'Mara']`, 'string array');
  is(stringify(['', '']), `['', '']`, 'string repeated value array');
  is(stringify({ field: 'Ho' }), `{field: 'Ho'}`, 'object');
  is(stringify({ a: 3, b: 4 }), `{a: 3, b: 4}`, 'multiple properties object');
  is(stringify({ a: 3, b: [4] }), `{a: 3, b: [4]}`, 'object->array');
  is(
    stringify({ a: 3, b: { m: 'hi' } }),
    `{a: 3, b: {m: 'hi'}}`,
    'object->object'
  );
  is(stringify(new Set(['v1', 'v2'])), `Set['v1', 'v2']`, 'set');
  is(stringify(new Map([['key', 'value']])), `Map{key: 'value'}`, 'map');
  is(stringify(/\d+/), `/\\d+/`, 'regexp');

  // functions
  is(
    stringify(() => 3),
    `() => 3`,
    'function'
  );

  function testo() {
    return 3;
  }
  is(stringify(testo), `testo()`, 'named function');

  is(stringify([testo, testo]), `[testo(), testo()]`, 'array of a function');

  testo.toString = () => 'newvalue';
  is(stringify(testo), `newvalue`, 'function overriden toString');

  // recursive
  const obj = {};
  obj.self = obj;
  is(stringify(obj), `{self: recursiveref}`, `recusive reference`);
};
