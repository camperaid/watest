'use strict';

const { By, Condition, Key, until } = require('selenium-webdriver');

const { test_is, test_contains, is, contains, ok } = require('../core/base.js');
const { assert, fail } = require('../core/core.js');
const { is_mac, stringify, toDataURL } = require('../core/util.js');
const { log } = require('../logging/logging.js');
const { getTimeout, DriverBase } = require('./driver_base.js');

/**
 * A chainable web driver providing a number of handy methods to navigate
 * web pages, operate with DOM etc.
 */
class Driver extends DriverBase {
  static async build() {
    let [webdriver, options] = await super.build();
    return webdriver && new Driver(webdriver, options);
  }

  //
  // Navigation
  //

  /**
   * Loads URL.
   */
  load(url_or_snippet) {
    // If code snippet is given, then construct a data URL.
    let url = null;
    if (url_or_snippet) {
      try {
        if (new URL(url_or_snippet).hostname) {
          url = url_or_snippet;
        }
      } catch (e) {
        // Non standard Error.code may not be set to 'ERR_INVALID_URL'.
        if (!(e instanceof TypeError) || !e.message.startsWith('Invalid URL')) {
          throw e;
        }
      }
      if (!url) {
        url = toDataURL(url_or_snippet);
      }
    }

    return this.run(() => this.dvr.get(url), `Load URL`, url);
  }

  back() {
    return this.run(() => this.dvr.navigate().back(), 'Move back in history');
  }

  forward() {
    return this.run(
      () => this.dvr.navigate().forward(),
      'Move forward in history'
    );
  }

  refresh() {
    return this.run(() => this.dvr.navigate().refresh(), 'Refresh the page');
  }

  /**
   * Waits for page of a title being loaded.
   */
  pageLoaded(title, url, msg) {
    assert(title, `No title given`);
    assert(url, `No url given`);

    // Safari hangs on waiting for title quite often.
    if (this.safari) {
      return this.run(
        () => this.dvr.wait(until.urlIs(url), getTimeout()),
        msg,
        `Expected url: '${url}'`,
        () => this.dvr.getCurrentUrl().then(u => `actual current url: '${u}'`)
      );
    }

    return this.run(
      () =>
        Promise.all([
          this.dvr.wait(until.titleIs(title), getTimeout()),
          this.dvr.wait(until.urlIs(url), getTimeout()),
        ]),
      msg,
      `Expected title: '${title}', url: '${url}'`,
      () =>
        Promise.all([this.dvr.getTitle(), this.dvr.getCurrentUrl()]).then(
          ([t, u]) => `actual title: '${t}', current url: '${u}'`
        )
    );
  }

  //
  // Management
  //

  /**
   * Captures a screenshot.
   */
  screenshot() {
    return this.chain(() => this.captureScreenshot());
  }

  /**
   * Invokes an action.
   */
  invoke(action) {
    return this.chain(() => action());
  }

  /**
   * Sleeps for given amount of seconds.
   */
  sleep(sec) {
    return this.chain(() => {
      log(`Sleeping ${sec} sec(s)`);
      return this.dvr.sleep(1000 * sec);
    });
  }

  async flush() {
    let link;
    do {
      link = this.dvr.lastChainLink;
      await link;
    } while (link != this.dvr.lastChainLink);
  }

  /**
   * Quits.
   */
  quit() {
    return this.flush()
      .then(() => this.browserLogs())
      .then(() => this.dvr.quit().then(() => log(`Driver has quit`)));
  }

  /**
   * Closes currently focused window.
   */
  close() {
    return this.flush()
      .then(() => this.browserLogs())
      .then(() => this.dvr.close());
  }

  //
  // DOM
  //

  /**
   * Return attribute value of an element defined by a selector.
   */
  getAttribute(selector, attr, msg) {
    assert(selector, `getAttribute: no selector`);
    assert(attr, `getAttribute: no attr`);
    assert(msg, `getAttribute: no msg`);

    return this.waitForElementToInvoke(
      selector,
      el =>
        this.dvr
          .wait(until.elementIsVisible(el), getTimeout())
          .getAttribute(attr),
      msg
    );
  }

  /**
   * Waits untils an element defined by a selector has attribute.
   */
  hasAttribute(selector, attr, msg) {
    assert(selector, `hasAttribute: no selector`);
    assert(attr, `hasAttribute: no attr`);
    assert(msg, `hasAttribute: no msg`);

    return this.matchAttribute({
      selector,
      attr,
      msg,
      test: got => got !== null,
      expected_stringified: stringify(null),
    });
  }

