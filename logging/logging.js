'use strict';

const { ProcessArgs } = require('../core/process_args.js');

function log(...args) {
  console.log(...args);
}

function log_trace(...args) {
  console.trace(...args);
}

function log_error(...args) {
  // No stderr in a child process, becuase stdout/stderr streams buffer the data
  // before sending it via callbacks, which may make buffers to contain output
  // from multiple console.log/error calls, which makes the child process output
  // processing messy.
  ProcessArgs.asObject().childProcess ?
    console.log(...args) :
    console.error(...args);
}

module.exports = {
  log,
  log_trace,
  log_error
};
