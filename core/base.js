'use strict';

const core = require('./core.js');
const { success, fail, failed } = core;
const { format_failure } = require('./format.js');

const { stringify } = require('./util.js');

const limit = 100;

function dummy() {
  // do nothing
}

/**
 * Reports success of failure depending on given value.
 */
function ok(check, msg) {
  if (check) {
    success(msg);
    return true;
  }
  fail(msg);
  return false;
}

/**
 * Returns true or false depending on whether |got| matches |expected|.
 */
function test_is(got, expected, options = {}) {
  return is(
    got,
    expected,
    'blank',
    Object.assign(options, {
      fail_: dummy,
      success_: dummy,
    })
  );
}

/**
 * Returns true of false depending on whether |got| contains |expected|.
 */
function test_contains(got, expected, options = {}) {
  return contains(
    got,
    expected,
    'blank',
    Object.assign(options, {
      fail_: dummy,
      success_: dummy,
    })
  );
}

/**
 * Reports success or failure depending on whether |got| matches |expected|.
 */
function is(...args) {
  return is_object(...args);
}

/**
 * Reports success of failure depending on whether |got| contains |expected|.
 */
function contains(
  got,
  expected,
  msg,
  { ignore_unexpected, fail_ = fail, success_ = success } = {}
) {
  if (typeof got == 'string' || typeof expected == 'string') {
    if (typeof got != 'string') {
      fail_(`${msg}, expected string, got object: []`);
      return false;
    }
    if (typeof expected != 'string') {
      fail_(
        `${msg}, got string, expected ${typeof expected}: ${stringify(
          expected
        )}`
      );
      return false;
    }
    if (got.includes(expected)) {
      success_(`${msg}, got: ${stringify(got)}`);
      return true;
    }
    fail_(
      `${msg}, got string doesn't contain expected string, got: ${stringify(
        got
      )}, expected: ${stringify(expected)}`
    );
    return false;
  }

  if (!(expected instanceof Array)) {
    fail_(
      `${msg}, expected value is not array, expected: ${stringify(expected)}`
    );
    return false;
  }

  if (!(got instanceof Array)) {
    fail_(`${msg}, not array, got: ${stringify(got)}`);
    return false;
  }

  if (got.length < expected.length) {
    fail_(
      `${msg}, array is lesser than expected, ${got.length} vs ${expected.length}`
    );
    return false;
  }

  for (let e of expected) {
    if (
      !got.find(g =>
        test_is(g, e, {
          ignore_unexpected,
        })
      )
    ) {
      fail_(`${msg}, array has no expected item ${stringify(e)}`);
      return false;
    }
  }

  success_(`${msg}, got: ${stringify(got)}`);
  return true;
}

function is_string(
  got,
  expected,
  msg,
  { fail_ = fail, success_ = success } = {}
) {
  // Different types.
  if (typeof got != 'string' || typeof expected != 'string') {
    fail_(
      `${msg} type mismatch, ` +
        `got type: ${typeof got}, expected type: ${typeof expected}, ` +
        `got value: ${stringify(got)}, expected value: ${stringify(expected)}`
    );
    return false;
  }

  // Report unmatched characters.
  for (let i = 0; i < got.length; i++) {
    if (got.charAt(i) != expected.charAt(i)) {
      let l_start = got.lastIndexOf('\n', i - 1);
      let l_end = got.indexOf('\n', i);
      let line = got.substring(l_start + 1, l_end);
      fail_(
        `${msg};\ngot:\n${got}\nexpected:\n${expected}\n` +
          `unexpected character: '${got.charAt(i)}' at ${i} pos, ` +
          `expected: '${expected.charAt(i)}' at '${line}' line`
      );
      return false;
    }
  }

  // Strings are equal.
  if (got.length == expected.length) {
    success_(`${msg}, got: ${got}`);
    return true;
  }

  // Expected longer string.
  let got_str = `got: '${got}' of ${got.length} chars`;
  let expected_str = `expected: '${expected}' of ${expected.length} chars`;
  let diff_str = `diff: '${expected.substring(got.length)}'`;
  fail_(
    `${msg}, string longer than expected, ${got_str}, ${expected_str}, ${diff_str}`
  );
  return false;
}