  /**
   * Waits untils an element defined by a selector has no attribute.
   */
  noAttribute(selector, attr, msg) {
    assert(selector, `noAttribute: no selector`);
    assert(attr, `noAttribute: no attr`);
    assert(msg, `noAttribute: no msg`);

    return this.matchAttribute({
      selector,
      attr,
      msg,
      test: got => got === null,
      expected_stringified: stringify(null),
    });
  }

  /**
   * Waits untils an element defined by a selector has attribute of a given value.
   */
  attributeIs(selector, attr, value, msg) {
    assert(selector, `attributeIs: no selector`);
    assert(attr, `attributeIs: no attr`);
    assert(value !== undefined, `attributeIs: no value`);
    assert(msg, `attributeIs: no msg`);

    return this.matchAttribute({
      selector,
      attr,
      msg,
      test: got => got == value,
      expected_stringified: stringify(value),
    });
  }

  /**
   * Waits untils an element defined by a selector has attribute of a given value.
   */
  attributeIsAll(selector, attr, values, msg) {
    assert(selector, `attributeIsAll: no selector`);
    assert(attr, `attributeIsAll: no attr`);
    assert(values, `attributeIsAll: no values`);
    assert(msg, `attributeIsAll: no msg`);

    return this.matchAttributeAll({
      selector,
      attr,
      values,
      msg,
      test: got =>
        test_is(
          got,
          values.map(value => got => got == value)
        ),
      expected_stringified: stringify(values),
    });
  }

  /**
   * Waits untils an element defined by a selector has attribute of a given value.
   */
  attributeContains(selector, attr, value, msg) {
    assert(selector, `attributeContains: no selector`);
    assert(attr, `attributeContains: no attr`);
    assert(value != undefined, `attributeContains: no value`);
    assert(msg, `attributeContains: no msg`);

    return this.matchAttribute({
      selector,
      attr,
      msg,
      test: got => got && got.includes(value),
      expected_stringified: `contains '${value}'`,
    });
  }

  /**
   * Waits untils an element defined by a selector has attribute of a given value.
   */
  attributeContainsAll(selector, attr, values, msg) {
    assert(selector, `attributeContainsAll: no selector`);
    assert(attr, `attributeContainsAll: no attr`);
    assert(values, `attributeContainsAll: no values`);
    assert(msg, `attributeContainsAll: no msg`);

    return this.matchAttributeAll({
      selector,
      attr,
      values,
      msg,
      test: got =>
        test_is(
          got,
          values.map(value => got => got && got.includes(value))
        ),
      expected_stringified: stringify(values),
    });
  }

  /**
   * Waits until an element defined by the selector has the given class name.
   */
  classNameStateIs(selector, classname, off_or_on, msg) {
    assert(selector, `classNameStateIs: no selector`);
    assert(classname, `classNameStateIs: no classname`);
    assert(
      ['on', 'off'].includes(off_or_on),
      `classNameStateIs: wrong off_or_on`
    );
    assert(msg, `classNameStateIs: no msg`);

    let operator = (off_or_on == 'off' && '!') || '';
    return this.matchElementScriptRetval({
      selector,
      script: `${operator}arguments[0].classList.contains('${classname}')`,
      msg,
      test: v => !!v,
      is_matched: v =>
        ok(
          v,
          `${selector} has ${
            (off_or_on == 'off' && 'not ') || ''
          }${classname} class name`
        ),
    });
  }

  /**
   * Waits until an element defined by the selector has the given HTML.
   */
  innerHTMLIs(selector, html, msg) {
    assert(selector, `innerHTMLIs: no selector`);
    assert(html != undefined, `innerHTMLIs: no html`);
    assert(msg, `innerHTMLIs: no msg`);

    return this.matchElementScriptRetval({
      selector,
      script: `arguments[0].innerHTML`,
      msg,
      test: v => v.replace(/\s+/g, ' ').trim() == html,
      is_matched: v => is(v, html, `${msg}, HTML match for '${selector}`),
    });
  }

  /**
   * Waits until an element defined by the selector has a given property value.
   */
  propertyIs(selector, prop, value, msg) {
    assert(selector, `propertyIs: no selector`);
    assert(prop, `propertyIs: no prop`);
    assert(value != undefined, `propertyIs: no value`);
    assert(msg, `propertyIs: no msg`);

    return this.matchElementScriptRetval({
      selector,
      script: `arguments[0]['${prop}']`,
      msg,
      test: v => test_is(v, value, { ignore_unexpected: true }),
      is_matched: v =>
        is(v, value, `${prop} property value match`, {
          ignore_unexpected: true,
        }),
    });
  }

