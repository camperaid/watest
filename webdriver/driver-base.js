import { settings } from '../core/settings.js';
import { is } from '../core/base.js';
import {
  assert,
  fail,
  info,
  success,
  testflow,
  todo,
  warn,
} from '../core/core.js';
import { stringify } from '../core/util.js';
import { log, log_error } from '../logging/logging.js';
import { LogPipe } from '../logging/logpipe.js';
import { define_class_promise } from './util.js';
import {
  Browser,
  Builder,
  By,
  Condition,
  error,
  until,
} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import chrome from 'selenium-webdriver/chrome.js';

function getChromeOptions() {
  const chromeOptions = new chrome.Options().windowSize({
    width: settings.webdriver_window_width,
    height: settings.webdriver_window_height,
  });
  if (settings.webdriver_headless) {
    chromeOptions.addArguments('headless');
  }
  if (settings.webdriver == 'chrome-mobile') {
    chromeOptions.setMobileEmulation({
      deviceName: 'iPhone 7',
    });
  }
  // Accept self-signed certificates (for k3s testing)
  chromeOptions.addArguments('ignore-certificate-errors');

  // Required for running in Docker/VPS environments
  chromeOptions.addArguments('no-sandbox');
  chromeOptions.addArguments('disable-dev-shm-usage');

  return chromeOptions;
}

function getFirefoxArgs() {
  return settings.webdriver_headless ? ['-headless'] : [];
}

const defaultTimeout = 10;
const getTimeout = () => (testflow.core.getTimeout() || defaultTimeout) * 1000;
const getTimeoutOnFailure = () => (testflow.core.getTimeout() || 0) * 1000; // use non zero values for failure debugging
const browserLogLevel = 'ALL'; // 'WARNING'

function warn_if_stale(e, msg) {
  if (e instanceof error.StaleElementReferenceError) {
    warn(`Stale element error on ${msg}`);
    return false;
  }
  throw e;
}

class TestExecutionError extends Error {}

class CriteriaTimeoutError extends Error {
  constructor() {
    super(`timeout while waiting to meet criteria`);
  }
}

class NoElementsError extends Error {
  constructor(selector) {
    super(`no elements matching '${selector}' selector`);
  }
}

class UnexpectedElementCountError extends Error {
  constructor(selector, gotCount, expectedCount) {
    super(
      `ambigious '${selector}' selector, got ${gotCount} elements, expected ${expectedCount}`,
    );
  }
}

/**
 * A chainable wrapper around selenium web driver, provides barebone methods
 * to build webdrivers upon.
 */
class DriverBase {
  /**
   * Creates an instance of web driver.
   */
  static async build() {
    log(`Build WebDriver for '${settings.webdriver}'`);

    switch (settings.webdriver) {
      case 'chrome': {
        const driver = await new Builder()
          .withCapabilities({
            'browserName': Browser.CHROME,
            'goog:loggingPrefs': {
              browser: browserLogLevel,
            },
          })
          .setChromeOptions(getChromeOptions())
          .build();

        return [
          driver,
          {
            browserLoggingOn: true,
            chrome: true,
          },
        ];
      }

      case 'firefox': {
        const driver = await new Builder()
          .withCapabilities({
            'browserName': Browser.FIREFOX,
            'moz:firefoxOptions': {
              prefs: {
                // Console dumps into stdout
                'devtools.console.stdout.content': true,

                // Imports CA certficates, see
                // https://support.mozilla.org/en-US/kb/setting-certificate-authorities-firefox
                'security.enterprise_roots.enabled': true,
              },
              log: {
                level: settings.webdriver_loglevel,
              },
              args: getFirefoxArgs(),
            },
          })
          .setFirefoxService(new firefox.ServiceBuilder().setStdio('inherit'))
          .build();
        return [
          driver,
          {
            firefox: true,
          },
        ];
      }

      case 'chrome-mobile': {
        const driver = await new Builder()
          .withCapabilities({
            'browserName': Browser.CHROME,
            'goog:loggingPrefs': {
              browser: browserLogLevel,
            },
          })
          .setChromeOptions(getChromeOptions())
          .build();

        return [
          driver,
          {
            isMobile: true,
            chrome: true,
            browserLoggingOn: true,
          },
        ];
      }

      case 'safari': {
        const driver = await new Builder().forBrowser(Browser.SAFARI).build();
        return [
          driver,
          {
            safari: true,
          },
        ];
      }

      case 'edge': {
        const driver = await new Builder().forBrowser(Browser.EDGE).build();
        return [
          driver,
          {
            edge: true,
          },
        ];
      }

      default:
        throw new Error(`Unexpected '${settings.webdriver}' webdriver`);
    }
  }

