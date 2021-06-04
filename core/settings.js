'use strict';

const path = require('path');
const rc = require(path.resolve('.', './.watestrc.js'));

class Settings {
  constructor() {
    this.log_dir = '';
    this.run = '';
    this.invocation = '';
    this.tmp_storage_dir = '';

    this.setupTmpStorageDir();
    this.setupLogDir();
    this.setupWebdrivers();
  }

  /**
   * Returns the logger.
   */
  get logger() {
    return require(rc.logger || '../interfaces/logger.js');
  }

  /**
   * Returns the servicer.
   */
  get servicer() {
    return require(rc.servicer || '../interfaces/servicer.js');
  }

  get debunkLimit() {
    return parseInt(rc.debunk_limit) || 5;
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

    let platform = process.platform;
    switch (platform) {
      case 'darwin':
        platform = 'mac';
        break;
    }

    this.run = rc.run || `${parseInt(Date.now() / 1000)}`;
    this.invocation = rc.invocation || `${platform}`;

    this.log_dir = path.join(log_dir, this.run);
    console.log(`Settings: logging into ${log_dir}`);
  }

  setupWebdrivers() {
    try {
      this.webdrivers = rc.webdrivers && JSON.parse(rc.webdrivers);
    } catch (e) {
      console.log(`Settings: failed to parse webdrivers '${rc.webdrivers}'`);
    }

    this.webdriver = null;
    this.webdriver_headless = rc.webdriver_headless == 'true';
    this.webdriver_loglevel = rc.webdriver_loglevel;

    if (this.webdrivers) {
      console.log(`Settings: ${this.webdrivers.join(', ')} webdrivers`);
    }
  }
}

module.exports = new Settings();
