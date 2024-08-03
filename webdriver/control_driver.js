import { assert } from '../core/core.js';
import { AppDriver } from './app_driver.js';

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
      p,
    );
  }

  get uiname() {
    return `${super.uiname}@selector='${this.Self}'`;
  }

  get Self() {
    return this.selector;
  }
}

export { ControlDriver };