  /**
   * Checks element's text whether it matches the given text.
   */
  textIs(selector, text, msg) {
    assert(selector, `textIs: no selector`);
    assert(text != undefined, `textIs: no text`);
    assert(msg, `textIs: no msg`);

    return this.matchText({
      selector,
      text,
      msg,
      test: got =>
        typeof got == 'string' && got.replace(/\s+/g, ' ').trim() == text,
      expected_stringified: stringify(text),
    });
  }

  /**
   * Checks elements text whether it matches the given text.
   */
  textIsAll(selector, text, msg) {
    assert(selector, `textIsAll: no selector`);
    assert(text instanceof Array, `textIsAll: no text`);
    assert(msg, `textIsAll: no msg`);

    return this.matchTextAll({
      selector,
      text,
      msg,
      test: got => test_is(got, text),
      expected_stringified: stringify(text),
    });
  }

  /**
   * Checks element's text whether it starts with the given text.
   */
  textStartsWith(selector, text, msg) {
    assert(selector, `textStartsWith: no selector`);
    assert(text, `textStartsWith: no text`);
    assert(msg, `textStartsWith: no msg`);

    return this.matchText({
      selector,
      text,
      msg,
      test: got => got.startsWith(text),
      expected_stringified: `starts with '${text}'`,
    });
  }

  /**
   * Checks element's text whether it ends with the given text.
   */
  textEndsWith(selector, text, msg) {
    assert(selector, `textEndsWith: no selector`);
    assert(text, `textEndsWith: no text`);
    assert(msg, `textEndsWith: no msg`);

    return this.matchText({
      selector,
      text,
      msg,
      test: got => got.endsWith(text),
      expected_stringified: `ends with '${text}'`,
    });
  }

  /**
   * Checks element's text whether it is empty
   */
  textEmpty(selector, msg) {
    assert(selector, `textEmpty: no selector`);
    assert(msg, `textEmpty: no msg`);

    return this.matchText({
      selector,
      text: '',
      msg,
      test: got => got == '',
      expected_stringified: 'no text',
    });
  }

  /**
   * Set value property.
   */
  setValue(selector, value, msg) {
    assert(selector, `setValue: no selector`);
    assert(value != undefined, `setValue: no value`);
    assert(msg, `setValue: no msg`);
    return this.setProperty(selector, 'value', value, msg);
  }

  /**
   * Set innerHTML.
   */
  setInnerHTML(selector, value, msg) {
    assert(selector, `setInnerHTML: no selector`);
    assert(value != undefined, `setInnerHTML: no value`);
    assert(msg, `setInnerHTML: no msg`);
    return this.setProperty(selector, 'innerHTML', value, msg);
  }

  /**
   * Set property value.
   */
  setProperty(selector, property, value, msg) {
    assert(selector, `setProperty: no selector`);
    assert(property, `setProperty: no property`);
    assert(value != undefined, `setProperty: no value`);
    assert(msg, `setProperty: no msg`);

    return this.waitForElementToInvoke(
      selector,
      el =>
        this.dvr.executeScript(
          `return arguments[0]['${property}'] = arguments[1];`,
          el,
          value
        ),
      msg
    );
  }

  //
  // Controls
  //

  /**
   * Picks file(s) in a file input.
   */
  pickFile(selector, path, msg) {
    return this.pickFiles(selector, [path], msg);
  }

  pickFiles(selector, paths, msg) {
    assert(selector, `pickFiles: no selector`);
    assert(paths, `pickFiles: no paths`);
    assert(msg, `pickFiles: no msg`);

    return this.chain(async () => {
      // Clear previosly set value if any.
      await this.setProperty(selector, 'value', '', msg);

      // Send keys to upload files.
      await this.waitForElementToInvoke(
        selector,
        el => el.sendKeys(paths.join('\n')),
        msg
      );
    });
  }

  //
  // Scripts
  //

  /**
   * Executes async script in the browser.
   */
  executeScript(func, msg) {
    assert(func, `executeScript: no func`);
    assert(msg, `executeScript: no msg`);
    return this.run(
      () => this.dvr.executeAsyncScript(this.wrapScript(func)),
      msg
    );
  }

  /**
   * Invokes a data request to the server on client.
   */
  invokeRequest(request) {
    return this.executeScript(
      `window.DataRequest.request(${JSON.stringify(request)})`,
      `Invoke request: ${stringify(request)}`
    );
  }