function is_primitive(
  got,
  expected,
  msg,
  { enrich_failure_msg, fail_ = fail, success_ = success } = {}
) {
  const enrichmsg = (enrich_failure_msg && `${msg} value mismatch`) || msg;

  // Overlimit got: keep it small to not pollute output.
  let printable_got =
    String(got).length > limit ? `${String(got).substring(0, limit)}…` : got;
  if (typeof got == 'string') {
    printable_got = `'${printable_got}'`;
  }

  // If expected is a function, then it tests 'got' value itself.
  if (typeof expected == 'function') {
    let isok = expected(got);
    if (isok) {
      success_(`${msg}, got: ${printable_got}`);
      return true;
    }
    fail_(
      `${enrichmsg}, got: ${printable_got}, expected: ${expected.toString()}`
    );
    return false;
  }

  // String types.
  if (typeof got == 'string') {
    if (expected instanceof RegExp) {
      if (expected.test(got)) {
        success_(`${enrichmsg} ${printable_got} matches ${expected} regexp`);
        return true;
      }
      fail_(`${enrichmsg} ${printable_got} doesn't match ${expected} regexp`);
      return false;
    }
    return is_string(got, expected, enrichmsg, {
      fail_,
      success_,
    });
  }

  // If |got| and |expected| have different types.
  if (typeof got != typeof expected) {
    fail_(
      `${msg} type mismatch, ` +
        `got type: ${typeof got}, expected type: ${typeof expected}, ` +
        `got value: ${stringify(got)}, expected value: ${stringify(expected)}`
    );
    return false;
  }

  // Equals.
  if (got == expected) {
    success_(`${msg}, got: ${printable_got}`);
    return true;
  }

  fail_(`${enrichmsg}, got: ${printable_got}, expected: ${expected}`);
  return false;
}

function is_object(
  got,
  expected,
  msg,
  {
    ignore_unexpected,
    do_not_print_got_on_success,
    fail_ = fail,
    success_ = success,
  } = {}
) {
  // Primitive values.
  if (!(got instanceof Object)) {
    return is_primitive(got, expected, msg, {
      fail_,
      success_,
    });
  }

  let isok = is_object_impl(got, expected, `${msg}:`, '', {
    ignore_unexpected,
    fail_,
    success_,
  });
  if (isok) {
    do_not_print_got_on_success
      ? success_(msg)
      : success_(`${msg}, got: ${stringify(got)}`);
    return true;
  }
  fail_(msg);
  return false;
}

// eslint-disable-next-line complexity
function is_object_impl(
  got,
  expected,
  msg,
  fieldpath,
  { ignore_unexpected, fail_, success_ }
) {
  const contextmsg = `${msg}${(fieldpath && ` '${fieldpath}' field`) || ''}`;

  // Primitive values
  if (!(got instanceof Object)) {
    return is_primitive(got, expected, contextmsg, {
      enrich_failure_msg: true,
      fail_,
      success_: dummy, // suppress success message
    });
  }

  // Function check.
  if (typeof expected == 'function') {
    if (expected(got)) {
      return true;
    }
    let got_str = stringify(got);
    let expected_str = `expected: ${stringify(expected)}`;
    fail_(`${contextmsg} unexpected value: ${got_str}, ${expected_str}`);
    return false;
  }

  // If |got| and |expected| are of different classes, note: |expected| is
  // allowed to be an Object or in case of Set and Map it can be an Array.
  if (
    got instanceof Object &&
    !(expected instanceof got.constructor) &&
    (!expected ||
      (expected.constructor != Object &&
        (expected.constructor != Array ||
          !(got instanceof Set || got instanceof Map))))
  ) {
    fail_(
      `${contextmsg} class mismatch, got: ${got.constructor.name}, ` +
        `expected: ${(expected && expected.constructor.name) || expected}`
    );
    return false;
  }

  // Convert Set and Map to Arrays.
  if (got instanceof Set) {
    got = Array.from(got.values());
  } else if (got instanceof Map) {
    got = Array.from(got.entries());
  }

  // Arrays.
  if (got instanceof Array && expected instanceof Array) {
    if (got.length != expected.length) {
      fail_(
        `${contextmsg} array length mismatch, got: ${got.length}, expected: ${
          expected.length
        }.
Got: ${stringify(got)}
Expected: ${stringify(expected)}`
      );
      return false;
    }
  }

  // Object properties.
  let isok = true;
  if (!ignore_unexpected) {
    for (let field in got) {
      if (!(field in expected)) {
        let fpath = (fieldpath && `${fieldpath}->${field}`) || field;
        fail_(
          `${msg} '${fpath}' field was not expected, got: ${stringify(
            got[field]
          )}`
        );
        isok = false;
      }
    }
  }

  for (let field in expected) {
    let fpath = (fieldpath && `${fieldpath}->${field}`) || field;
    if (field in got) {
      isok =
        is_object_impl(got[field], expected[field], msg, fpath, {
          ignore_unexpected,
          enrich_failure_msg: true,
          fail_,
          success_,
        }) && isok;
    } else {
      fail_(`${msg} '${fpath}' field was expected but not present`);
      isok = false;
    }
  }

  return isok;
}

/**
 * Tests whether |func| produces the given stdout/stderr output.
 */