  static isStdOutLogging(webdriver) {
    return webdriver == 'firefox';
  }

  static get Errors() {
    return error;
  }

  constructor(driver, options) {
    this.dvr = driver;
    this.options = options;
    this.p = Promise.resolve();

    for (let option in options) {
      assert(!this[option]);
      this[option] = options[option];
    }
  }

  /**
   * Matches a list retrieved from a script.
   */
  matchScriptRetval({ script, expected, msg, test, is_matched }) {
    assert(script, `matchScriptRetval: no script`);
    assert(expected !== undefined, `matchScriptRetval: no expected`);
    assert(msg, `matchScriptRetval: no msg`);
    assert(test, `matchScriptRetval: no test`);
    assert(is_matched, `matchScriptRetval: no is_matched`);

    return this.runUntil(
      () => this.dvr.executeAsyncScript(this.wrapScript(script)),
      msg,
      `Expected: ${stringify(expected)}`,
      test,
      is_matched,
    );
  }

  matchElementScriptRetval({ selector, script, msg, test, is_matched }) {
    assert(selector, `matchElementScriptRetval: no selector`);
    assert(script, `matchElementScriptRetval: no script`);
    assert(msg, `matchElementScriptRetval: no msg`);
    assert(test, `matchElementScriptRetval: no test`);
    assert(is_matched, `matchElementScriptRetval: no is_matched`);

    return this.runUntil(
      () =>
        this.dvr
          .wait(until.elementsLocated(By.css(selector)), getTimeout())
          .then(els =>
            this.dvr.executeAsyncScript(this.wrapScript(script), els[0]),
          ),
      msg,
      `Selector: '${selector}'`,
      test,
      is_matched,
    );
  }

  /**
   * Waits for non empty text within an element defined by a selector. Check
   * wether element's text matches the expected one.
   */
  matchText({ selector, text, msg, test, expected_stringified }) {
    assert(selector, `matchText: no selector`);
    assert(text != undefined, `matchText: no text`);
    assert(msg, `matchText: no msg`);
    assert(test, `matchText: no test`);
    assert(expected_stringified, `matchText: no expected_stringified`);

    return this.matchTextBase({
      selector,
      count: 1,
      msg,
      get_text: ([[el, tag]]) =>
        /^(textarea|input)$/i.test(tag)
          ? this.dvr.executeScript(`return arguments[0].value;`, el)
          : el.getText(),
      test,
      is_matched: got =>
        got instanceof Error ? fail(got.message) : is(got, test, msg),
      expected_stringified,
    });
  }

  /**
   * Waits for non empty text within an element defined by a selector. Check
   * wether element's text matches the expected one.
   */
  matchTextAll({ selector, text, msg, test, expected_stringified }) {
    assert(selector, `matchText: no selector`);
    assert(text instanceof Array, `matchText: no text`);
    assert(msg, `matchText: no msg`);
    assert(test, `matchText: no test`);
    assert(expected_stringified, `matchText: no expected_stringified`);

    return this.matchTextBase({
      selector,
      count: text.length,
      msg,
      get_text: els_and_tags =>
        Promise.all(
          els_and_tags.map(([el, tag]) =>
            /^(textarea|input)$/i.test(tag)
              ? this.dvr.executeScript(`return arguments[0].value;`, el)
              : el.getText(),
          ),
        ).then(list => list.map(item => item.replace(/\s+/g, ' ').trim())),
      test,
      is_matched: got =>
        got instanceof Error
          ? fail(got.message)
          : is(got, test, `${msg}, match text`),
      expected_stringified,
    });
  }

