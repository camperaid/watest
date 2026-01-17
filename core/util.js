import fs from 'fs';
import querystring from 'querystring';
import util from 'util';

import { log } from '../logging/logging.js';
import { settings } from './settings.js';

/**
 * Logs object in console colored.
 */
function inspect(obj) {
  log(util.inspect(obj, false, null, true /* enable colors */));
}

/**
 * Stingifies an object.
 */
function stringify(obj, traces = new Set()) {
  if (obj instanceof Object && !(obj instanceof Function)) {
    if (traces.has(obj)) {
      return `recursiveref`;
    }
    traces.add(obj);
  }

  if (typeof obj == 'string') {
    const limit = 1024;
    return `'${obj.length > limit ? obj.substring(0, limit) + '…' : obj}'`;
  }
  if (obj instanceof Array) {
    return `[${obj.map(i => stringify(i, traces)).join(', ')}]`;
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (obj instanceof Set) {
    let values = Array.from(obj.values());
    return `Set[${values.map(i => stringify(i, traces)).join(', ')}]`;
  }
  if (obj instanceof Map) {
    let entries = Array.from(obj.entries()).map(
      ([k, v]) => `${k}: ${stringify(v, traces)}`,
    );
    return `Map{${entries.join(', ')}}`;
  }
  if (obj instanceof RegExp) {
    return obj.toString();
  }
  if (obj instanceof Function) {
    return (
      (obj.name &&
        !Object.prototype.hasOwnProperty.call(obj, 'toString') &&
        `${obj.name}()`) ||
      obj.toString()
    );
  }
  if (typeof obj == 'object') {
    if (obj === null) {
      return 'null';
    }
    let str = '{';
    for (let prop of Object.keys(obj)) {
      if (str.length > 1) {
        str += ', ';
      }
      str += `${prop}: ${stringify(obj[prop], traces)}`;
    }
    str += '}';
    return str;
  }
  return String(obj);
}

/**
 * A temporary storage dir.
 */
function initTmpStorage() {
  if (settings.tmp_storage_dir) {
    removeDir(settings.tmp_storage_dir);
    fs.mkdirSync(settings.tmp_storage_dir);
  }
}

/**
 * Recursively removes the dir.
 */
function removeDir(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(file => {
      let file_path = `${path}/${file}`;
      if (fs.statSync(file_path).isDirectory()) {
        removeDir(file_path);
      } else {
        fs.unlinkSync(file_path);
      }
    });
    fs.rmdirSync(path);
  }
}

function isMac() {
  return process.platform == 'darwin';
}

function isLinux() {
  return process.platform == 'linux';
}

function isWin() {
  return process.platform == 'win32';
}

function toDataURL(html) {
  return `data:text/html,${querystring.escape(html)}`;
}

export {
  inspect,
  stringify,
  isMac,
  isLinux,
  isWin,
  toDataURL,
  removeDir,
  initTmpStorage,
};
