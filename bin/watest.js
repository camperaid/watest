#!/usr/bin/env node

'use strict';

let debunk = false;
let patterns = [];
let skipOnFail = false;
let showHelp = false;
let timeout = 0;
let verify = false;

for (let i = 2; i < process.argv.length; i++) {
  let arg = process.argv[i];
  switch (arg) {
    case '--debunk':
      debunk = true;
      break;

    case '--skip-on-fail':
      skipOnFail = true;
      break;

    case '--timeout':
      timeout = process.argv[++i];
      break;

    case '-v':
    case '--verify':
      verify = true;
      break;

    case '-h':
    case '--help':
      showHelp = true;
      break;

    default:
      patterns.push(arg);
  }
}

if (showHelp) {
  console.log(`Runs tests.`);
  console.log('Usage: watest [options] patterns');
  console.log(`
Options:
  --skip-on-fail skips all tests next to a failing test in the same folder
  --timeout\t sets a timeout for webdriver tests, any webdriver condition is aborted after timeout making the test fail
  --debunk\t re-runs succeeding test until it fails or debunk limit is reached
  -v|--verify\t re-runs all failing tests
  -h|--help\t shows this help
`);
  process.exit();
}

// Initalize config.
require('../core/settings.js');

// Run tests.
const { runSeries } = require('../core/series.js');
runSeries(patterns, {
  debunk,
  skipOnFail,
  timeout,
  verify,
}).then(failures => failures && process.exit(1));
