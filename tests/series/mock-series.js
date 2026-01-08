import path from 'path';
import { Core } from '../../core/core.js';
import { LogPipe } from '../../logging/logpipe.js';
import { Series } from '../../core/series.js';

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
 * Note: it cannot be inherited from LogPipe, because of
 * LogPipe::attachToStdStreams implementation, which depends on bound |this|.
 */
class MockLogPipe {
  static attach(invocation) {
    return LogPipe.attach(invocation, {
      FileStream: this.FileStream,
    });
  }
  static release() {
    return LogPipe.release();
  }
  static logToFile(...args) {
    return LogPipe.logToFile(...args);
  }
  static suppressStdStreams() {
    LogPipe.suppressStdStreams();
  }
  static restoreStdStreams() {
    LogPipe.restoreStdStreams();
  }
}

function createMockLogPipe() {
  MockLogPipe.FileStream = getMockFileStreamCtor();
  return MockLogPipe;
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
        options,
      ),
    );
    this.ts = options.ts;
  }

  loadTestMeta(folder) {
    console.assert(folder in this.ts, `No ${folder} folder found`);
    return this.ts[folder].meta || {};
  }

  loadTest(fn) {
    return this.ts[fn].test;
  }

  getTestFileList(folder) {
    console.assert(folder in this.ts, `No ${folder} folder found`);
    return this.ts[folder].files || [];
  }
}

export { createMockLogPipe, MockSeries };
