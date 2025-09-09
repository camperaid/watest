import { log, log_error, log_trace } from '../logging/logging.js';
import {
  format_failure,
  format_intermittent,
  format_ok,
  format_warning,
  colorify,
} from './format.js';
import { inspect, initTmpStorage } from './util.js';

/**
 * Tracks testing flow, all the failures, intermittents, successes etc.
 */
class Core {
  constructor(timeout) {
    this.kcnt = 0;
    this.fcnt = 0;
    this.todocnt = 0;
    this.intermittentcnt = 0;
    this.warningcnt = 0;

    this.timeout = timeout ?? 0;

    // Current group.
    this.currgroup = null;

    this.expectedFailures = [];
  }

  info(msg) {
    log(`Info: ${msg}`);
  }

  assert(cond, msg) {
    if (!cond) {
      log_trace(msg);
      this.fail(msg);
    }
  }

  not_reached(msg) {
    log_trace(msg);
    this.fail(msg);
  }

  group(msg, label) {
    this.currgroup = msg;
    label = label || 'Group';
    log(colorify('group', `${label}:`, msg));
  }

  success(msg) {
    log(format_ok(msg));
    this.kcnt++;
  }

  fail(msg) {
    if (typeof msg == 'object') {
      inspect(msg);
      this.unconditional_fail('Unexpected exception');
      return;
    }

    for (let v of this.expectedFailures) {
      if (v.group == '*' || v.group == this.currgroup) {
        let f = v.list.find(f => f[1] == 0 || f[0] == '*');
        if (f && (f[0] == '*' || msg.includes(f[0]))) {
          f[1]++;
          this.warn(msg);

          // If this is the last failure in the sequence, then report the failing
          // group as todo or intermittent depending on failure group type.
          if (f == v.list[v.list.length - 1]) {
            let groupmsg = v.msg || v.group;
            v.type == 'perma'
              ? this.todo(groupmsg)
              : this.intermittent(groupmsg);
          }
          return;
        }
      }
    }

    this.unconditional_fail(msg);
  }

  unconditional_fail(msg) {
    log_error(format_failure(msg));
    this.fcnt++;
  }

  intermittent(msg) {
    log(format_intermittent(msg));
    this.intermittentcnt++;
  }

  todo(msg) {
    log(colorify('todo', 'Todo:', msg));
    this.todocnt++;
  }

  warn(msg) {
    log(format_warning(msg));
    this.warningcnt++;
  }

  get failureCount() {
    return this.fcnt;
  }
  set failureCount(v) {
    this.fcnt = v;
  }
  get okCount() {
    return this.kcnt;
  }
  set okCount(v) {
    this.kcnt = v;
  }
  get todoCount() {
    return this.todocnt;
  }
  set todoCount(v) {
    this.todocnt = v;
  }
  get intermittentCount() {
    return this.intermittentcnt;
  }
  set intermittentCount(v) {
    this.intermittentcnt = v;
  }
  get warningCount() {
    return this.warningcnt;
  }
  set warningCount(v) {
    this.warningcnt = v;
  }
  failed() {
    return this.fcnt > 0;
  }

  failIfExpectedFailurePass() {
    let has_expected_failure = this.expectedFailures.some(f =>
      f.list.every(li => li[1] > 0),
    );
    if (!has_expected_failure) {
      for (let f of this.expectedFailures) {
        if (f.type == 'perma') {
          let mf = f.list.find(f => f[1] == 0);
          if (mf) {
            this.unconditional_fail(
              `Perma failure '${mf[0]}' has never been hit`,
            );
          }
        }
      }
    }
    this.expectedFailures = [];
  }

  setExpectedFailures(failures) {
    this.expectedFailures = failures.map(v => ({
      group: v.group,
      type: v.type,
      list: (v.list || []).map(f => [f, 0]),
      msg: v.msg,
    }));
  }

  /**
   * Clears stats to re-run the tests.
   */
  clearStats() {
    this.fcnt = 0;
    this.kcnt = 0;
    this.todocnt = 0;
    this.intermittentcnt = 0;
    this.warningcnt = 0;

    // Reset temporary storage folder if needed.
    initTmpStorage();
  }

  setTimeout(v) {
    return (this.timeout = v);
  }

  getTimeout() {
    // If the current group is expected to fail and this is a permanent failure,
    // and the caller didn't override timeout then fail the test quickly.
    if (
      !this.timeout &&
      this.expectedFailures.find(
        v => v.group == this.currgroup && v.type == 'perma',
      )
    ) {
      return 1;
    }
    return this.timeout;
  }
}

let primeCore = new Core();

// Stack-based context management for nested operations
const contextStack = [];

function getCurrentContext() {
  return contextStack.length > 0
    ? contextStack[contextStack.length - 1]
    : { core: primeCore, series: null };
}

export { Core };

export const testflow = {
  lock({ core, timeout, series } = {}) {
    const newCore = core || new Core(timeout);
    contextStack.push({
      core: newCore,
      series,
    });
  },

  unlock() {
    if (contextStack.length > 0) {
      contextStack.pop();
    }
    // Always maintain at least one context (the prime core)
  },

  get core() {
    return getCurrentContext().core;
  },

  get series() {
    return getCurrentContext().series;
  },

  // Debug helper to see stack depth
  get stackDepth() {
    return contextStack.length;
  },
};

export const assert = (...args) => testflow.core.assert(...args);
export const info = (...args) => testflow.core.info(...args);
export const not_reached = (...args) => testflow.core.not_reached(...args);
export const group = (...args) => testflow.core.group(...args);
export const fail = (...args) => testflow.core.fail(...args);
export const todo = (...args) => testflow.core.todo(...args);
export const warn = (...args) => testflow.core.warn(...args);
export const success = (...args) => testflow.core.success(...args);
export const failed = () => testflow.core.failed();
export const getServicer = () => testflow.series?.getServicer();
