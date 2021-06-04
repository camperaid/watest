'use strict';

const { assert, group, info } = require('../core/core.js');
const { Driver } = require('./driver.js');

let active_sessions = [];

/**
 * A session to run the tests in.
 */
class Session {
  /**
   * Starts new session.
   */
  static async start(url_or_snippet) {
    let driver = await Driver.build();
    if (url_or_snippet) {
      await driver.load(url_or_snippet);
    }

    let session = new Session(driver);
    active_sessions.push(session);
    return session;
  }

  constructor(d) {
    assert(d, `Session: no driver`);
    this.session_id = Math.floor(Math.random() * Math.pow(10, 8));
    this.driver = d;
    info(`Session ${this.session_id} open`);
  }

  /**
   * Denotes a test task in console, a number of logically grouped test actions.
   */
  task(msg) {
    console.log(`\x1b[34mTask:\x1b[0m ${msg}`);
  }

  subtask(msg) {
    console.log(`\x1b[34mSubtask:\x1b[0m ${msg}`);
  }

  /**
   * Loads a new URL or code snippet into a browser window.
   */
  load(url_or_snippet) {
    return this.driver.load(url_or_snippet);
  }

  /**
   * Makes a screenshot.
   */
  screenshot() {
    return this.driver.screenshot();
  }

  /**
   * Closes the session (all associated windows).
   */
  close() {
    info(`Close session ${this.session_id}`);

    let idx = active_sessions.indexOf(this);
    assert(idx >= 0, `Session ${this.session_id} was already terminated`);

    return this.driver.close().then(() => active_sessions.splice(idx, 1));
  }

  /**
   * Terminates the session. Makes all other session useless. Thus you have to
   * close all other open sessions before quitting the last one.
   */
  quit() {
    info(`Quit session ${this.session_id}`);

    let idx = active_sessions.indexOf(this);
    assert(idx >= 0, `Session ${this.session_id} was already terminated`);

    return this.driver.quit().then(() => active_sessions.splice(idx, 1));
  }

  loadDrivers(...drivers) {
    let that = this;
    for (let driver of [...drivers]) {
      this[driver.name] = class extends driver {
        static get(...args) {
          return super.get(that, ...args);
        }
      };
    }
  }
}

/**
 * Starts new session to run the tests in. Loads libraries into session.
 */
async function start_session(arg1, arg2) {
  let url_or_snippet = (typeof arg1 == 'string' && arg1) || null;
  let libs = arg2 || (!url_or_snippet && arg1);

  let s = await Session.start(url_or_snippet);

  // Define methods that have a depenendency on |this|.

  /**
   * Returns true if tests are running in mobile compatibility mode.
   */
  s.isMobile = () => s.driver.isMobile;

  s.isFirefox = () => s.driver.firefox;

  s.isChrome = () => s.driver.chrome;

  s.isSafari = () => s.driver.safari;

  /**
   * Pause the session for number of secs.
   */
  s.sleep = (sec, msg) => s.action(`Wait for ${sec} sec(s). ${msg}`).sleep(sec);

  /**
   * Denotes a test action in console, a logical unit.
   */
  s.action = msg => s.driver.invoke(() => group(msg, 'Action'), msg);

  /**
   * Invokes a command.
   */
  s.invoke = action => s.driver.invoke(action);

  // Load libraries into the sesssion.
  if (libs) {
    for (let lib of libs) {
      require(lib).loadIntoSession(s);
    }
  }

  return s;
}

/**
 * Opens a new browser window and runs the given tests within it.
 * @param arg1 - url_or_snippet or tests
 * @param arg2 - tests if |arg1| is url_or_snippet or options or libs
 @ @param arg3 - libs if |arg2| is not libs
 */
const scope = (arg1, arg2, arg3) => async () => {
  let url_or_snippet = (typeof arg1 == 'string' && arg1) || null;
  let tests = (typeof arg1 == 'function' && arg1) || arg2;
  let options = (typeof arg1 == 'function' && arg2) || null;
  let libs = arg3 || (arg2 instanceof Array && arg2);
  assert(tests, 'No tests to run provided');

  // Do the test.
  try {
    // Start session if requested.
    let session = null;
    if (!options || options.auto_session !== false) {
      session = await start_session(url_or_snippet, libs);
    }
    await tests(session);
  } finally {
    console.log(`Quit ${active_sessions.length} wd session(s)`);

    while (active_sessions.length > 1) {
      await active_sessions[1].close();
    }
    if (active_sessions.length == 1) {
      await active_sessions[0].quit();
    }
  }
};

module.exports = {
  start_session,
  scope,
};
