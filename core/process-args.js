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

        case '--grid':
          obj.grid = true;
          break;

        case '--deps':
          obj.deps = true;
          break;

        case '--child-process':
          obj.childProcess = true;
          break;

        case '--root-folder':
          obj.rootFolder = process.argv[++i];
          break;

        case '--rerun':
          // Rerun suffix appended to first folder level (e.g., --rerun 5 → www becomes www-5)
          obj.rerun = process.argv[++i];
          break;

        case '--input-type=module':
          break;

        case '--webdriver':
          obj.webdriver = process.argv[++i];
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
    // Pass rerun suffix to child processes
    if ('rerun' in args) {
      list.push('--rerun', args.rerun);
    }
    return list;
  }
}

export { ProcessArgs };
