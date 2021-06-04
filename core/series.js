'use strict';

const fs = require('fs');
const path = require('path');

const root_dir = path.resolve('.');
const root_folder = 'tests';

const settings = require('./settings.js');
const { servicer } = settings;

const testflow = require('./core.js');
const { assert, fail } = testflow;

const {
  format_completed,
  format_failure,
  format_failures,
  format_intermittents,
  format_success,
  format_todos,
  format_warnings,
  colorify,
} = require('./format.js');

process.on('unhandledRejection', error => {
  console.error(error);
  fail(`Unhandled Promise rejection`);
});

/**
 * Executes tests matching the given pattern.
 */
class Series {
  static run(patterns, options) {
    if (!('LogPipe' in options)) {
      options.LogPipe = require('../logging/logpipe.js').LogPipe;
    }
    return options.LogPipe.attach('').then(() => {
      const series = new this(patterns, options);
      return series
        .run()
        .then(() =>
          // shutdown returns list of failures or null if no failures
          options.LogPipe.release()
        )
        .then(
          () => series.shutdown(),
          e => {
            let failures = series.shutdown();
            fail(e.message);
            console.error(e);
            return failures;
          }
        );
    });
  }

  constructor(
    patterns,
    {
      debunk,
      skipOnFail,
      timeout,
      verify,
      core,
      LogPipe,
      webdrivers = settings.webdrivers,
    }
  ) {
    this.debunk = debunk;
    this.patterns = patterns;
    this.skipOnFail = skipOnFail;
    this.verify = verify;

    this.fcnt = 0;
    this.failures = [];

    this.icnt = 0;
    this.tcnt = 0;
    this.wcnt = 0;
    this.ocnt = 0;

    this.core = core || testflow.core;
    testflow.lock(this.core);

    this.core.setTimeout(timeout);
    this.core.clearStats();

    this.LogPipe = LogPipe;
    this.webdrivers = webdrivers;
  }

  /**
   * Runs tests matching the patterns. Re-runs failing tests in verify mode.
   */
  async run() {
    // Run tests matching the patterns.
    await this.runFor(this.patterns);

    // In debunk mode re-run tests until it fails.
    if (this.debunk) {
      for (let i = 0; i < settings.debunkLimit - 1; i++) {
        if (this.failures.length != 0) {
          break;
        }
        await this.runFor(this.patterns);
      }
    } else {
      // In very mode, re-run all failing tests.
      if (this.verify && this.failures.length > 0) {
        let patterns = this.failures.map(f => f.path);
        this.failures = [];
        await this.runFor(patterns, '2');
      }
    }

    await servicer.shutdown();
  }

  /**
   * Runs tests matching the patterns.
   */
  async runFor(patterns, name_postfix = '') {
    let tests = this.build({
      patterns,
      folder: root_folder,
      virtual_folder: settings.invocation,
    });

    // Adjust names.
    if (name_postfix) {
      this.adjustTestNames(tests, name_postfix);
    }

    if (tests.length == 0) {
      console.log(
        colorify(
          'failures',
          '!Failed:',
          `no tests matching '${patterns}' pattern(s) found`
        )
      );
      return Promise.resolve();
    }

    await this.perform({ folder: `${settings.invocation}/`, tests });
  }

  shutdown() {
    testflow.unlock();
    return this.failures.length > 0 ? this.failures : null;
  }

  /**
   * Returns tests as an array of { name, func, ... } objects.
   */
  build({ patterns, folder, virtual_folder, webdriver = '' }) {
    let tests = [];

    try {
      let test_module = {};
      try {
        test_module = this.loadTestMeta(folder);
      } catch (e) {
        // no meta.js
      }

      let subfolders = test_module.folders;
      let include_list = test_module.include_list;
      let exclude_list = test_module.exclude_list || [];

      let list = test_module.list || this.getTestFileList(folder);
      if (!subfolders && list.length == 0) {
        throw new Error(`No tests found in ${folder}`);
      }

      list = list
        .filter(fn => !include_list || include_list.includes(fn))
        .filter(fn => !exclude_list.includes(fn))
        .map(fn => ({
          fn,
          name: `${virtual_folder}/${fn}`,
          path: `${folder}/${fn}`,
        }));

      if (patterns.length > 0) {
        list = list.filter(test =>
          patterns.find(pattern => test.path.startsWith(pattern))
        );
      }

      // Go into subfolders
      let subtests = this.buildSubtests({
        patterns,
        folder,
        virtual_folder,
        subfolders,
        webdriver,
      });
      if (list.length == 0 && subtests.length == 0) {
        return tests;
      }

      if (webdriver || !test_module.webdriver) {
        this.buildFor({
          tests,
          test_module,
          webdriver,
          folder,
          virtual_folder,
          list,
          subtests,
        });
        return tests;
      }

      // A separate folder for the webdriver tests.
      assert(this.webdrivers instanceof Array, `Webdrivers are misconfigured`);
      tests.push(
        ...this.webdrivers.map(webdriver => ({
          name: `${virtual_folder}/${webdriver}`,
          subtests: this.buildFor({
            tests: [],
            test_module,
            webdriver,
            folder,
            virtual_folder: `${virtual_folder}/${webdriver}`,
            list: list.map(test => ({
              name: `${virtual_folder}/${webdriver}/${test.fn}`,
              path: test.path,
            })),
            subtests: this.buildSubtests({
              patterns,
              folder,
              virtual_folder: `${virtual_folder}/${webdriver}`,
              subfolders,
              webdriver,
            }),
          }),
        }))
      );
    } catch (e) {
      console.error(e);
      fail(`Failed to process '${folder}' tests`);
      this.failures.push({
        name: `${virtual_folder}/`,
        path: `${folder}/`,
        count: 1,
      });
      this.fcnt++;
    }

    return tests;
  }

