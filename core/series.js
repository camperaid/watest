'use strict';

const fs = require('fs');
const path = require('path');
const nodepath = path;
const { spawn } = require('child_process');

const root_dir = path.resolve('.');
const root_folder = 'tests';

const settings = require('./settings.js');
const { stringify } = require('./util.js');
const { parse } = require('./format.js');

const testflow = require('./core.js');
const { assert, fail } = testflow;

const { ProcessArgs } = require('./process_args.js');

const {
  format_started,
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
    return settings
      .initialize()
      .then(() => options.LogPipe.attach(''))
      .then(() => {
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
      invocation,
      skipOnFail,
      timeout,
      verify,
      childProcess,
      rootFolder,
      core,
      LogPipe,
      webdrivers = settings.webdrivers,
    }
  ) {
    this.debunk = debunk;
    this.invocation = invocation || settings.invocation;
    this.patterns = patterns;
    this.skipOnFail = skipOnFail;
    this.verify = verify;
    this.childProcess = childProcess;
    this.rootFolder = rootFolder;

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
    const start_time = Date.now();

    // Run tests matching the patterns.
    await this.runFor(
      this.patterns.map(pattern => ({
        path: pattern,
        webdriver: '',
      }))
    );

    // In debunk mode re-run tests until it fails.
    if (this.debunk) {
      for (let i = 0; i < settings.debunkLimit - 1; i++) {
        if (this.failures.length != 0) {
          break;
        }
        await this.runFor(this.patterns.map(p => ({ path: p, webdriver: '' })));
      }
    } else {
      // In very mode, re-run all failing tests.
      if (this.verify && this.failures.length > 0) {
        await this.runFor(this.failures, '2');
      }
    }

    await settings.servicer.shutdown();

    console.log(`Elapsed: ${Date.now() - start_time}ms`);
  }

  /**
   * Runs tests matching the patterns.
   */
  async runFor(patterns, name_postfix = '') {
    let tests = await this.build({
      patterns,
      folder: root_folder,
      virtual_folder: this.invocation,
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
          `no tests matching '${stringify(patterns)}' pattern(s) found`
        )
      );
      return Promise.resolve();
    }

    await this.perform({ folder: `${this.invocation}/`, tests });
  }

  shutdown() {
    testflow.unlock();
    return this.failures.length > 0 ? this.failures : null;
  }

  /**
   * Returns tests as an array of { name, func, ... } objects.
   */
  async build({ patterns, folder, virtual_folder, webdriver = '' }) {
    let tests = [];
    try {
      let test_module = await this.loadTestMeta(folder);
      let subfolders = test_module.folders;
      let testfiles = test_module.list || (await this.getTestFileList(folder));
      if (!subfolders && testfiles.length == 0) {
        throw new Error(`No tests found in ${folder}`);
      }

      if (!this.childProcess && test_module.loader) {
        let matched_patterns = [
          {
            path: folder,
          },
        ];
        if (patterns.length > 0) {
          matched_patterns = this.matchedPatterns({
            path: folder,
            webdriver,
            patterns,
            path_is_not_final: true,
          });
        }
        if (matched_patterns.length > 0) {
          for (let matched_pattern of matched_patterns) {
            let test_path = folder;
            if (matched_pattern.path.startsWith(folder)) {
              test_path = matched_pattern.path;
            }
            tests.push({
              name: virtual_folder,
              path: test_path,
              loader: this.getTestMetaPath(folder),
              loader_parent_virtual_folder: path.join(virtual_folder, '..'),
            });
          }
        }
        return tests;
      }

      // Go into subfolders.
      if (webdriver || !test_module.webdriver) {
        return this.buildTests({
          tests,
          folder,
          virtual_folder,
          test_module,
          testfiles,
          webdriver,
          patterns,
          subtests: await this.buildSubtests({
            patterns,
            folder,
            virtual_folder,
            subfolders,
            webdriver,
          }),
        });
      }

      // A separate folder for the webdriver tests.
      assert(this.webdrivers instanceof Array, `Webdrivers are misconfigured`);

      // Build the tests for webdrivers. Filter the list according traversed
      // webdriver.
      for (let webdriver of this.webdrivers) {
        let wdtests = await this.buildTests({
          tests: [],
          folder,
          virtual_folder: `${virtual_folder}/${webdriver}`,
          testfiles,
          test_module,
          webdriver,
          patterns,
          subtests: await this.buildSubtests({
            patterns,
            folder,
            virtual_folder: `${virtual_folder}/${webdriver}`,
            subfolders,
            webdriver,
          }),
        });
        if (wdtests.length > 0) {
          tests.push({
            name: `${virtual_folder}/${webdriver}`,
            path: `${folder}/`,
            subtests: wdtests,
          });
        }
      }
    } catch (e) {
      tests.push({
        name: virtual_folder,
        path: folder,
        func: () => {
          console.error(e);
          fail(`Failed to process tests in '${folder}' folder`);
        },
        failures_info: [],
        skip_on_fail: 'skip-on-fail',
      });
    }

    return tests;
  }

  async buildSubtests({
    patterns,
    folder,
    virtual_folder,
    subfolders,
    webdriver,
  }) {
    if (!subfolders) {
      return [];
    }

    let subtests_for_subfolders = await Promise.all(
      subfolders.map(subfolder =>
        this.build({
          patterns,
          folder: `${folder}/${subfolder}`,
          virtual_folder: `${virtual_folder}/${subfolder}`,
          webdriver,
        }).then(subtests => ({
          subfolder,
          subtests,
        }))
      )
    );

    return subtests_for_subfolders
      .map(({ subfolder, subtests }) => ({
        name: `${virtual_folder}/${subfolder}`,
        path: `${folder}/${subfolder}/`,
        subtests,
      }))
      .filter(t => t.subtests.length > 0);
  }

  async buildTests({
    tests,
    folder,
    virtual_folder,
    test_module,
    testfiles,
    patterns,
    webdriver,
    subtests,
  }) {
    const { include_list, exclude_list } = test_module;
    let list = this.buildList({
      folder,
      virtual_folder,
      testfiles,
      webdriver,
      patterns,
      include_list,
      exclude_list,
    });

    // Empty folder: no test matching a pattern.
    if (list.length == 0 && subtests.length == 0) {
      return tests;
    }

    const expected_failures = test_module.expected_failures || [];

    // Initialize
    if (test_module.services || test_module.init) {
      let init = async () => {
        // Start services if any.
        let chain = Promise.resolve();
        for (let service of test_module.services || []) {
          chain = chain.then(() => settings.servicer.start(service));
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
      const test = await this.loadTest(path);

      // A function to notify the servicer the test is about to start and then
      // to invoke the test.
      const test_wrap = () =>
        Promise.resolve(settings.servicer.ontest(name)).then(test);

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
          [...(test_module.services || [])]
            .reverse()
            .map(s => settings.servicer.stop(s))
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

  buildList({
    folder,
    virtual_folder,
    testfiles,
    webdriver,
    patterns,
    include_list,
    exclude_list = [],
  }) {
    let list = testfiles
      .filter(fn => !include_list || include_list.includes(fn))
      .filter(fn => !exclude_list.includes(fn))
      .map(fn => ({
        fn,
        name: `${virtual_folder}/${fn}`,
        path: `${folder}/${fn}`,
      }));

    // Filter tests by a given test paths and by a webdriver if given.
    if (patterns.length > 0) {
      list = list.filter(
        test =>
          this.matchedPatterns({ path: test.path, webdriver, patterns })
            .length != 0
      );
    }

    return list;
  }

  matchedPatterns({ path, webdriver, patterns, path_is_not_final }) {
    return patterns.filter(
      pattern =>
        (!webdriver || !pattern.webdriver || pattern.webdriver == webdriver) &&
        (path.startsWith(pattern.path) ||
          (path_is_not_final && pattern.path.startsWith(path)))
    );
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
    // Do not report in a child process for anything outside the root folder,
    // the parent prcess is responsible fot that.
    let should_report =
      !this.childProcess ||
      !this.rootFolder ||
      !this.rootFolder.startsWith(folder);

    if (should_report) {
      console.log(format_started(folder));
    }

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
        loader,
      } = test;

      if (stop && !name.endsWith('uninit')) {
        console.log(
          `\x1b[31m!Skipped:\x1b[0m ${name}, because of previous failures\n`
        );
        continue;
      }

      if (loader) {
        await this.performInChildProcess(test);
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

        let hasFailures = this.recordStats({ name, path, webdriver });

        // If failed, then stop running the current tests.
        if (hasFailures && (this.skipOnFail || skip_on_fail)) {
          stop = true; // print skipped tests
        }

        console.log(`>${name} completed in ${new Date() - start_time}ms\n`);
      }
    }

    if (should_report) {
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
    }

    // Stop nested logging.
    await this.LogPipe.release();
  }

  recordStats({ name, path, webdriver }) {
    let hasChanged = false;
    let hasFailures = false;

    // Record intermittents.
    let delta = this.core.intermittentCount - this.icnt;
    if (delta > 0) {
      console.log(`>${name} has ${delta} intermittent(s)`);
      this.icnt = this.core.intermittentCount;
      hasChanged = true;
    }

    // Record todos.
    delta = this.core.todoCount - this.tcnt;
    if (delta > 0) {
      console.log(`>${name} has ${delta} todo(s)`);
      this.tcnt = this.core.todoCount;
      hasChanged = true;
    }

    // Record warnings.
    delta = this.core.warningCount - this.wcnt;
    if (delta > 0) {
      console.log(`>${name} has ${delta} warnings(s)`);
      this.wcnt = this.core.warningCount;
      hasChanged = true;
    }

    // Record successful test count.
    delta = this.core.okCount - this.ocnt;
    if (delta > 0) {
      this.ocnt = this.core.okCount;
      hasChanged = true;
    }

    // Fail if no changes.
    delta = this.core.failureCount - this.fcnt;
    if (delta == 0 && !hasChanged) {
      delta = 1;
      fail(`Neighter failure nor success in ${name}`);
    }

    // Record failures.
    if (delta > 0) {
      console.error(format_failure(`has ${delta} failure(s)`, `>${name}`));
      this.failures.push({
        name,
        path,
        webdriver,
        count: delta,
      });
      this.fcnt = this.core.failureCount;
      hasFailures = true;
    }

    return hasFailures;
  }

  report({ folder, fidx, fcnt, icnt, tcnt, wcnt, ocnt }) {
    const is_root = folder == `${this.invocation}/`;

    // Do not log interim test results into console to reduce noice. Keep
    // file logging.
    const log = is_root
      ? console.log.bind(console)
      : this.LogPipe.logToFile.bind(this.LogPipe);

    let hasChanged = this.failures.length > fidx || this.core.okCount > ocnt;

    let delta = this.core.warningCount - wcnt;
    if (delta > 0) {
      log(format_warnings(delta, is_root ? '' : folder));
      hasChanged = true;
    }

    delta = this.core.intermittentCount - icnt;
    if (delta > 0) {
      log(format_intermittents(delta, is_root ? '' : folder));
      hasChanged = true;
    }

    delta = this.core.todoCount - tcnt;
    if (delta > 0) {
      log(format_todos(delta, is_root ? '' : folder));
      hasChanged = true;
    }

    // Report a failure if no change in a folder.
    if (!hasChanged) {
      fail(`Neighter failure nor success in ${folder}`);
      this.failures.push({
        name: folder,
        path: folder,
        count: 1,
      });
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

  async loadTestMeta(folder) {
    try {
      return await import(this.getTestMetaPath(folder));
    } catch (e) {
      return {}; // no meta.js
    }
  }

  loadTest(test_path) {
    return import(path.join(root_dir, test_path)).then(
      test_module => {
        if (!test_module.test) {
          throw new Error(`No test was found in ${test_path}`);
        }
        return test_module.test;
      },
      e => {
        console.error(e);
        throw new Error(`Failed to load test: ${test_path}`);
      }
    );
  }

  getTestMetaPath(folder) {
    let meta_path = path.join(root_dir, `${folder}/meta.js`);
    return (
      (fs.existsSync(meta_path) && meta_path) ||
      path.join(root_dir, `${folder}/meta.mjs`)
    );
  }

  getTestFileList(folder) {
    return fs
      .readdirSync(path.join(root_dir, folder))
      .filter(n => n.startsWith('t_'));
  }

  performInChildProcess({ name, path, loader, loader_parent_virtual_folder }) {
    return new Promise((resolve, reject) => {
      let args = [];
      if (loader) {
        args.push('--experimental-loader', loader);
      }
      const watest_bin = nodepath.join(__dirname, '../bin/watest.js');
      args.push(
        watest_bin,
        '--input-type=module',
        '--child-process',
        '--root-folder',
        loader_parent_virtual_folder,
        ...ProcessArgs.controlArguments,
        path
      );

      let stop_logging = false;
      const cp = spawn(`node`, args);
      cp.on('close', code => {
        if (code != 0) {
          reject(new Error(`${path} failed, process exited with code ${code}`));
          return;
        }
        resolve();
      });
      cp.stdout.on('data', data => {
        if (!stop_logging) {
          stop_logging = this.processChildProcessOutput(name, data, (...args) =>
            console.log(...args)
          );
        }
      });
      cp.stderr.on('data', data =>
        this.processChildProcessOutput(name, data, (...args) =>
          console.error(...args)
        )
      );
      cp.on('error', reject);
    });
  }

  processChildProcessOutput(virtual_folder, data, func) {
    let str = data.toString().slice(0, -1);
    let lines = str.split('\n');

    // Suppress writing into a file, because this is a responsibility of a child
    // process.
    this.LogPipe.suppress_fstream = true;
    func(str);
    this.LogPipe.suppress_fstream = false;

    for (let line of lines) {
      const { color, msg } = parse(line);
      switch (color) {
        case 'completed':
          // Eat all logs after completed message for the running test, the main
          // process will take care to represent those.
          if (msg == virtual_folder) {
            return true;
          }
          break;
        case 'failure':
          this.core.failureCount++;
          break;
        case 'intermittent':
          this.core.intermittentCount++;
          break;
        case 'ok':
          this.core.okCount++;
          break;
        case 'todo':
          this.core.todoCount++;
          break;
        case 'warning':
          this.core.warningCount++;
          break;
      }
    }
    return false;
  }
}

module.exports.Series = Series;
module.exports.runSeries = (...args) => Series.run(...args);