  /**
   * Waits until script retval is matched an expected value.
   */
  scriptRetvalIs(script, expected, msg) {
    return this.matchScriptRetval({
      script,
      expected,
      msg,
      test: got => test_is(got, expected, { ignore_unexpected: true }),
      is_matched: got =>
        is(got, expected, `${msg}, script retval`, {
          ignore_unexpected: true,
        }),
    });
  }

  /**
   * Waits until script retval contains a given array.
   */
  scriptRetvalContains(script, expected, msg) {
    expected = (expected instanceof Array && expected) || [expected];

    return this.matchScriptRetval({
      script,
      expected,
      msg,
      test: got => test_contains(got, expected, { ignore_unexpected: true }),
      is_matched: got =>
        contains(
          got,
          expected,
          `script retval contains ${stringify(expected)}`,
          { ignore_unexpected: true }
        ),
    });
  }

  //
  // Mouse
  //

  /**
   * Clicks an element defined by a selector.
   */
  click(selector, msg, options) {
    assert(selector, `click: no selector`);
    assert(msg, `click: no msg`);
    return super.click(selector, msg, options || {}, el =>
      this.dvr.wait(until.elementIsVisible(el), getTimeout()).click()
    );
  }

  /**
   * Clicks an element defined by a selector at a given position relative
   * the element.
   */
  clickAt(selector, pos, msg, options) {
    assert(selector, `clickAt: no selector`);
    assert(pos, `clickAt: no pos`);
    assert(msg, `clickAt: no msg`);

    let { no_click_check } = options || {};
    return super.click(
      selector,
      `${msg}. Click at ${pos[0]}, ${pos[1]}`,
      {
        no_click_check,
      },
      // Firefox treats it as double click if no pause between mouse move and
      // click.
      el =>
        this.dvr
          .actions({ bridge: true })
          .move({ x: pos[0], y: pos[1], origin: el })
          .pause((this.firefox && 300) || 0)
          .click()
          .perform()
    );
  }

  /**
   * Double clicks at an element specified by the selector.
   */
  doubleClick(selector, msg) {
    assert(selector, `doubleClick: no selector`);
    assert(msg, `doubleClick: no msg`);

    return super.click(
      selector,
      `${msg}. Double click at ${selector}`,
      {},
      el => this.dvr.actions({ bridge: true }).doubleClick(el).perform()
    );
  }

  /**
   * Double clicks at an element specified by the selector at the given position.
   */
  doubleClickAt(selector, pos, msg) {
    assert(selector, `doubleClick: no selector`);
    assert(pos, `clickAt: no pos`);
    assert(msg, `doubleClick: no msg`);

    return super.click(
      selector,
      `${msg}. Double click at ${pos[0]}, ${pos[1]}`,
      {},
      el =>
        this.dvr
          .actions({ bridge: true })
          .move({ x: pos[0], y: pos[1], origin: el })
          .pause((this.firefox && 300) || 0)
          .doubleClick()
          .perform()
    );
  }

  dragAndDrop(selector, from, to) {
    assert(selector, `dragAndDrop: no selector`);
    assert(from, `dragAndDrop: no from`);
    assert(to, `dragAndDrop: no to`);

    return this.waitForElementToInvoke(
      selector,
      el =>
        this.dvr
          .actions({ bridge: true })
          .move({ x: from[0], y: from[1], origin: el })
          .press()
          .move({ x: to[0], y: to[1], origin: el })
          .release()
          .perform(),
      `Drag-n-drop from ${from}, to ${to}`
    );
  }

  scrollIntoView(selector, msg) {
    assert(selector, `scrollIntoView: no selector`);
    assert(msg, `scrollIntoView: no msg`);

    return this.waitForElementToInvoke(
      selector,
      el => this.dvr.executeScript(`return arguments[0].scrollIntoView();`, el),
      msg
    );
  }

  //
  // Keys
  //

  /**
   * Sends keys to an element defined by a selector.
   */
  sendKeys(selector, text, msg) {
    assert(selector, `sendKeys: no selector`);
    assert(text != undefined, `sendKeys: no text`);
    assert(msg, `sendKeys: no msg`);

    return this.waitForElementToInvoke(
      selector,
      el =>
        this.dvr.wait(until.elementIsVisible(el), getTimeout()).sendKeys(text),
      msg
    );
  }