  /**
   * Waits for text to match a given condition for an element defined
   * by a selector.
   */
  matchTextBase({
    selector,
    count,
    msg,
    get_text,
    test,
    is_matched,
    expected_stringified,
  }) {
    assert(selector, `matchTextBase: no selector`);
    assert(count, `matchTextBase: no count`);
    assert(msg, `matchTextBase: no msg`);
    assert(get_text, `matchTextBase: no get_text`);
    assert(test, `matchTextBase: no test`);
    assert(is_matched, `matchTextBase: no is_matched`);
    assert(expected_stringified, `matchTextBase: no expected_stringified`);

    return this.matchBase({
      selector,
      count,
      msg,
      get_result: els =>
        Promise.all(els.map(el => Promise.all([el, el.getTagName()])))
          .then(els_and_tags => get_text(els_and_tags))
          .catch(e =>
            warn_if_stale(e, `on '${selector}' element text retrieval`),
          ),
      get_result_description: 'tag name',
      test,
      is_matched,
      expected_stringified,
    });
  }

  /**
   * Waits untils an element defined by a selector has attribute of a given value.
   */
  matchAttribute({ selector, attr, msg, test, expected_stringified }) {
    assert(selector, `matchAttribute: no selector`);
    assert(attr, `matchAttribute: no attr`);
    assert(msg, `matchAttribute: no msg`);
    assert(test, `matchAttribute: no test`);
    assert(expected_stringified, `matchAttributeAll: no expected_stringified`);

    return this.matchBase({
      selector,
      count: 1,
      msg,
      get_result: ([el]) => el.getAttribute(attr),
      get_result_description: 'attribute',
      test,
      is_matched: got =>
        got instanceof Error ? fail(got.message) : is(got, test, msg),
      expected_stringified,
    });
  }

  /**
   * Waits untils an element defined by a selector has attribute of a given value.
   */
  matchAttributeAll({
    selector,
    attr,
    values,
    msg,
    test,
    expected_stringified,
  }) {
    assert(selector, `matchAttributeAll: no selector`);
    assert(attr, `matchAttributeAll: no attr`);
    assert(values, `matchAttributeAll: no values`);
    assert(msg, `matchAttributeAll: no msg`);
    assert(test, `matchAttributeAll: no test`);
    assert(expected_stringified, `matchAttributeAll: no expected_stringified`);

    return this.matchBase({
      selector,
      count: values.length,
      msg,
      get_result: els => Promise.all(els.map(el => el.getAttribute(attr))),
      get_result_description: 'attribute',
      test,
      is_matched: got =>
        got instanceof Error
          ? fail(got.message)
          : is(got, test, `${msg}, match attribute values`),
      expected_stringified,
    });
  }

  /**
   * Waits for a match of a given condition for element(s) defined
   * by a selector.
   */
  matchBase({
    selector,
    count,
    msg,
    get_result,
    get_result_description,
    test,
    is_matched,
    expected_stringified,
  }) {
    assert(selector, `matchTextBase: no selector`);
    assert(count, `matchTextBase: no count`);
    assert(msg, `matchTextBase: no msg`);
    assert(get_result, `matchTextBase: no get_result`);
    assert(get_result_description, `matchTextBase: no get_result_description`);
    assert(test, `matchTextBase: no test`);
    assert(is_matched, `matchTextBase: no is_matched`);
    assert(expected_stringified, `matchTextBase: no expected_stringified`);

    let expected =
      expected_stringified instanceof Function
        ? expected_stringified()
        : expected_stringified;

    test.toString = () => expected;

    return this.runUntil(
      () =>
        this.dvr
          .wait(until.elementsLocated(By.css(selector)), getTimeout())
          .catch(e => {
            if (e instanceof error.TimeoutError) {
              if (
                e.message.startsWith(
                  'Waiting for at least one element to be located',
                )
              ) {
                throw new NoElementsError(selector);
              }
            }
            throw e;
          })
          .then(els => {
            if (els.length > count) {
              throw new UnexpectedElementCountError(
                selector,
                els.length,
                count,
              );
            }
            return els;
          })
          .then(els => get_result(els))
          .catch(e =>
            warn_if_stale(
              e,
              `on '${selector}' ${get_result_description} retrieval`,
            ),
          ),
      msg,
      `Expected: ${expected}. Selector: '${selector}'`,
      test,
      is_matched,
    );
  }

