'use strict';

const path = require('path');

const settings = require('../core/settings.js');
const { log_dir, run } = settings;

/**
 * A single instance of a logpipe writing to std and file streams.
 */
class LogPipeInstance {
  constructor({ FileStream, suppress_logging }) {
    this.FS = FileStream || require('./filestream.js').FileStream;
    this.suppress_logging = suppress_logging;
  }

  attach(invocation) {
    this.invocation = invocation;
    this.log_dir = path.join(log_dir, this.invocation);
    if (this.suppress_logging) {
      return;
    }

    this.fname = 'log';
    this.fstream = new this.FS(this.log_dir, this.fname);

    this.fstream.on('error', e => {
      console.error(`Failed to write to ${this.fstream.filepath}`);
      console.error(e);
    });

    return settings.logger.testRunStarted({ run, invocation });
  }

  async logScreenshot(pic) {
    let name = `screenshot-${Date.now()}.url`;
    let content = `data:image/png;base64,${pic}`;

    let stream = new this.FS(this.log_dir, name);
    stream.write(content);
    await stream.end();
    console.log(`Screenshot is captured and written to ${stream.filepath}`);

    await settings.logger.writeLogFile({
      run,
      invocation: this.invocation,
      name,
      content,
    });
  }

  logSourceMap() {
    return settings.logger.writeSourceMap({ run, invocation: this.invocation });
  }

  release() {
    return (
      !this.suppress_logging &&
      this.fstream
        .end()
        .then(() => this.fstream.readFile())
        .then(content =>
          settings.logger.writeLogFile({
            run,
            invocation: this.invocation,
            name: this.fname,
            content,
            zip: true,
          })
        )
        .catch(e => {
          console.error(`Logging shutdown rejected: ${e}`);
        })
    );
  }
}

/**
 * A class that pipes standart output to a file and then sends it to
 * the log server if any.
 */
class LogPipe {
  static attach(invocation, options = {}) {
    if (!log_dir) {
      return Promise.resolve();
    }

    const pipe = new LogPipeInstance({
      FileStream: options.FileStream || this.FileStream,
      suppress_logging: this.suppress_logging,
    });

    this.stack.push(pipe);

    if (!this.suppress_logging && this.stack.length == 1) {
      this.attachToStdStreams();
    }
    return pipe.attach(invocation);
  }

  static logScreenshot(...args) {
    return log_dir
      ? this.pipeOnStack.logScreenshot(...args)
      : Promise.resolve();
  }

  static logSourceMap(...args) {
    return log_dir ? this.pipeOnStack.logSourceMap(...args) : Promise.resolve();
  }

  static logToFile(msg) {
    if (this.pipeOnStack) {
      this.pipeOnStack.fstream.write(msg);
      this.pipeOnStack.fstream.write('\n');
    }
  }

  static async release(...args) {
    if (!log_dir) {
      return Promise.resolve();
    }

    // Remove the pipe from the stack to prevent anyone writing into it after
    // its release.
    let pipeToRelease = this.stack.pop();
    await pipeToRelease.release(...args);

    if (this.suppress_logging) {
      return;
    }

    this.suppress_fstream = true;
    console.log(`Logs are written to ${pipeToRelease.fstream.filepath}`);
    this.suppress_fstream = false;

    if (this.stack.length == 0) {
      this.deattachFromStdStreams();
    }
  }

  static suppressStdStreams() {
    this.suppress_stdstreams = true;
  }
  static restoreStdStreams() {
    this.suppress_stdstreams = false;
  }

  static get pipeOnStack() {
    return this.stack[this.stack.length - 1];
  }

  static attachToStdStreams() {
    this.stdoutWrite = process.stdout.write;
    this.stderrWrite = process.stderr.write;

    process.stdout.write = (...args) => {
      if (!this.suppress_stdstreams) {
        this.stdoutWrite.apply(process.stdout, args);
      }
      if (this.pipeOnStack && !this.suppress_fstream) {
        this.pipeOnStack.fstream.write(...args);
      }
    };
    process.stderr.write = (...args) => {
      if (!this.suppress_stdstreams) {
        this.stderrWrite.apply(process.stderr, args);
      }
      if (this.pipeOnStack && !this.suppress_fstream) {
        this.pipeOnStack.fstream.write(...args);
      }
    };
  }

  static deattachFromStdStreams() {
    if (this.stdoutWrite) {
      process.stdout.write = this.stdoutWrite;
      this.stdoutWrite = null;
    }
    if (this.stderrWrite) {
      process.stderr.write = this.stderrWrite;
      this.stderrWrite = null;
    }
  }
}

LogPipe.FileStream = require('./filestream.js').FileStream;
LogPipe.stack = [];

module.exports = {
  LogPipe,
};
