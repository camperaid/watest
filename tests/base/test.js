'use strict';

const testflow = require('../../core/core.js');
const base = require('../../core/base.js');

const scripts = [
  '../../core/base.js',
  '../../core/core.js',
  '../../core/format.js',
];
for (let script of scripts) {
  let script_exports = require(script);
  for (let e in script_exports) {
    module.exports[e] = script_exports[e];
  }
}

function is_output(func, out, err, msg) {
  return base.is_output(
    () => {
      testflow.lock();
      func();
      testflow.unlock();
    },
    out,
    err,
    msg
  );
}

module.exports.is_output = is_output;