  buildSubtests({ patterns, folder, virtual_folder, subfolders, webdriver }) {
    if (!subfolders) {
      return [];
    }
    return subfolders
      .map(subfolder => ({
        name: `${virtual_folder}/${subfolder}`,
        subtests: this.build({
          patterns,
          folder: `${folder}/${subfolder}`,
          virtual_folder: `${virtual_folder}/${subfolder}`,
          webdriver,
        }),
      }))
      .filter(t => t.subtests.length > 0);
  }

  buildFor({
    tests,
    test_module,
    webdriver,
    folder,
    virtual_folder,
    list,
    subtests,
  }) {
    const expected_failures = test_module.expected_failures || [];

    // Initialize
    if (test_module.services || test_module.init) {
      let init = async () => {
        // Start services if any.
        let chain = Promise.resolve();
        for (let service of test_module.services || []) {
          chain = chain.then(() => servicer.start(service));
        }
        await chain;

        // Do initialization if any.
        if (test_module.init) {
          await test_module.init();
        }
      };
      tests.push({
        name: `${virtual_folder}/init`,
        path: `${folder}/meta.js`,
        func: init,
        failures_info: [],
        skip_on_fail: 'skip-on-fail',
      });
    }

    // Tests
    for (let { name, path } of list) {
      let single_test_module = null;
      try {
        single_test_module = this.loadTest(path);
      } catch (e) {
        console.error(e);
        throw new Error(`Failed to load test file: ${path}`);
      }

      let test = single_test_module.test;
      if (!test) {
        throw new Error(`No test function to was found in ${path}`);
      }

      // If request service is running, then notify it of a test start.
      let test_wrap = () =>
        Promise.resolve(servicer.ontest(name)).then(() => test());

      let failures_info = Series.failuresInfo({
        failures: expected_failures,
        webdriver,
        platform: process.platform,
        testname: path,
      });

      tests.push({
        name,
        path,
        func: test_wrap,
        webdriver,
        failures_info,
      });
    }

    // Add tests from subfolders.
    if (subtests.length > 0) {
      tests.push(...subtests);
    }

    // Uninitialize.
    if (test_module.services || test_module.init) {
      let uninit = async () => {
        // Deinitalize test env.
        if (test_module.uninit) {
          await test_module.uninit();
        }
        // Stop services in reverse order.
        await Promise.all(
          (test_module.services || []).reverse().map(s => servicer.stop(s))
        );
      };
      tests.push({
        name: `${virtual_folder}/uninit`,
        path: `${folder}/meta.js`,
        func: uninit,
        failures_info: [],
        skip_on_fail: 'skip-on-fail',
      });
    }

    return tests;
  }

  /**
   * Appends a prefix to test names and their containing virtual folders.
   */
  adjustTestNames(tests, postfix) {
    for (let test of tests) {
      if (!test.subtests) {
        return true;
      }
      if (this.adjustTestNames(test.subtests, postfix)) {
        this.adjustTestNamesRec(test, test.name, `${test.name}${postfix}`);
      }
    }
    return false;
  }

  adjustTestNamesRec(test, oldname, newname) {
    test.name = test.name.replace(oldname, newname);
    if (test.subtests) {
      for (let subtest of test.subtests) {
        this.adjustTestNamesRec(subtest, oldname, newname);
      }
    }
  }

