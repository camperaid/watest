'use strict';

const { assert } = require('../core/core.js');
const { AppDriver } = require('./app_driver.js');

/**
 * Control driver base.
 */
class ControlDriver extends AppDriver {
  static get(session, selector, p) {
    assert(selector, `No selector for ${this.name}`);
    return this._get(
      {
        session,
        selector,
      },
      p
    );
  }

  get Self() {
    return this.selector;
  }
}

module.exports = {
  ControlDriver,
};