async function is_output(func, out, err, msg) {
  const { stdout, stderr } = await capture_output(func);
  let stdout_matched =
    out instanceof Function
      ? out(stdout, `${msg}: unexpected stdout`)
      : is_out(stdout, out, `${msg}: unexpected stdout`);

  let stderr_matched =
    err instanceof Function
      ? err(stderr, `${msg}: unexpected stderr`)
      : is_out(stderr, err, `${msg}: unexpected stderr`);

  return { stdout, stdout_matched, stderr, stderr_matched };
}

/**
 * Tests whether |func| produces the test output.
 */
async function is_test_output(func, out, err, msg) {
  let { stdout, stdout_matched, stderr, stderr_matched } = await is_output(
    func,
    out.map(expected => got => got.trim().startsWith(expected)),
    err.map(expected => got => got.trim().startsWith(expected)),
    msg
  );

  if (!stdout_matched || !stderr_matched) {
    let formatted = format_test_output({ stdout, stderr });
    if (!stdout_matched) {
      console.log(`Test ready stdout for '${msg}':`);
      console.log(formatted.stdout);
    }
    if (!stderr_matched) {
      console.log(`Test ready stderr for '${msg}':`);
      console.log(formatted.stderr);
    }
  }
}

/**
 * Captures stdout and stderr prodcued by a function.
 */
async function capture_output(func) {
  const stdoutWrite = process.stdout.write;
  const stderrWrite = process.stderr.write;

  let stdout = [];
  let stderr = [];

  process.stdout.write = (...args) => stdout.push(args[0]);
  process.stderr.write = (...args) => stderr.push(args[0]);

  let expection = null;
  try {
    await func();
  } catch (e) {
    expection = e;
  }

  process.stdout.write = stdoutWrite;
  process.stderr.write = stderrWrite;

  if (expection) {
    fail(expection);
  }

  return {
    stdout,
    stderr,
  };
}

/**
 * Captures stdout and stderr prodcued by a function for a testing.
 */
async function capture_test_output(func) {
  return format_test_output(await capture_output(func));
}

function format_test_output({ stdout, stderr }) {
  return {
    stdout: stdout.map(l => {
      const shorties = [
        /(Logs are written to).+/,
        /(Elapsed:).+/,
        /(.+ completed in).+/,
      ];
      for (let shorty of shorties) {
        l = l.replace(shorty, (match, p) => p);
      }
      return l.trim();
    }),
    stderr: stderr.map(l => {
      if (l.endsWith('\n')) {
        l = l.slice(0, -1);
      }
      return l.trim();
    }),
  };
}

function is_out(got, expected, msg) {
  expected = expected.map(line => {
    if (!(line instanceof Function)) {
      line = line.replace(/^Ok:/, '[32mOk:[0m');
      line = line.replace(/^Failed:/, '[31mFailed:[0m');
      line = line.replace(/^Action:/, '[36mAction:[0m');
      if (!line.endsWith('\n')) {
        line += '\n';
      }
    }
    return line;
  });

  // Do not print |got| on success because tests for failing tests are
  // recognized as failed by testherd.
  if (is_object(got, expected, msg, { do_not_print_got_on_success: true })) {
    return true;
  }

  for (let i = 0; i < Math.min(got.length, expected.length); i++) {
    let got_i = got[i];
    let exp_i = expected[i];

    if (typeof exp_i == 'function') {
      if (!exp_i(got_i)) {
        console.error(
          format_failure(
            `got: ${stringify(got_i)}, expected: ${exp_i}`,
            `Unexpected output at index ${i},`
          )
        );
      }
      continue;
    }

    if (got_i == exp_i) {
      continue;
    }

    console.error(
      format_failure(
        `got: ${stringify(got_i)}, expected: ${exp_i}, got len: ${
          got_i.length
        }, expected len: ${exp_i.length}`,
        `Unexpected output at index ${i},`
      )
    );
    console.error(
      `index\tgot\texpected\tequal ${Math.min(got_i.length, exp_i.length)}`
    );

    let min = Math.min(got_i.length, exp_i.length);
    for (let j = 0; j < min; j++) {
      console.error(
        `${j}\t'${got_i[j]}'\t'${exp_i[j]}'\t${exp_i[j] == got_i[j]}`
      );
    }

    for (let j = min; j < got_i.length; j++) {
      console.error(`${j}\t'${got_i[j]}'`);
    }

    for (let j = min; j < exp_i.length; j++) {
      console.error(`${j}\t\t'${exp_i[j]}'`);
    }
  }
  return false;
}

module.exports = {
  success,
  fail,
  failed,

  ok,
  is,
  contains,
  is_output,
  is_test_output,
  is_object,
  is_primitive,
  is_string,

  test_is,
  test_contains,

  capture_output,
  capture_test_output,
  format_test_output,
};
