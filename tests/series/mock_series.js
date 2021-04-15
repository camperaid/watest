'use strict';

const path = require('path');

const { Core } = require('../../core/core.js');
const { LogPipe } = require('../../logging/logpipe.js');
const { Series } = require('../../core/series.js');

/**
 * Mock file stream constructor, writes to a string buffer.
 */
const getMockFileStreamCtor = () =>
  class MockFileStream {
    constructor(dir, fname) {
      this.buf = '';
      this.filepath = path.join(dir, fname);

      if (!this.constructor.mockstreams) {
        this.constructor.mockstreams = new Map();
      }
      this.constructor.mockstreams.set(this.filepath, this);
    }

    write(chunk) {
      this.buf += chunk.toString();
      return this;
    }

    end() {
      return Promise.resolve();
    }

    on() {}

    readFile() {
      return this.buf;
    }

    static getLoggingBuffers() {
      return Array.from(this.mockstreams.entries()).map(([fp, fs]) => [
        fp.replace(/^\/tmp\/\d+\//, ''),
        fs.buf.split('\n').filter(l => l),
      ]);
    }
  };

/**
 * LogPipe with mock FileStream attached.
 */
class LogPipeMockFileStream {
  constructor() {
    this.MockFileStream = getMockFileStreamCtor();
  }
  attach(...args) {
    return LogPipe.attach(...args, this.MockFileStream);
  }
  release() {
    return LogPipe.release();
  }
  logToFile(...args) {
    return LogPipe.logToFile(...args);
  }
  suppressStdStreams() {
    LogPipe.suppressStdStreams();
  }
  restoreStdStreams() {
    LogPipe.restoreStdStreams();
  }
}

/**
 * Mock Series which emulates tests file structure.
 */
class MockSeries extends Series {
  constructor(patterns, options) {
    super(
      patterns,
      Object.assign(
        {
          core: new Core(),
        },
        options
      )
    );
    this.ts = options.ts;
  }

  loadTestMeta(folder) {
    console.assert(folder in this.ts, `No ${folder} folder found`);
    return this.ts[folder].meta || {};
  }

  loadTest(fn) {
    return this.ts[fn];
  }

  getTestFileList(folder) {
    console.assert(folder in this.ts, `No ${folder} folder found`);
    return this.ts[folder].files || [];
  }
}

module.exports = {
  MockSeries,
  LogPipeMockFileStream,
};
