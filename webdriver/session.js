import { assert, group, fail, info } from '../core/core.js';
import { log, log_error } from '../logging/logging.js';
import { Driver } from './driver.js';

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

  constructor(driver) {
    assert(driver, `Session: no driver`);
    this.session_id = Math.floor(Math.random() * Math.pow(10, 8));
    this.driver = driver;
    info(`Session ${this.session_id} open`);
  }

  /**
   * Denotes a test task in console, a number of logically grouped test actions.
   */
  task(msg) {
    log(`\x1b[34mTask:\x1b[0m ${msg}`);
  }

  subtask(msg) {
    log(`\x1b[34mSubtask:\x1b[0m ${msg}`);
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
  s.action = msg =>
    s.driver
      .invoke(() => group(msg, 'Action'), msg)
      .logIntoConsole(`[WatestAction] ${msg}`);

  /**
   * Invokes a command.
   */
  s.invoke = action => s.driver.invoke(action);

  // Load libraries into the sesssion.
  if (libs) {
    await Promise.all(
      libs.map(lib =>
        import(lib).then(lib_module => lib_module.loadIntoSession(s)),
      ),
    );
  }

  return s;
}

/**
 * Opens a new browser window and runs the given tests within it.
 * @param args - [url?], tests, [options?], [libs?]
 *   url: string or function returning string
 *   tests: async function receiving session
 *   options: object (e.g., {auto_session: false})
 *   libs: array of library paths to load
 */
const scope =
  (...args) =>
  async () => {
    let libs, options, tests, url_or_snippet_getter;

    // Extract args from end: libs (array) then options (object) then tests (function) then url
    for (let i = args.length - 1; i >= 0; i--) {
      const arg = args[i];
      if (!libs && Array.isArray(arg)) {
        libs = arg;
      } else if (
        !options &&
        arg &&
        typeof arg === 'object' &&
        typeof arg !== 'function'
      ) {
        options = arg;
      } else if (!tests && typeof arg === 'function') {
        tests = arg;
      } else if (typeof arg === 'string' || typeof arg === 'function') {
        url_or_snippet_getter = arg;
      }
    }

    const url_or_snippet = url_or_snippet_getter
      ? typeof url_or_snippet_getter === 'function'
        ? url_or_snippet_getter()
        : url_or_snippet_getter
      : null;

    assert(tests, 'No tests to run provided');

    // Do the test.
    try {
      // Start session if requested.
      let session = null;
      if (!options || options.auto_session !== false) {
        session = await start_session(url_or_snippet, libs);
      }
      await tests(session);
    } catch (e) {
      log_error(e);
      fail(e.message);
    } finally {
      log(`Quit ${active_sessions.length} wd session(s)`);

      while (active_sessions.length > 1) {
        await active_sessions[1].close();
      }
      if (active_sessions.length == 1) {
        await active_sessions[0].quit();
      }
    }
  };

export { start_session, scope };