  /**
   * Clicks an element defined by a selector.
   */
  click(
    selector,
    msg,
    { do_not_fail_if_not_unique, throw_on_fail, no_click_check },
    click_func,
  ) {
    let listenClick = `
      window.__selenium_lastClick = new Promise(resolve => {
        const limit = 100;
        const selector = arguments[0];
        const events = [ 'mousedown', 'mouseup', 'click', 'dblclick' ];

        window.__selenium_clickHandler = {
          id: Math.random(),
          handleEvent(ev) {
            function atos(attrs)
            {
              return Array.from(attrs).reduce((a, v) => {
                let value = v.value.length > limit ?
                  v.value.substring(0, limit) + '…' : v.value;
                return a + ' ' + v.name + '="' + value + '"';
              }, '');
            }

            let target = ev.target;
            let el = window.document.querySelector(selector);
            let x = ev.clientX;
            let y = ev.clientY;

            let deliveredTo = '<' + target.localName +
              atos(target.attributes) + '/>';

            let dispatchedTo = '<' + (el && el.localName) +
              atos(el && el.attributes || []) + '/>';

            console.log(
              '[WD-' + this.id + '] ' + ev.type + ' fired to ' + deliveredTo + ' at (' + x + ', ' + y + ')'
            );
            if (ev.type != 'click') {
              return;
            }

            // Store rect of a clicking element. In Chrome in case of a hidden
            // submit button receiveing a first click and an element receiving
            // a second click, the element boundary can be obtained only on
            // the first click, while the form is not yet hidden.
            if (!window.__selenium_clickElRect) {
              window.__selenium_clickElRect = el && el.getBoundingClientRect();
            }

            // When submitting a form having a hidden submit button, the first
            // click goes to the submit button, and the second one goes to
            // a clicked element. Skip the first click.
            if (target.type == 'submit' && target.hidden) {
              return;
            }

            console.log(
              '[WD-' + window.__selenium_clickHandler.id + '] Remove click event listeners'
            );
            for (let ev of events) {
              window.document.removeEventListener(
                ev, window.__selenium_clickHandler, true
              );
            }

            resolve({
              x,
              y,
              target: deliveredTo,
              targetRect: target.getBoundingClientRect(),
              el: dispatchedTo,
              elRect: window.__selenium_clickElRect,
            });
          }
        };
        console.log(
          '[WD-' + window.__selenium_clickHandler.id + '] Set up click event listeners for ' + selector
        );
        for (let ev of events) {
          window.document.addEventListener(
            ev, window.__selenium_clickHandler, true
          );
        }
      });
      (arguments[arguments.length - 1])();
    `;

    let checkClick = `
      console.log('[WD] Wait for lastClick promise resolved');
      (Promise.resolve(window.__selenium_lastClick)).then(result => {
        console.log('[WD] lastClick promise was resolved');
        delete window.__selenium_clickHandler;
        delete window.__selenium_lastClick;
        delete window.__selenium_clickElRect;

        (arguments[arguments.length - 1])(result);
      });
    `;

    return this.waitForElementToInvoke(
      selector,
      el =>
        this.dvr
          .executeAsyncScript(listenClick, selector)
          .then(() => click_func(el))
          .then(
            () => !no_click_check && this.dvr.executeAsyncScript(checkClick),
          )
          .then(r => {
            if (!r) {
              if (!no_click_check) {
                info(
                  `No click event result. The webpage must be navigated out.`,
                );
              }
              return;
            }

            let rtos = r =>
              `[ x: ${r.x}, y: ${r.y}, w: ${r.width}, h: ${r.height} ]`;
            let targetRect = rtos(r.targetRect);
            let elRect = rtos(r.elRect);
            info(
              `clicked at ${r.target} at (${r.x}, ${r.y}), target's rect: ${targetRect}; dispatched to: ${r.el}, rect: ${elRect}}`,
            );
            let x_before = r.x < r.elRect.x;
            let x_after = r.x > r.elRect.x + r.elRect.width;
            let y_before = r.y < r.elRect.y;
            let y_after = r.y > r.elRect.y + r.elRect.height;
            if (x_before || x_after || y_before || y_after) {
              let ptos = (f, s, v) => {
                let before = f - v;
                let after = v - s;
                let xk =
                  (before > 0 && 'before') ||
                  (after > 0 && 'after') ||
                  'within';
                let xd =
                  (before > 0 && ` by ${before}px off the bounds`) ||
                  (after > 0 && ` at ${after}px of the bounds`) ||
                  '';
                return `is ${xk} the rect${xd}`;
              };

              let xs = `x ${ptos(
                r.elRect.x,
                r.elRect.x + r.elRect.width,
                r.x,
              )}`;
              let ys = `y ${ptos(
                r.elRect.y,
                r.elRect.y + r.elRect.height,
                r.y,
              )}}`;
              ((throw_on_fail && todo) || warn)(
                `Unexpected element clicked: ${xs}, ${ys}`,
              );
              if (throw_on_fail) {
                throw new Error(`Expected failure`);
              }
            } else if (throw_on_fail) {
              fail(`Expected element clicked: todo test should be adjusted`);
            }
          }),
      msg,
      null, // failure_details
      do_not_fail_if_not_unique,
      throw_on_fail,
    );
  }

