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
let currentCore = primeCore;

export { Core };

export const testflow = {
  lock({ core, timeout } = {}) {
    currentCore = core || new Core(timeout);
  },
  unlock() {
    currentCore = primeCore;
  },
  get core() {
    return currentCore;
  },
};

export const assert = (...args) => currentCore.assert(...args);
export const info = (...args) => currentCore.info(...args);
export const not_reached = (...args) => currentCore.not_reached(...args);
export const group = (...args) => currentCore.group(...args);
export const fail = (...args) => currentCore.fail(...args);
export const todo = (...args) => currentCore.todo(...args);
export const warn = (...args) => currentCore.warn(...args);
export const success = (...args) => currentCore.success(...args);
export const failed = () => currentCore.failed();
