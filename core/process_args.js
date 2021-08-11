'use strict';

class ProcessArgs {
  static asObject() {
    let obj = {
      patterns: [],
    };
    for (let i = 2; i < process.argv.length; i++) {
      let arg = process.argv[i];
      switch (arg) {
        case '--debunk':
          obj.debunk = true;
          break;

        case '--skip-on-fail':
          obj.skipOnFail = true;
          break;

        case '--timeout':
          obj.timeout = parseInt(process.argv[++i]);
          break;

        case '-v':
        case '--verify':
          obj.verify = true;
          break;

        case '-h':
        case '--help':
          obj.showHelp = true;
          break;

        case '--child-process':
          obj.childProcess = true;
          break;

        case '--root-folder':
          obj.rootFolder = process.argv[++i];
          break;

        case '--input-type=module':
          break;

        default:
          obj.patterns.push(arg);
      }
    }
    return obj;
  }

  static get controlArguments() {
    let list = [];
    let args = this.asObject();
    if ('debunk' in args) {
      list.push('--debunk');
    } else if ('skipOnFail' in args) {
      list.push('--skip-on-fail');
    } else if ('timeout' in args) {
      list.push('--timeout', args.timeout);
    } else if ('verify' in args) {
      list.push('--verify');
    }
    return list;
  }
}

module.exports = {
  ProcessArgs,
};