  /**
   * Runs an action until condition is true.
   */
  runUntil(chain, msg, details_msg, criteria, is_matched) {
    assert(chain, `runUntil: no chain`);
    assert(chain, `runUntil: no details_msg`);
    assert(msg, `runUntil: no msg`);
    assert(criteria, `runUntil: no criteria`);
    assert(is_matched, `runUntil: no is_matched`);

    let breadcrumbs = {
      is_matched,
    };
    let cond = new Condition(`until meet criteria`, () =>
      chain().then(v => {
        breadcrumbs.got = v;
        return criteria(v);
      }),
    );

    return this.run(
      () => this.waitForCondition(cond, () => breadcrumbs),
      msg,
      details_msg,
    );
  }

  /**
   * Wrapper around driver.wait printing breadcrumbs
   */
  waitForCondition(cond, get_breadcrumbs) {
    return this.dvr.wait(cond, getTimeout()).then(
      () => this.checkBreadcrumbs(get_breadcrumbs),
      e => {
        if (
          e instanceof error.TimeoutError ||
          e instanceof error.ScriptTimeoutError
        ) {
          this.checkBreadcrumbs(get_breadcrumbs);
          if (e.message.startsWith(`Waiting until`)) {
            throw new CriteriaTimeoutError();
          }
        }
        throw e;
      },
    );
  }

  /**
   * Reports whether breadcrumbs match expectations.
   */
  checkBreadcrumbs(get_breadcrumbs) {
    let breadcrumbs = get_breadcrumbs();
    if (typeof breadcrumbs != 'object' || breadcrumbs === null) {
      return null;
    }

    if (breadcrumbs instanceof Array) {
      for (let i = 0; i < breadcrumbs.length; i++) {
        let crumb = breadcrumbs[i];
        if (crumb.is_matched) {
          crumb.is_matched(crumb.got);
        } else {
          is(
            breadcrumbs[i].got,
            breadcrumbs[i].expected,
            `${breadcrumbs[i].msg} at ${i} index`,
          );
        }
      }
      return breadcrumbs.map(b => b.got);
    }

    if (breadcrumbs.is_matched) {
      breadcrumbs.is_matched(breadcrumbs.got);
    } else if (
      breadcrumbs.got instanceof Object &&
      breadcrumbs.expected instanceof Object
    ) {
      is(breadcrumbs.got, breadcrumbs.expected, breadcrumbs.msg, {
        ignore_unexpected: true,
      });
    } else {
      is(breadcrumbs.got, breadcrumbs.expected, breadcrumbs.msg);
    }

    return breadcrumbs.got;
  }

  /**
   * Helper Waits for an element defined by a selector.
   */
  waitForElementToInvoke(
    selector,
    func,
    msg,
    failure_details,
    do_not_fail_if_not_unique,
    expected_failure,
  ) {
    assert(selector, `No selector is provided`);
    assert(func);

    let chain = () =>
      this.dvr
        .wait(until.elementsLocated(By.css(selector)), getTimeout())
        .then(els => {
          if (!do_not_fail_if_not_unique) {
            is(els.length, 1, `'${selector}' has to be unique`);
          }
          return func(els[0]);
        });
    return this.run(
      chain,
      msg,
      `Selector: '${selector}'`,
      failure_details,
      expected_failure,
    );
  }