  /**
   * Hit enter key.
   */
  hitEnter(selector, msg) {
    assert(selector, `hitEnter: no selector`);
    assert(msg, `hitEnter: no msg`);

    return this.waitForElementToInvoke(
      selector,
      el =>
        this.dvr
          .wait(until.elementIsVisible(el), getTimeout())
          .sendKeys(Key.RETURN),
      msg
    );
  }

  /**
   * Hit backspace key.
   */
  hitBackspace(selector_or_count, msg) {
    if (selector_or_count && typeof selector_or_count == 'string') {
      assert(msg, `hitBackspace: no msg`);
      let selector = selector_or_count;
      return this.waitForElementToInvoke(
        selector,
        el =>
          this.dvr
            .wait(until.elementIsVisible(el), getTimeout())
            .sendKeys(Key.BACK_SPACE),
        msg
      );
    }

    let count = selector_or_count || 1;
    let keys = [];
    for (let i = 0; i < count; i++) {
      keys.push(Key.BACK_SPACE);
    }

    return this.run(
      () =>
        this.dvr
          .actions({ bridge: true })
          .sendKeys(...keys)
          .perform(),
      `Press Backspace ${count} times`
    );
  }

  /**
   * Press arrow up key.
   */
  arrowUp(count) {
    count = count || 1;
    let keys = [];
    for (let i = 0; i < count; i++) {
      keys.push(Key.ARROW_UP);
    }

    return this.run(
      () =>
        this.dvr
          .actions({ bridge: true })
          .sendKeys(...keys)
          .perform(),
      `Press ArrowUp ${count} times`
    );
  }

  /**
   * Press arrow down key.
   */
  arrowDown() {
    return this.run(
      () =>
        this.dvr.actions({ bridge: true }).sendKeys(Key.ARROW_DOWN).perform(),
      `Press ArrowDown`
    );
  }

  /**
   * Press arrow right key.
   */
  arrowRight() {
    return this.run(
      () =>
        this.dvr.actions({ bridge: true }).sendKeys(Key.ARROW_RIGHT).perform(),
      `Press ArrowRight`
    );
  }

  /**
   * Press arrow right key.
   */
  arrowLeft() {
    return this.run(
      () =>
        this.dvr.actions({ bridge: true }).sendKeys(Key.ARROW_LEFT).perform(),
      `Press ArrowLeft`
    );
  }

  /**
   * Press tab key.
   */
  tab() {
    return this.run(
      () => this.dvr.actions({ bridge: true }).sendKeys(Key.TAB).perform(),
      `Press Tab`
    );
  }

  /**
   * Press shift+tab key.
   */
  shiftTab() {
    return this.run(
      () =>
        this.dvr
          .actions({ bridge: true })
          .keyDown(Key.SHIFT)
          .sendKeys(Key.TAB)
          .keyUp(Key.SHIFT)
          .perform(),
      `Press Shift+Tab`
    );
  }

  //
  // Selection
  //

  /**
   * Select all.
   */
  selectAll(selector, msg) {
    assert(selector, `selectAll: no selector`);
    assert(msg, `selectAll: no msg`);

    if (this.firefox) {
      let accel = (is_mac() && Key.COMMAND) || Key.CONTROL;
      return this.waitForElementToInvoke(
        selector,
        el => el.sendKeys(Key.chord(accel, 'a')),
        `${msg} press Ctrl+A`
      );
    }

    // ctlr+A doens't work OS X in Chrome.
    let script = `
let el = document.querySelector(\`${selector}\`);
if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
  el.select();
}
else {
  let r = document.createRange();
  r.selectNodeContents(el);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(r);
}
`;
    return this.run(
      () =>
        this.dvr.executeScript(script).catch(e => {
          fail(`Failed to execute selectAll script: ${script}`);
          throw e;
        }),
      msg
    );
  }

  /**
   * Remove selected text.
   */
  clear(selector, msg) {
    return this.selectAll(selector, msg).hitBackspace();
  }

  /**
   * Waits until element has selected text.
   */
  textSelected(selector, msg) {
    assert(selector, `textSelected: no selector`);
    assert(msg, `textSelected: no msg`);

    return this.matchTextBase({
      selector,
      count: 1,
      msg,
      get_text: ([[el, tag]]) => {
        const script = /^(textarea|input)$/i.test(tag)
          ? `return arguments[0].selectionStart == 0 && arguments[0].selectionEnd == arguments[0].value.length;`
          : `return window.getSelection().containsNode(arguments[0]);`;
        return this.dvr.executeScript(script, el);
      },
      test: got => !!got,
      is_matched: got => ok(got, `${msg}: text is selected`),
      expected_stringified: () => `text should be selected`,
    });
  }

