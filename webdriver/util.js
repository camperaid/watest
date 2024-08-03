import { assert } from '../core/core.js';

/**
 * Defines a forward-proxy promise for a given class. For a class T
 * the TPromise class is created.
 */
export function define_class_promise(
  T,
  Resolvent = (v, ...args) => new T(...args, v),
) {
  return class extends T {
    constructor(p, ...args) {
      assert(p, 'No promise for promise class');
      super(...args);
      this.p = p;
      this.args = [...args];
    }

    then(resolve, reject) {
      return new this.constructor(
        this.p
          .then(v => resolve(Resolvent(v, ...this.args)))
          .catch(e => {
            if (reject) {
              return reject(e);
            }
            throw e;
          }),
        ...this.args,
      );
    }

    catch(reject) {
      return new this.constructor(this.p.catch(reject), ...this.args);
    }
  };
}
