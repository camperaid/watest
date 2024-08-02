'use strict';

const esc_char = ''; // \x1b

const colors = {
  group: '36',
  intermittent: '35',
  failure: '31',
  ok: '32',
  todo: '33',
  warning: '33',

  started: '38;5;99',
  completed: '38;5;243',
  intermittents: '105',
  todos: '103',
  warnings: '103',
  failures: `41m${esc_char}[37`,
  success: '102',
};

const codes = new Map(
  Array.from(Object.keys(colors)).map(key => [colors[key], key])
);

// Colorifies the message.
function colorify(color, label, msg) {
  return `${esc_char}[${colors[color]}m${label}${esc_char}[0m ${msg}`;
}

// Parses the given message.
function parse(str) {
  // eslint-disable-next-line no-control-regex
  const re = /^\x1b\[([0-9;]+(?:m\x1b\[\d+)?)m(.+?)\x1b\[0m(.+)?$/;
  const m = str.match(re);
  if (!m) {
    return {};
  }
  const [, code, label, msg] = m;
  return {
    color: codes.get(code),
    label,
    msg: msg.trim(),
  };
}

function parse_failure(str) {
  let { label, msg } = parse(str);
  if (label.startsWith('>')) {
    return {
      name: label.substring(1),
      count: msg.replace(/.*(\d+).*/, (match, p) => p),
    };
  }
  return null;
}

function format_started(msg) {
  return colorify('started', 'Started', msg);
}

function format_completed(msg) {
  return colorify('completed', 'Completed', msg);
}

function format_intermittent(msg) {
  return colorify('intermittent', 'Intermittent:', msg);
}

function format_intermittents(count, context) {
  let label = context ? `${context} > intermittents` : 'Intermittents';
  return colorify('intermittents', label, `Total: ${count}`);
}

function format_failure(msg, label) {
  return colorify('failure', label || 'Failed:', msg);
}

function format_failures(count, context_or_okcount, context) {
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
}

function format_ok(msg) {
  return colorify('ok', 'Ok:', msg);
}

function format_success(okcount, context) {
  return colorify('success', context || 'Success!', `Total: ${okcount}`);
}

function format_todo(msg) {
  return colorify('todo', 'Todo:', msg);
}

function format_todos(count, context) {
  let label = context ? `${context} > todos` : 'Todos';
  return colorify('todos', label, `Total: ${count}`);
}

function format_warning(msg) {
  return colorify('warning', 'Warning:', msg);
}

function format_warnings(count, context) {
  let label = context ? `${context} > warnings` : 'Warnings';
  return colorify('warnings', label, `Total: ${count}`);
}

// Node v20 wraps stderr by '\[31m' and '\[39m' characters.
function stderr_wrap(s) {
  return `[31m${s}[39m`;
}

function stderr_unwrap(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\[31m(.*?)\[39m(\n?)/gs, '$1$2');
}

function stderr_format_failure(...args) {
  return stderr_wrap(format_failure(...args));
}

module.exports = {
  colorify,
  parse,
  parse_failure,

  format_started,
  format_completed,
  format_intermittent,
  format_intermittents,
  format_failure,
  format_failures,
  format_ok,
  format_success,
  format_todo,
  format_todos,
  format_warning,
  format_warnings,
  stderr_wrap,
  stderr_unwrap,
  stderr_format_failure,
};