  /**
   * Waits until elements count matches.
   */
  elementsCount(selector, count, msg) {
    assert(selector, `elementsCount: no selector`);
    assert(count >= 0, `elementsCount: count is not >= 0`);
    assert(msg, `elementsCount: no msg`);

    let breadcrumbs = '';
    let cond = new Condition(`until element count`, () =>
      this.dvr.findElements(By.css(selector)).then(els => {
        breadcrumbs = `Got elements count: ${els.length}, expected: ${count}`;
        return els.length == count;
      })
    );
    return this.run(
      () => this.dvr.wait(cond, getTimeout()),
      msg,
      `Selector: '${selector}'`,
      () => breadcrumbs
    );
  }

  /**
   * Waits until no elements in DOM.
   */
  noElements(selector, msg) {
    assert(selector, `noElements: no selector`);
    assert(msg, `noElements: no msg`);
    return this.elementsCount(selector, 0, msg);
  }

  /**
   * Waits until no elements in DOM or no elements is visible.
   */
  noElementsOrNotVisible(selector, msg) {
    assert(selector, `noElementsOrNotVisible: no selector`);
    assert(msg, `noElementsOrNotVisible: no msg`);

    let breadcrumbs = '';
    let cond = new Condition(`until no elements or not visible`, async () => {
      let els = await this.dvr.findElements(By.css(selector));
      breadcrumbs = `Got elements count: ${els.length}, expected 0`;
      if (els.length == 0) {
        return true;
      }
      let isDisplayedArray = await Promise.all(
        Array.from(els).map(el => el.isDisplayed())
      );
      breadcrumbs = `Got elements count: ${
        els.length
      }, elements visibility [${isDisplayedArray.join(
        ' ,'
      )}], expected: not visible`;
      return isDisplayedArray.every(isDisplayed => !isDisplayed);
    });

    return this.run(
      () => this.waitForCondition(cond, () => breadcrumbs),
      msg,
      `Selector: '${selector}'`,
      () => breadcrumbs
    );
  }

  /**
   * Waits until elements count is not zero.
   */
  hasElements(selector, msg) {
    assert(selector, `hasElements: no selector`);
    assert(msg, `hasElements: no msg`);

    let cond = new Condition(`until element count`, () =>
      this.dvr.findElements(By.css(selector)).then(els => els.length > 0)
    );
    return this.run(() => this.dvr.wait(cond, getTimeout()), msg);
  }

  /**
   * Waits until an element defined by a selector is hidden.
   */
  elementHidden(selector, msg) {
    assert(selector, `elementHidden: no selector`);
    assert(msg, `elementHidden: no msg`);

    return this.waitForElementToInvoke(
      selector,
      el => this.dvr.wait(until.elementIsNotVisible(el), getTimeout()),
      msg
    );
  }

  /**
   * Waits until an element defined by a selector is visible.
   */
  elementVisible(selector, msg) {
    assert(selector, `elementVisible: no selector`);
    assert(msg, `elementVisible: no msg`);

    return this.waitForElementToInvoke(
      selector,
      el => this.dvr.wait(until.elementIsVisible(el), getTimeout()),
      msg
    );
  }

  /**
   * Waits until an element defined by a selector is not visible.
   */
  elementNotVisible(selector, msg) {
    assert(selector, `elementNotVisible: no selector`);
    assert(msg, `elementNotVisible: no msg`);

    return this.waitForElementToInvoke(
      selector,
      el => this.dvr.wait(until.elementIsNotVisible(el), getTimeout()),
      msg
    );
  }

  /**
   * Waits for a text within an element defined by a selector.
   */
  elementFocused(selector, msg) {
    assert(selector, `elementFocused: no selector`);
    assert(msg, `elementFocused: no msg`);

    return this.waitForElementToInvoke(
      selector,
      el =>
        this.dvr.wait(
          new Condition('until element is focused', () =>
            this.dvr
              .switchTo()
              .activeElement()
              .then(activeEl =>
                Promise.all([activeEl.getId(), el.getId()]).then(
                  ids => ids[0] == ids[1]
                )
              )
          ),
          getTimeout()
        ),
      msg,
      () =>
        this.dvr
          .switchTo()
          .activeElement()
          .getTagName()
          .then(tag => `Active element: ${tag}`)
    );
  }
}

module.exports.Driver = Driver;
