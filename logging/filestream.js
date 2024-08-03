import fs from 'fs';
import path from 'path';

/**
 * Writes to a local file.
 */
class FileStream {
  constructor(dir, fname) {
    fs.mkdirSync(dir, { recursive: true });

    this.filepath = path.join(dir, fname);
    this.fstream = fs.createWriteStream(this.filepath);
  }

  write(...args) {
    this.fstream.write(...args);
    return this;
  }
  end() {
    return new Promise((resolve, reject) => {
      this.fstream.on('finish', resolve);
      this.fstream.on('error', reject);
      this.fstream.end();
    });
  }

  on(...args) {
    this.fstream.on(...args);
  }

  readFile() {
    return fs.promises.readFile(this.filepath, {
      encoding: 'utf-8',
    });
  }
}

export { FileStream };
