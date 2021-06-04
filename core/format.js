'use strict';

const colors = {
  group: '36',
  intermittent: '35',
  failure: '31',
  ok: '32',
  todo: '33',
  warning: '33',

  completed: '38;5;243',
  intermittents: '105',
  todos: '103',
  warnings: '103',
  failures: '41m\x1b[37',
  success: '102',
};

function colorify(color, label, msg) {
  return `\x1b[${colors[color]}m${label}\x1b[0m ${msg}`;
}

module.exports = {
  colorify,

  format_completed(msg) {
    return colorify('completed', 'Completed', msg);
  },
  format_intermittent(msg) {
    return colorify('intermittent', 'Intermittent:', msg);
  },
  format_intermittents(count, context) {
    let label = context ? `${context} > intermittents` : 'Intermittents';
    return colorify('intermittents', label, `Total: ${count}`);
  },
  format_failure(msg, label) {
    return colorify('failure', label || 'Failed:', msg);
  },
  format_failures(count, context_or_okcount, context) {
    if (typeof context_or_okcount == 'string') {
      return colorify(
        'failures',
        `>${context_or_okcount}`,
        `Failure count: ${count}`
      );
    }
    let label = !context ? 'Failed!' : `${context} > failed`;
    return colorify(
      'failures',
      label,
      `Passed: ${context_or_okcount}. Failed: ${count}`
    );
  },
  format_ok(msg) {
    return colorify('ok', 'Ok:', msg);
  },
  format_success(okcount, context) {
    return colorify('success', context || 'Success!', `Total: ${okcount}`);
  },
  format_todo(msg) {
    return colorify('todo', 'Todo:', msg);
  },
  format_todos(count, context) {
    let label = context ? `${context} > todos` : 'Todos';
    return colorify('todos', label, `Total: ${count}`);
  },
  format_warning(msg) {
    return colorify('warning', 'Warning:', msg);
  },
  format_warnings(count, context) {
    let label = context ? `${context} > warnings` : 'Warnings';
    return colorify('warnings', label, `Total: ${count}`);
  },
};
