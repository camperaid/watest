import { testflow } from '../../core/core.js';
import { is_output as is_output_base } from '../../core/base.js';

export * from '../../core/base.js';
export * from '../../core/core.js';
export * from '../../core/format.js';

function is_output(func, out, err, msg) {
  return is_output_base(
    () => {
      testflow.lock();
      func();
      testflow.unlock();
    },
    out,
    err,
    msg,
  );
}

export { is_output };
