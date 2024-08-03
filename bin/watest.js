#!/usr/bin/env node

import { ProcessArgs } from '../core/process_args.js';
import '../core/settings.js';
import { runSeries } from '../core/series.js';

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

runSeries(args.patterns, args).then(failures => failures && process.exit(1));
