'use strict';

const { log, log_error, log_trace } = require('../logging/logging.js');
const {
  format_failure,
  format_intermittent,
  format_ok,
  format_warning,
  colorify,
} = require('./format.js');
const { inspect, initTmpStorage } = require('./util.js');

/**
 * Tracks testing flow, all the failures, intermittents, successes etc.
 */
class Core {
  constructor() {
    this.kcnt = 0;
    this.fcnt = 0;
    this.todocnt = 0;
    this.intermittentcnt = 0;
    this.warningcnt = 0;

    this.timeout = 0;

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
    const m = msg;
    for (let v of this.expectedFailures) {
      if (v.group == '*' || v.group == this.currgroup) {
        let f = v.list.find(f => f[1] == 0 || f[0] == '*');
        if (f && (f[0] == '*' || m.includes(f[0]))) {
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

    if (typeof msg == 'object') {
      inspect(msg);
      msg = 'Unexpected exception';
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
      f.list.every(li => li[1] > 0)
    );
    if (!has_expected_failure) {
      for (let f of this.expectedFailures) {
        if (f.type == 'perma') {
          let mf = f.list.find(f => f[1] == 0);
          if (mf) {
            this.unconditional_fail(
              `Perma failure '${mf[0]}' has never been hit`
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
        v => v.group == this.currgroup && v.type == 'perma'
      )
    ) {
      return 1;
    }
    return this.timeout;
  }
}

let primeCore = new Core();
let currentCore = primeCore;

module.exports = {
  Core,

  info(...args) {
    return currentCore.info(...args);
  },
  assert(...args) {
    return currentCore.assert(...args);
  },
  not_reached(...args) {
    return currentCore.not_reached(...args);
  },
  group(...args) {
    return currentCore.group(...args);
  },
  fail(...args) {
    return currentCore.fail(...args);
  },
  todo(...args) {
    return currentCore.todo(...args);
  },
  warn(...args) {
    return currentCore.warn(...args);
  },
  success(...args) {
    return currentCore.success(...args);
  },
  failed() {
    return currentCore.failed();
  },

  get core() {
    return currentCore;
  },
  lock(core) {
    currentCore = core || new Core();
  },
  unlock() {
    currentCore = primeCore;
  },
};
