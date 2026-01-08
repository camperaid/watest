#!/usr/bin/env node

import { ProcessArgs } from '../core/process-args.js';
import { runSeries } from '../core/series.js';
import { generateGridTasks, collectDeps, parseGridArgs } from '../core/deps.js';
import { settings } from '../core/settings.js';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

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
  --deps\t outputs metadata (servicers, services) for given paths
  --grid\t outputs grid metadata as JSON for distributed testing
  -h|--help\t shows this help
`);
  process.exit();
}

// Handle --deps flag (simple metadata from paths, for container rebuild decisions)
if (args.deps) {
  await settings.initialize({ silent: true });
  const { paths } = parseGridArgs(args.patterns);
  const targetPaths = paths.length === 0 ? [settings.testsFolder] : paths;
  const result = await collectDeps(targetPaths);
  console.log(JSON.stringify(result));
  process.exit(0);
}

// Handle --grid flag
if (args.grid) {
  await settings.initialize({ silent: true });
  const metaPath = join(process.cwd(), settings.testsFolder, 'meta.js');
  const metaUrl = pathToFileURL(metaPath).href;

  try {
    const meta = await import(metaUrl);
    const grid = meta.grid || {};
    const tasks = await generateGridTasks(grid, args.patterns);
    console.log(JSON.stringify(tasks, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error generating grid metadata:', err.message);
    process.exit(1);
  }
}

runSeries(args.patterns, args).then(failures => failures && process.exit(1));
