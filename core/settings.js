import path from 'path';

class Settings {
  constructor() {
    this.log_dir = '';
    this.run = '';
    this.tmp_storage_dir = '';
    this.logger = null;
    this.servicer = null;
    this.silent = false;
  }

  async initialize(options = {}) {
    this.silent = options.silent || false;
    this.rc = (await import(path.resolve('.', './.watestrc.js'))).default;

    this.logger = (
      await import(this.rc.logger || '../interfaces/logger.js')
    ).default;

    this.getServicer = (
      await import(this.rc.servicer || '../interfaces/servicer.js')
    ).default;

    this.setupTmpStorageDir();
    this.setupLogDir();
    this.setupWebdrivers();
  }

  get invocation() {
    if (!this.i_nvocation) {
      let platform = process.platform;
      switch (platform) {
        case 'darwin':
          platform = 'mac';
          break;
      }

      this._invocation = this.rc.invocation || `${platform}`;
    }
    return this._invocation;
  }

  get ignorePattern() {
    return this.rc.ignore_pattern && new RegExp(this.rc.ignore_pattern);
  }

  get debunkLimit() {
    return parseInt(this.rc.debunk_limit) || 5;
  }

  get testsFolder() {
    return this.rc?.tests_folder ?? 'tests';
  }

  get testFilePattern() {
    return this.rc.test_file_pattern || /^t[-_]/;
  }

  get timeout() {
    return parseInt(this.rc.timeout) || 0;
  }

  setupTmpStorageDir() {
    if (!this.rc.tmp_dir) {
      if (!this.silent) {
        console.log(`Settings: no temporary storage dir`);
      }
      return;
    }

    this.tmp_storage_dir = path.join(this.rc.tmp_dir, 'watest-tmpstorage');
    if (!this.silent) {
      console.log(
        `Settings: temporary storage dir is at ${this.tmp_storage_dir}`,
      );
    }
  }

  setupLogDir() {
    const log_dir = this.rc.log_dir;
    if (!log_dir) {
      if (!this.silent) {
        console.log('Settings: no file logging');
      }
      return;
    }

    this.run = this.rc.run || `${parseInt(Date.now() / 1000)}`;

    this.log_dir = path.join(log_dir, this.run);
    if (!this.silent) {
      console.log(`Settings: logging into ${log_dir}`);
    }
  }

  setupWebdrivers() {
    this.webdrivers = this.rc.webdrivers;
    if (typeof this.rc.webdrivers == 'string') {
      try {
        this.webdrivers = JSON.parse(this.rc.webdrivers);
      } catch (e) {
        console.error(
          `Settings: failed to parse webdrivers '${this.rc.webdrivers}'`,
          e,
        );
      }
    }

    this.webdriver = null;
    this.webdriver_headless =
      this.rc.webdriver_headless == true ||
      this.rc.webdriver_headless == 'true';
    this.webdriver_loglevel = this.rc.webdriver_loglevel;

    this.webdriver_window_width =
      parseInt(this.rc.webdriver_window_width) || 1366;
    this.webdriver_window_height =
      parseInt(this.rc.webdriver_window_height) || 768;

    if (this.webdrivers && !this.silent) {
      console.log(`Settings: ${this.webdrivers.join(', ')} webdrivers`);
    }
  }
}

export const settings = new Settings();