  browserLogEntries() {
    return this.browserLoggingOn
      ? this.dvr.manage().logs().get('browser')
      : Promise.resolve([]);
  }

  /**
   * Logs all entries from the browser console.
   */
  async browserLogs() {
    let entries = await this.browserLogEntries();

    let hasErrors = false;
    for (let entry of entries) {
      // Whipe out data URLs from console messages, they often come huge
      // and thus is a real performance bummer.
      let message = entry.message.replace(
        /(data:\S+?)(\s|:)(\d+):(\d+)/g,
        (match, p1, p2, p3, p4) => `dataurl-placeholder:${p3}:${p4}`,
      );
      log(`[${entry.level.name}] ${message}`);
    }

    let errors = entries.filter(entry => entry.level.name == 'SEVERE');
    for (let error of errors) {
      hasErrors = true;
      fail(error.message);
    }

    let warnings = entries.filter(entry => entry.level.name == 'WARNING');
    for (let warning of warnings) {
      warn(warning.message);
    }

    if (hasErrors) {
      return this.captureScreenshot().then(() => {
        throw new Error(`Browser console error`);
      });
    }
    return Promise.resolve();
  }

  captureScreenshot() {
    return (
      !this.screenshot_disabled &&
      this.dvr.takeScreenshot().then(pic => LogPipe.logScreenshot(pic))
    );
  }

  /**
   * Runs a single test. Reports success or failure.
   */
  run(chain, msg, details, failure_details, expected_failure) {
    assert(msg, 'run: no msg');

    return this.chain(() =>
      Promise.resolve()
        .then(() => log(`Test: ${msg}${(details && `. ${details}`) || ''}`))
        .then(() => chain())
        .then(v => this.browserLogs().then(() => v))
        .then(v => {
          success(msg);
          return v;
        })
        .catch(e => {
          // Propagate last process exception.
          if (this.options.stopCascade) {
            info(`Cascade failure. ${msg}`);
            throw e;
          }
          return this.browserLogs()
            .then(() => Promise.resolve(failure_details && failure_details()))
            .then(f => {
              let report = (expected_failure && todo) || fail;
              report(`${msg}, ${e.message}`);
              let fdetails = '';
              if (f != undefined) {
                fdetails = `. Failure details: ${
                  (typeof f == 'object' && stringify(f)) || f
                }`;
              }
              report(`${msg}${fdetails}`);
              if (
                !(e instanceof CriteriaTimeoutError) &&
                !(e instanceof NoElementsError) &&
                !(e instanceof UnexpectedElementCountError)
              ) {
                log_error(e);
              }
            })
            .then(() => this.captureScreenshot())
            .catch(e => {
              log_error(e);
              fail(e.message);
            })
            .then(() => {
              let timeoutOnFailure = getTimeoutOnFailure();
              let promise = Promise.resolve();
              if (timeoutOnFailure > 0) {
                log(`Sleeping for ${timeoutOnFailure} ms`);
                promise = this.dvr.sleep(timeoutOnFailure);
              }
              return promise.then(() => {
                if (expected_failure) {
                  this.options.stopCascade = true;
                }
                throw new TestExecutionError(`Test failed`);
              });
            });
        }),
    );
  }

  /**
   * Chains a function to the execution flow.
   */
  chain(link) {
    let chainLink = new this.constructor.CtorPromise(
      this.p.then(link),
      this.dvr,
      this.options,
    );

    this.dvr.lastChainLink = chainLink;
    chainLink.then(
      () => {
        if (this.dvr.lastChainLink == chainLink) {
          this.dvr.lastChainLink = null;
        }
      },
      () => {
        if (this.dvr.lastChainLink == chainLink) {
          this.dvr.lastChainLink = null;
        }
      },
    );
    return chainLink;
  }

  wrapScript(func) {
    return `
      new Promise(resolve => Promise.resolve(${func}).then(resolve))
      .catch(e => console.error(e))
      .then(arguments[arguments.length - 1])
    `;
  }

  /**
   * Returns Promise class for this class.
   */
  static get CtorPromise() {
    if (!this._CtorPromise) {
      this._CtorPromise = define_class_promise(this, v => v);
    }
    return this._CtorPromise;
  }
}

export { DriverBase, getTimeout, TestExecutionError };
