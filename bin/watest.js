#!/usr/bin/env node

'use strict';

const { ProcessArgs } = require('../core/process_args.js');

const args = ProcessArgs.asObject();
if (args.showHelp) {
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
runSeries(args.patterns, args).then(failures => failures && process.exit(1));
