'use strict';

const { spawn } = require('child_process');

const { log_error } = require('../logging/logging.js');

class ChildProcess {
  constructor(on_output) {
    this.on_output = on_output;
    this.childProcessOutputBuffer = [];
  }

  spawn(cmd, args, options) {
    return new Promise((resolve, reject) => {
      const cp = spawn(cmd, args, options);
      cp.on('close', (code, signal) =>
        Promise.resolve(this.processChildProcessOutputPromise).then(() =>
          signal == 'SIGUSR1' ? reject(code) : resolve(code)
        )
      );
      cp.stdout.on('data', data =>
        this.bufferizeChildProcesOutput(cp, data, true)
      );
      cp.stderr.on('data', data =>
        this.bufferizeChildProcesOutput(cp, data, false)
      );
      cp.on('error', reject);
    });
  }

  bufferizeChildProcesOutput(cp, data, is_stdout) {
    let str_data = data.toString();

    let lastChunk = this.childProcessOutputBuffer[
      this.childProcessOutputBuffer.length - 1
    ];
    if (lastChunk && lastChunk.is_stdout == is_stdout) {
      lastChunk.str_data += str_data;
    } else {
      this.childProcessOutputBuffer.push({
        str_data,
        is_stdout,
      });
    }

    if (!this.processChildProcessOutputPromise) {
      this.processChildProcessOutputPromise = this.processChildProcessBuffer()
        .catch(e => {
          log_error(`Unexpected error when parsing a child process output`);
          log_error(e);
          cp.kill('SIGUSR1');
        })
        .then(() => {
          this.processChildProcessOutputPromise = null;
        });
    }
  }

  async processChildProcessBuffer() {
    let lastChunk = this.childProcessOutputBuffer[
      this.childProcessOutputBuffer.length - 1
    ];
    if (!lastChunk || !lastChunk.str_data.endsWith('\n')) {
      return null;
    }

    let buffer = this.childProcessOutputBuffer.slice();
    this.childProcessOutputBuffer = [];

    await this.on_output(buffer);
    return this.processChildProcessBuffer();
  }
}

module.exports = {
  spawn(cmd, args, options, on_output) {
    return new ChildProcess(on_output).spawn(cmd, args, options);
  },
};