  /**
   * Runs the tests.
   */
  async perform({ folder, tests }) {
    // Snapshot indices. Everything that goes after belongs to this particular
    // test run including nested runs.
    const fidx = this.failures.length;
    const fcnt = this.core.failureCount;
    const icnt = this.core.intermittentCount;
    const tcnt = this.core.todoCount;
    const wcnt = this.core.warningCount;
    const ocnt = this.core.okCount;

    // Nested logging.
    await this.LogPipe.attach(folder);

    let stop = false;
    for (let test of tests) {
      const {
        name,
        path,
        func,
        subtests,
        webdriver,
        failures_info,
        skip_on_fail,
      } = test;

      if (stop && !name.endsWith('uninit')) {
        console.log(
          `\x1b[31m!Skipped:\x1b[0m ${name}, because of previous failures\n`
        );
        continue;
      }

      // Set a webdiver on stack if not empty.
      if (webdriver) {
        settings.webdriver = webdriver;
      }

      // Subtests.
      if (subtests) {
        await this.perform({ folder: name, tests: subtests });
        continue;
      }

      // Invoke a test.
      console.log(`\n!Running: ${name}, path: ${path}\n`);
      let start_time = new Date();
      try {
        this.core.setExpectedFailures(failures_info);
        await func(); // execute the test
      } catch (e) {
        let failmsg = e;
        if (e instanceof Error) {
          console.error(e);
          failmsg = e.message;
        }
        fail(failmsg);
      } finally {
        this.core.failIfExpectedFailurePass();

        let hasFailures = this.recordStats(name, path);

        // If failed, then stop running the current tests.
        if (hasFailures && (this.skipOnFail || skip_on_fail)) {
          stop = true; // print skipped tests
        }

        console.log(`>${name} completed in ${new Date() - start_time}ms\n`);
      }
    }

    console.log(format_completed(folder));

    this.report({
      folder,
      fidx,
      fcnt,
      icnt,
      tcnt,
      wcnt,
      ocnt,
    });

    // Stop nested logging.
    await this.LogPipe.release();
  }

  recordStats(name, path) {
    let hasFailures = false;

    // Record failures.
    let delta = this.core.failureCount - this.fcnt;
    if (delta > 0) {
      console.error(format_failure(`has ${delta} failure(s)`, `>${name}`));
      this.failures.push({
        name,
        path,
        count: delta,
      });
      this.fcnt = this.core.failureCount;
      hasFailures = true;
    }

    // Record intermittents.
    delta = this.core.intermittentCount - this.icnt;
    if (delta > 0) {
      console.log(`>${name} has ${delta} intermittent(s)`);
      this.icnt = this.core.intermittentCount;
    }

    // Record todos.
    delta = this.core.todoCount - this.tcnt;
    if (delta > 0) {
      console.log(`>${name} has ${delta} todo(s)`);
      this.tcnt = this.core.todoCount;
    }

    // Record warnings.
    delta = this.core.warningCount - this.wcnt;
    if (delta > 0) {
      console.log(`>${name} has ${delta} warnings(s)`);
      this.wcnt = this.core.warningCount;
    }

    // Record successful test count.
    this.ocnt = this.core.okCount;

    return hasFailures;
  }

  report({ folder, fidx, fcnt, icnt, tcnt, wcnt, ocnt }) {
    const is_root = folder == `${settings.invocation}/`;

    // Do not log interim test results into console to reduce noice. Keep
    // file logging.
    const log = is_root
      ? console.log.bind(console)
      : this.LogPipe.logToFile.bind(this.LogPipe);

    let delta = this.core.warningCount - wcnt;
    if (delta > 0) {
      log(format_warnings(delta, is_root ? '' : folder));
    }

    delta = this.core.intermittentCount - icnt;
    if (delta > 0) {
      log(format_intermittents(delta, is_root ? '' : folder));
    }

    delta = this.core.todoCount - tcnt;
    if (delta > 0) {
      log(format_todos(delta, is_root ? '' : folder));
    }

    if (this.failures.length > fidx) {
      for (let i = fidx; i < this.failures.length; i++) {
        let f = this.failures[i];
        log(format_failures(f.count, f.name));
      }
      log(
        format_failures(
          this.core.failureCount - fcnt,
          this.core.okCount - ocnt,
          !is_root && folder
        )
      );
    } else {
      log(format_success(this.core.okCount - ocnt, !is_root && folder));
    }
  }

  static failuresInfo({ failures, webdriver, platform, testname }) {
    let filtered_failures = failures.filter(
      v => testname.includes(v[0]) || v[0] == '*'
    );

    return (
      filtered_failures &&
      filtered_failures
        .flatMap(f => f[1])
        .filter(v => {
          let [, os, browser] = v[0].match(/^(.+?)(?:-(.+))?$/);
          return (
            (os == 'all' || platform.startsWith(os)) &&
            (!browser ||
              browser == 'all' ||
              browser == webdriver ||
              (browser.endsWith('*') &&
                webdriver.startsWith(browser.substring(0, browser.length - 2))))
          );
        })
        .map(v => ({
          type: v[1],
          group: v[2],
          list: v[3],
          msg: v[4],
        }))
    );
  }

  loadTestMeta(folder) {
    return require(path.join(root_dir, `${folder}/meta.js`));
  }

  loadTest(fn) {
    return require(path.join(root_dir, fn));
  }

  getTestFileList(folder) {
    return fs
      .readdirSync(path.join(root_dir, folder))
      .filter(n => n.startsWith('t_'));
  }
}

module.exports.Series = Series;
module.exports.runSeries = (...args) => Series.run(...args);
