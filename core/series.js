import fs from 'fs';
import nodepath from 'path';
import { fileURLToPath } from 'url';

import { assert, fail, testflow } from './core.js';
import { parse, parse_failure } from './format.js';
import { ProcessArgs } from './process_args.js';
import settings from './settings.js';
import { spawn } from './spawn.js';
import { stringify } from './util.js';
import { log, log_error } from '../logging/logging.js';
import { LogPipe } from '../logging/logpipe.js';
import { DriverBase } from '../webdriver/driver_base.js';

import {
  format_started,
  format_completed,
  format_failure,
  format_failures,
  format_intermittents,
  format_success,
  format_todos,
  format_warnings,
  colorify,
} from './format.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = nodepath.dirname(__filename);

const root_folder = 'tests';
const root_dir = nodepath.resolve('.');

const kKungFuDeathGripTimeout = {};
const kKungFuDeathGripCancelled = {};

process.on('unhandledRejection', error => {
  log_error(error);
  fail(`Unhandled Promise rejection`);
});

/**
 * Executes tests matching the given pattern.
 */
class Series {
  static run(patterns, options) {
    if (!('LogPipe' in options)) {
      options.LogPipe = LogPipe;
    }
    options.LogPipe.suppress_logging = options.childProcess;

    return settings
      .initialize()
      .then(() => options.LogPipe.attach(''))
      .then(() => {
        const series = new this(patterns, options);
        return series
          .run()
          .then(() =>
            // shutdown returns list of failures or null if no failures
            options.LogPipe.release(),
          )
          .then(
            () => series.shutdown(),
            e => {
              let failures = series.shutdown();
              fail(e.message);
              log_error(e);
              return failures;
            },
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
      suppressChildProcessInitiation,
      core,
      LogPipe,
      webdriver,
      webdrivers = settings.webdrivers,
    },
  ) {
    this.debunk = debunk;
    this.invocation = invocation || settings.invocation;
    this.patterns = patterns;
    this.skipOnFail = skipOnFail;
    this.verify = verify;
    this.childProcess = childProcess;
    this.rootFolder = rootFolder;
    this.suppressChildProcessInitiation = suppressChildProcessInitiation;

    this.fcnt = 0;
    this.failures = [];
    this.childProcessOutputBuffer = [];

    this.icnt = 0;
    this.tcnt = 0;
    this.wcnt = 0;
    this.ocnt = 0;

    this.core = core || testflow.core;
    testflow.lock({ core: this.core });

    this.core.setTimeout(timeout);
    this.core.clearStats();

    this.LogPipe = LogPipe;
    this.webdriver = webdriver || '';
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
        webdriver: this.webdriver,
      })),
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
    log(`Elapsed: ${Date.now() - start_time}ms`);
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
      log(
        colorify(
          'failures',
          '!Failed:',
          `no tests matching '${stringify(patterns)}' pattern(s) found`,
        ),
      );
      return Promise.resolve();
    }

    await this.perform({ folder: `${this.invocation}/`, tests });
  }

  shutdown() {
    console.log(`Testsuite: shutdown`);
    testflow.unlock();
    return this.failures.length > 0 ? this.failures : null;
  }

  /**
   * Returns tests as an array of { name, func, ... } objects.
   */
  async build({
    patterns,
    folder,
    virtual_folder,
    webdriver = '',
    inherited_expected_failures = [],
  }) {
    let tests = [];
    try {
      let test_module = await this.loadTestMeta(folder);
      let subfolders = test_module.folders;
      let testfiles = test_module.list || (await this.getTestFileList(folder));
      if (!subfolders && testfiles.length == 0) {
        throw new Error(`No tests found in ${folder}`);
      }

      if (test_module.expected_failures) {
        inherited_expected_failures = inherited_expected_failures.concat(
          test_module.expected_failures.filter(v => v[0] == '**'),
        );
      }

      if (
        !this.childProcess &&
        !this.suppressChildProcessInitiation &&
        test_module.loader
      ) {
        this.buildChildProcessTests({
          tests,
          folder,
          virtual_folder,
          patterns,
          loader: this.getTestMetaPath(folder),
          webdriver,
        });
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
            inherited_expected_failures,
          }),
          inherited_expected_failures,
        });
      }

      // A separate folder for the webdriver tests.
      assert(
        this.webdrivers instanceof Array,
        `Webdrivers are misconfigured, got: ${JSON.stringify(this.webdrivers)}`,
      );

      // Build the tests for webdrivers. Filter the list according traversed
      // webdriver.
      for (let webdriver of this.webdrivers) {
        let wd_virtual_folder = `${virtual_folder}/${webdriver}`;

        if (
          !this.childProcess &&
          !this.suppressChildProcessInitiation &&
          DriverBase.isStdOutLogging(webdriver)
        ) {
          this.buildChildProcessTests({
            tests,
            folder,
            virtual_folder: wd_virtual_folder,
            patterns,
            webdriver,
          });
          continue;
        }

        let wdtests = await this.buildTests({
          tests: [],
          folder,
          virtual_folder: wd_virtual_folder,
          testfiles,
          test_module,
          webdriver,
          patterns,
          subtests: await this.buildSubtests({
            patterns,
            folder,
            virtual_folder: wd_virtual_folder,
            subfolders,
            webdriver,
            inherited_expected_failures,
          }),
          inherited_expected_failures,
        });
        if (wdtests.length > 0) {
          tests.push({
            name: wd_virtual_folder,
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
          log_error(e);
          fail(`Failed to process tests in '${folder}' folder`);
        },
        failures_info: [],
        skip_on_fail: 'skip-on-fail',
      });
    }

    return tests;
  }

  buildChildProcessTests({
    folder,
    virtual_folder,
    tests,
    patterns,
    loader,
    webdriver,
  }) {
    let matched_patterns = [
      {
        path: `${folder}/`,
        webdriver,
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
          loader,
          webdriver: matched_pattern.webdriver || webdriver,
          run_in_child_process: true,
        });
      }
    }
  }

  async buildSubtests({
    patterns,
    folder,
    virtual_folder,
    subfolders,
    webdriver,
    inherited_expected_failures,
  }) {
    if (!subfolders) {
      return [];
    }

    // Filter subfolders to only process those that match the patterns
    let filteredSubfolders = subfolders;
    if (patterns.length > 0) {
      filteredSubfolders = subfolders.filter(subfolder => {
        const subfolderPath = `${folder}/${subfolder}`;
        return (
          this.matchedPatterns({
            path: subfolderPath,
            webdriver,
            patterns,
            path_is_not_final: true,
          }).length > 0
        );
      });
    }

    let subtests_for_subfolders = await Promise.all(
      filteredSubfolders.map(subfolder =>
        this.build({
          patterns,
          folder: `${folder}/${subfolder}`,
          virtual_folder: `${virtual_folder}/${subfolder}`,
          webdriver,
          inherited_expected_failures,
        }).then(subtests => ({
          subfolder,
          subtests,
        })),
      ),
    );

    return subtests_for_subfolders
      .flatMap(({ subfolder, subtests }) => {
        // Case: no substests for a loader test running in a child process.
        if (subtests.every(t => t.loader)) {
          return subtests;
        }
        return {
          name: `${virtual_folder}/${subfolder}`,
          path: `${folder}/${subfolder}/`,
          subtests,
        };
      })
      .filter(t => t.run_in_child_process || t.subtests.length > 0);
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
    inherited_expected_failures,
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

    const expected_failures = inherited_expected_failures.concat(
      test_module.expected_failures || [],
    );

    // Set services if given.
    if (test_module.servicer) {
      if (this.#servicerType) {
        throw new Error(`No nested servicers are supported`);
      }
      this.#servicerType = test_module.servicer;
    }

    // Initialize.
    if (test_module.services || test_module.init) {
      let init = async () => {
        // Start services if any.
        let chain = Promise.resolve();
        for (let service of test_module.services || []) {
          chain = chain.then(() => this.getServicer().start(service));
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
        init_or_uninit: true,
      });
    }

    // Tests
    for (let { name, path } of list) {
      const test = await this.loadTest(path);

      // A function to notify the servicer the test is about to start and then
      // to invoke the test.
      const test_wrap = () =>
        Promise.resolve(this.#servicer?.ontest(name)).then(test);

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
            .map(s => this.getServicer().stop(s)),
        );

        // Clean up service-level servicer
        await this.#servicer?.shutdown();
        this.#servicer = null;
        this.#servicerType = null;
      };
      tests.push({
        name: `${virtual_folder}/uninit`,
        path: `${folder}/meta.js`,
        func: uninit,
        failures_info: [],
        skip_on_fail: 'skip-on-fail',
        init_or_uninit: true,
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
            .length != 0,
      );
    }

    return list;
  }

  matchedPatterns({ path, webdriver, patterns, path_is_not_final }) {
    return patterns.filter(
      pattern =>
        (!webdriver || !pattern.webdriver || pattern.webdriver == webdriver) &&
        (path.startsWith(pattern.path) ||
          (path_is_not_final && pattern.path.startsWith(path))),
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
      log(format_started(folder));
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
        run_in_child_process,
        init_or_uninit,
      } = test;

      if (stop && !name.endsWith('uninit')) {
        log(`\x1b[31m!Skipped:\x1b[0m ${name}, because of previous failures\n`);
        continue;
      }

      if (run_in_child_process) {
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
      log(`\n!Running: ${name}, path: ${path}\n`);
      let start_time = new Date();
      let kungFuDeathGrip = null;
      let kungFuDeathGripResolve = null;
      let kungFuDeathGripTimer = 0;

      // Take snapshots before the test runs
      const testSnapshots = {
        fcnt: this.core.failureCount,
        icnt: this.core.intermittentCount,
        tcnt: this.core.todoCount,
        wcnt: this.core.warningCount,
        ocnt: this.core.okCount,
      };

      try {
        this.core.setExpectedFailures(failures_info);

        // If timeout is given then race it against the test.
        if (settings.timeout) {
          kungFuDeathGrip = new Promise(
            resolve => (kungFuDeathGripResolve = resolve),
          ).then(value => {
            if (value != kKungFuDeathGripCancelled) {
              fail(
                `Test ${name} takes longer than ${settings.timeout}ms. It's either slow or never ends.`,
              );
              return kKungFuDeathGripTimeout;
            }
          });
          kungFuDeathGripTimer = setTimeout(
            kungFuDeathGripResolve,
            settings.timeout,
          );
          let retval = await Promise.race([func(), kungFuDeathGrip]);
          if (retval != kKungFuDeathGripTimeout) {
            clearTimeout(kungFuDeathGripTimer);
            kungFuDeathGripResolve(kKungFuDeathGripCancelled);
          }
        } else {
          await func(); // execute the test
        }
      } catch (e) {
        if (kungFuDeathGripTimer) {
          clearTimeout(kungFuDeathGripTimer);
          kungFuDeathGripResolve(kKungFuDeathGripCancelled);
        }
        let failmsg = e;
        if (e instanceof Error) {
          log_error(e);
          failmsg = e.message;
        }
        fail(failmsg);
      } finally {
        this.core.failIfExpectedFailurePass();

        let hasFailures = this.recordStats({
          name,
          init_or_uninit,
          path,
          webdriver,
          snapshots: testSnapshots,
        });

        // If failed, then stop running the current tests.
        if (hasFailures && (this.skipOnFail || skip_on_fail)) {
          stop = true; // print skipped tests
        }

        log(`>${name} completed in ${new Date() - start_time}ms\n`);
      }
    }

    if (should_report) {
      this.report({
        folder,
        fidx,
        fcnt,
        icnt,
        tcnt,
        wcnt,
        ocnt,
      });
      log(format_completed(folder));
    }

    // Stop nested logging.
    await this.LogPipe.release();
  }

  recordStats({ name, init_or_uninit, path, webdriver, snapshots }) {
    let hasChanged = false;
    let hasFailures = false;

    // Record intermittents.
    let delta = this.core.intermittentCount - snapshots.icnt;
    if (delta > 0) {
      log(`>${name} has ${delta} intermittent(s)`);
      this.icnt = this.core.intermittentCount;
      hasChanged = true;
    }

    // Record todos.
    delta = this.core.todoCount - snapshots.tcnt;
    if (delta > 0) {
      log(`>${name} has ${delta} todo(s)`);
      this.tcnt = this.core.todoCount;
      hasChanged = true;
    }

    // Record warnings.
    delta = this.core.warningCount - snapshots.wcnt;
    if (delta > 0) {
      log(`>${name} has ${delta} warnings(s)`);
      this.wcnt = this.core.warningCount;
      hasChanged = true;
    }

    // Record successful test count.
    delta = this.core.okCount - snapshots.ocnt;
    if (delta > 0) {
      this.ocnt = this.core.okCount;
      hasChanged = true;
    }

    // Fail if no changes.
    delta = this.core.failureCount - snapshots.fcnt;
    if (!init_or_uninit) {
      if (delta == 0 && !hasChanged) {
        delta = 1;
        fail(`Neighter failure nor success in ${name}`);
      }
    }

    // Record failures.
    if (delta > 0) {
      log_error(format_failure(`has ${delta} failure(s)`, `>${name}`));
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
    // file logging. In case of a child process log into console, the main
    // process will take care of that.
    const log_func =
      is_root || this.childProcess
        ? log
        : this.LogPipe.logToFile.bind(this.LogPipe);

    let hasChanged = this.failures.length > fidx || this.core.okCount > ocnt;

    let delta = this.core.warningCount - wcnt;
    if (delta > 0) {
      log_func(format_warnings(delta, is_root ? '' : folder));
      hasChanged = true;
    }

    delta = this.core.intermittentCount - icnt;
    if (delta > 0) {
      log_func(format_intermittents(delta, is_root ? '' : folder));
      hasChanged = true;
    }

    delta = this.core.todoCount - tcnt;
    if (delta > 0) {
      log_func(format_todos(delta, is_root ? '' : folder));
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
        log_func(format_failures(f.count, f.name));
      }
      log_func(
        format_failures(
          this.core.failureCount - fcnt,
          this.core.okCount - ocnt,
          !is_root && folder,
        ),
      );
    } else {
      log_func(format_success(this.core.okCount - ocnt, !is_root && folder));
    }
  }

  static failuresInfo({ failures, webdriver, platform, testname }) {
    let filtered_failures = failures.filter(
      v => testname.includes(v[0]) || v[0] == '*' || v[0] == '**',
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
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      return {}; // no meta.js
    }
  }

  loadTest(test_path) {
    return import(nodepath.join(root_dir, test_path)).then(
      test_module => {
        if (!test_module.test) {
          throw new Error(`No test was found in ${test_path}`);
        }
        return test_module.test;
      },
      e => {
        log_error(e);
        throw new Error(`Failed to load test: ${test_path}`);
      },
    );
  }

  getTestMetaPath(folder) {
    let meta_path = nodepath.join(root_dir, `${folder}/meta.js`);
    return (
      (fs.existsSync(meta_path) && meta_path) ||
      nodepath.join(root_dir, `${folder}/meta.mjs`)
    );
  }

  getTestFileList(folder) {
    return fs
      .readdirSync(nodepath.join(root_dir, folder))
      .filter(
        n =>
          n.startsWith('t_') &&
          (!settings.ignorePattern || !settings.ignorePattern.test(n)),
      );
  }

  performInChildProcess({ name, path, loader, webdriver }) {
    let args = [];
    if (loader) {
      // Use the new --import flag with register() API instead of deprecated --loader
      args.push(
        '--import',
        `data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("${loader}", pathToFileURL("./"));`,
      );
    }
    const watest_bin = nodepath.join(__dirname, '../bin/watest.js');
    args.push(
      watest_bin,
      '--input-type=module',
      '--child-process',
      '--root-folder',
      nodepath.join(name, '../'),
      ...ProcessArgs.controlArguments,
      path,
    );
    if (webdriver) {
      args.push('--webdriver', webdriver);
    }

    return spawn('node', args, {}, buffer =>
      this.processChildProcessOutput(name, buffer),
    ).catch(e => {
      log_error(e);
      fail(`Failed to process child process output`);
    });
  }

  async processChildProcessOutput(virtual_folder, buffer) {
    for (let { str_data, is_stdout } of buffer) {
      let lines = str_data.split('\n');

      for (let line of lines) {
        if (line == '') {
          continue;
        }

        let log_func = msg => (is_stdout ? log(msg) : log_error(msg));

        if (line.startsWith('console.debug')) {
          line = line.replace(
            /console\.debug: "(.+)"/,
            (match, p) => `[DEBUG] ${p}`,
          );
        } else if (line.startsWith('console.log')) {
          line = line.replace(
            /console\.log: "(.+)"/,
            (match, p) => `[INFO] ${p}`,
          );
        } else if (line.startsWith('console.assert')) {
          line = line.replace(
            /console\.assert: "(.+)"/,
            (match, p) => `[SEVERE] ${p}`,
          );
        } else if (line.startsWith('console.error')) {
          line = line.replace(
            /console\.error: "(.+)"/,
            (match, p) => `[SEVERE] ${p}`,
          );
        } else if (line.startsWith('data:text/html,')) {
          line = line.replace(/\S*/, '@dataurl_placeholder');
        } else {
          const { color, msg } = parse(line);
          switch (color) {
            case 'started':
              await this.LogPipe.attach(msg);
              log_func(line);
              continue;

            case 'completed':
              log_func(line);
              await this.LogPipe.release();
              continue;

            case 'failure':
              {
                let { name, count } = parse_failure(line) || {};
                if (name) {
                  this.failures.push({
                    name,
                    count,
                  });
                } else {
                  this.core.failureCount++;
                }
              }
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

            case 'intermittents':
            case 'todos':
            case 'warnings':
            case 'failures':
            case 'success':
              log_func = this.LogPipe.logToFile.bind(this.LogPipe);
              break;
          }
        }

        log_func(line);
      }
    }
  }

  getServicer() {
    if (!this.#servicer) {
      this.#servicer = this.createServicer(this.#servicerType);
    }
    return this.#servicer;
  }

  createServicer(servicerType) {
    return settings.getServicer(servicerType);
  }

  #servicer;
  #servicerType;
}

export { Series };

export function runSeries(...args) {
  return Series.run(...args);
}
