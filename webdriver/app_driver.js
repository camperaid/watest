'use strict';

const { define_class_promise } = require('./util.js');
const { assert } = require('../core/core.js');

/**
 * A bass class used to create chainable application drivers.
 */
class AppDriver {
  static get(session, p) {
    return this._get({ session }, p);
  }

  static _get(properties, p) {
    return new this.CtorPromise(p || Promise.resolve(), properties).onget();
  }

  constructor(properties) {
    assert('session' in properties, `No session given`);

    this.properties = properties;
    this.p = Promise.resolve();

    for (let name in properties) {
      this[name] = properties[name];
    }

    let selectors = this.getSelectors();
    if (selectors) {
      this.defineSelectors(this, selectors);
    }
  }

  /**
   * A callback will be called on construction of a new instance.
   */
  onget() {
    return this.chain(() =>
      this.action(`Get ${this.uiname}`).elementVisible(
        this.Self,
        `${this.uiname} is shown`
      )
    );
  }

  getSelectors() {
    // Override to define selectors.
  }

  action(...args) {
    return this.session.action(...args);
  }

  isMobile() {
    return this.session.isMobile();
  }

  isSafari() {
    return this.session.isSafari();
  }

  get driver() {
    return this.session.driver;
  }

  chain(link, properties) {
    assert(typeof link == 'function', `Only function can be chained`);
    return new this.constructor.CtorPromise(
      this.p.then(link),
      Object.assign({}, this.properties, properties || {})
    );
  }

  type(selector, value, field) {
    return this.chain(() =>
      this.action(`${this.uiname}.type into ${field}`)
        .sendKeys(selector, value, `Type into ${field}`)
        .textIs(selector, value, `Check ${field} text`)
    );
  }

  setValue(selector, value, field) {
    return this.chain(() =>
      this.action(`${this.uiname}.setValue for ${field}`)
        .setValue(selector, value, `Set value property for ${field}`)
        .textIs(selector, value, `Check ${field} text`)
    );
  }

  check(selector, field) {
    return this.chain(() =>
      this.action(`${this.uiname}.check ${field}`)
        .click(selector, `Click at ${field}`)
        .hasElements(`${selector}:checked`, `${field} should be checked`)
    );
  }

  uncheck(selector, field) {
    return this.chain(() =>
      this.action(`${this.constructor.name}.uncheck ${field}`)
        .click(selector, `Click at ${field}`)
        .hasElements(
          `${selector}:not(:checked)`,
          `${field} should be unchecked`
        )
    );
  }

  // Returns a name for the tested class. Typically the name convension for
  // UI drivers is a test class name postixed by Driver.
  get uiname() {
    return this.constructor.name.replace(/Driver$/, '');
  }

  defineSelectors(context, selectors) {
    if (selectors.Self) {
      this.defineSelector(context, 'Self', selectors.Self);
    }

    for (let name in selectors) {
      if (name != 'Self') {
        this.defineSelector(context, name, selectors[name]);
      }
    }
  }

  defineSelector(context, propname, selector) {
    if (typeof selector == 'string') {
      let value = selector;
      if (propname == 'Self') {
        if (context.Parent) {
          value = `${context.Parent} ${value}`;
        }
      } else if (context.Self) {
        value = `${context.Self} ${value}`;
      }
      Object.defineProperty(context, propname, {
        value,
      });
      return;
    }

    let value = {
      Parent: context.Self,
    };
    Object.defineProperty(context, propname, {
      value,
    });
    this.defineSelectors(value, selector);
  }

  static get CtorPromise() {
    if (!this._CtorPromise) {
      this._CtorPromise = define_class_promise(this);
    }
    return this._CtorPromise;
  }
}

module.exports = {
  AppDriver,
};
