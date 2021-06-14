import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const all_exports = require('./index.js');
export default all_exports;
