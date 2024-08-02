'use strict';

const path = require('path');

let rc = null;
try {
  rc = require(path.resolve('.', './.watestrc.js'));
} catch (e) { // eslint-disable-line no-unused-vars
  rc = require(path.resolve('.', './.watestrc.cjs'));
}

class Settings {
  constructor() {
    this.log_dir = '';
    this.run = '';
    this.tmp_storage_dir = '';
    this.logger = null;
    this.servicer = null;

    this.setupTmpStorageDir();
    this.setupLogDir();
    this.setupWebdrivers();
  }

  async initialize() {
    this.logger = (
      await import(rc.logger || '../interfaces/logger.js')
    ).default;

    this.servicer = (
      await import(rc.servicer || '../interfaces/servicer.js')
    ).default;
  }

  get invocation() {
    if (!this.i_nvocation) {
      let platform = process.platform;
      switch (platform) {
        case 'darwin':
          platform = 'mac';
          break;
      }

      this._invocation = rc.invocation || `${platform}`;
    }
    return this._invocation;
  }

  get ignorePattern() {
    return rc.ignore_pattern && new RegExp(rc.ignore_pattern);
  }

  get debunkLimit() {
    return parseInt(rc.debunk_limit) || 5;
  }

  get timeout() {
    return parseInt(rc.timeout) || 0;
  }

  setupTmpStorageDir() {
    if (!rc.tmp_dir) {
      console.log(`Settings: no temporary storage dir`);
      return;
    }

    this.tmp_storage_dir = path.join(rc.tmp_dir, 'watest-tmpstorage');
    console.log(
      `Settings: temporary storage dir is at ${this.tmp_storage_dir}`
    );
  }

  setupLogDir() {
    const log_dir = rc.log_dir;
    if (!log_dir) {
      console.log('Settings: no file logging');
      return;
    }

    this.run = rc.run || `${parseInt(Date.now() / 1000)}`;

    this.log_dir = path.join(log_dir, this.run);
    console.log(`Settings: logging into ${log_dir}`);
  }

  setupWebdrivers() {
    this.webdrivers = rc.webdrivers;
    if (typeof rc.webdrivers == 'string') {
      try {
        this.webdrivers = JSON.parse(rc.webdrivers);
      } catch (e) {
        console.error(
          `Settings: failed to parse webdrivers '${rc.webdrivers}'`, e
        );
      }
    }

    this.webdriver = null;
    this.webdriver_headless =
      rc.webdriver_headless == true || rc.webdriver_headless == 'true';
    this.webdriver_loglevel = rc.webdriver_loglevel;

    if (this.webdrivers) {
      console.log(`Settings: ${this.webdrivers.join(', ')} webdrivers`);
    }
  }
}

module.exports = new Settings();
