'use strict';

/**
 * Logging hook interface. Allows to connect logging servers to the testsuite.
 */
class Logger {
  /**
   * Called when tests start,
   */
  testRunStarted(/* { run, invocation } */) {
    return Promise.resolve();
  }

  /**
   * Writes a log file.
   */
  writeLogFile(/* { run, invocation, name, zip, content } */) {
    return Promise.resolve();
  }

  /**
   * Writes a source map.
   */
  writeSourceMap(/* { run, invocation } */) {
    return Promise.resolve();
  }
}

module.exports = new Logger();
