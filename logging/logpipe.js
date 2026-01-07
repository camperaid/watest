import path from 'path';

import { FileStream as DefaultFileStream } from './filestream.js';
import { log, log_error } from './logging.js';
import { settings } from '../core/settings.js';

/**
 * A single instance of a logpipe writing to std and file streams.
 */
class LogPipeInstance {
  constructor({ FileStream, suppress_logging }) {
    this.FS = FileStream || DefaultFileStream;
    this.suppress_logging = suppress_logging;
  }

  attach(invocation) {
    this.invocation = invocation;
    this.run = settings.run;
    this.log_dir = path.join(settings.log_dir, this.invocation);
    if (this.suppress_logging) {
      return;
    }

    this.fname = 'log';
    this.fstream = new this.FS(this.log_dir, this.fname);

    this.fstream.on('error', e => {
      log_error(`Failed to write to ${this.fstream.filepath}`);
      log_error(e);
    });

    return settings.logger.testRunStarted({ run: this.run, invocation });
  }

  async logScreenshot(pic) {
    let name = `screenshot-${Date.now()}.url`;
    let content = `data:image/png;base64,${pic}`;

    let stream = new this.FS(this.log_dir, name);
    stream.write(content);
    await stream.end();
    log(`Screenshot is captured and written to ${stream.filepath}`);

    await settings.logger.writeLogFile({
      run: this.run,
      invocation: this.invocation,
      name,
      content,
    });
  }

  logSourceMap() {
    return settings.logger.writeSourceMap({
      run: this.run,
      invocation: this.invocation,
    });
  }

  release() {
    if (this.suppress_logging || !this.fstream) {
      return Promise.resolve();
    }

    const filepath = this.fstream.filepath;

    return this.fstream
      .end()
      .then(() => this.fstream.readFile())
      .then(content =>
        settings.logger.writeLogFile({
          run: this.run,
          invocation: this.invocation,
          name: this.fname,
          content,
          zip: true,
        }),
      )
      .catch(e => {
        log_error(
          `[logpipe:error] ✗ Logging shutdown failed for ${filepath}:`,
          {
            filepath,
            invocation: this.invocation,
            error: e.message,
            code: e.code,
            stack: e.stack,
          },
        );
      });
  }
}

/**
 * A class that pipes standart output to a file and then sends it to
 * the log server if any.
 */
class LogPipe {
  static attach(invocation, options = {}) {
    if (!settings.log_dir) {
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
    return settings.log_dir
      ? this.pipeOnStack.logScreenshot(...args)
      : Promise.resolve();
  }

  static logSourceMap(...args) {
    return settings.log_dir
      ? this.pipeOnStack.logSourceMap(...args)
      : Promise.resolve();
  }

  static logToFile(msg) {
    if (this.pipeOnStack) {
      this.pipeOnStack.fstream.write(msg);
      this.pipeOnStack.fstream.write('\n');
    }
  }

  static async release(...args) {
    if (!settings.log_dir) {
      return Promise.resolve();
    }

    // Remove the pipe from the stack to prevent anyone writing into it after
    // its release.
    let pipeToRelease = this.stack.pop();
    if (!pipeToRelease) {
      return Promise.resolve();
    }

    await pipeToRelease.release(...args);

    if (this.suppress_logging) {
      return;
    }

    this.suppress_fstream = true;
    log(`Logs are written to ${pipeToRelease.fstream.filepath}`);
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

LogPipe.stack = [];

export { LogPipe };
