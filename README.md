# watest

WATest (Web Application Testsuite) is a lightweight, minimal-dependency test framework designed for webdriver-based E2E testing. Also works great for unit and integration tests.

## Install

```bash
npm install @camperaid/watest --save
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "watest"
  }
}
```

Run tests:

```bash
npm test
```

## Project Structure

```
tests/
├── meta.js          # Root test configuration
├── unit/
│   ├── meta.js      # Folder-specific config
│   ├── t_foo.js     # Test file (t_ prefix)
│   └── t_bar.js
└── e2e/
    ├── meta.js
    └── t_login.js
```

### meta.js Options

Each test folder can have a `meta.js` file:

```javascript
// tests/e2e/meta.js
export const folders = ['login', 'checkout'];  // Nested test folders
export const services = ['db', 'ws'];          // Services to start
export const servicer = 'docker';              // Service manager: 'docker' | 'kubernetes'
export const webdriver = true;                 // Enable browser testing
export const init = async () => { /* setup */ };
export const uninit = async () => { /* teardown */ };
```

## Configuration

### Project Configuration File

Create `.watestrc.js` in your **project root** (not in watest):

```javascript
export default {
  // Test run identifiers (from env or auto-generated)
  run: process.env.WATEST_RUN,
  invocation: process.env.WATEST_INVOCATION,

  // Directories
  log_dir: process.env.WATEST_LOG_DIR,
  tmp_dir: process.env.WATEST_TMP_DIR || '/tmp',

  // Test behavior
  timeout: process.env.WATEST_TIMEOUT || 30000,
  debunk_limit: process.env.WATEST_DEBUNK_LIMIT || 5,

  // WebDriver settings
  webdrivers: process.env.WATEST_WEBDRIVERS,
  webdriver_headless: process.env.WATEST_WEBDRIVER_HEADLESS,
  webdriver_loglevel: process.env.WATEST_WEBDRIVER_LOGLEVEL,
  webdriver_window_width: process.env.WATEST_WEBDRIVER_WINDOW_WIDTH,
  webdriver_window_height: process.env.WATEST_WEBDRIVER_WINDOW_HEIGHT,

  // Integration hooks (absolute paths to your project files)
  servicer: './tests/servicer.js',  // Manages test services
  logger: './tests/logserver.js',   // Remote test logging

  // Optional: ignore pattern
  ignore_pattern: process.env.WATEST_IGNORE_PATTERN,
};
```

**Note**: This file should be created in your project root (where you run `watest`), not inside the watest directory itself.

### Environment Variables

Watest reads configuration from environment variables. Create `.env` in your project root or export them:

```bash
# Test execution
WATEST_RUN=run-123                           # Optional: Group multiple test invocations
WATEST_INVOCATION=inv-456                    # Optional: Unique invocation identifier
WATEST_TIMEOUT=30000                         # Test timeout in milliseconds
WATEST_DEBUNK_LIMIT=5                        # Max retry attempts for flaky tests

# Directories
WATEST_LOG_DIR=/tmp/watest                   # Test logs directory
WATEST_TMP_DIR=/tmp                          # Temporary files directory

# WebDriver
WATEST_WEBDRIVERS='["chrome","firefox"]'     # Browser list (JSON array)
WATEST_WEBDRIVER_HEADLESS=true               # Run browsers headless
WATEST_WEBDRIVER_LOGLEVEL=info               # WebDriver log level
WATEST_WEBDRIVER_WINDOW_WIDTH=1280           # Browser window width
WATEST_WEBDRIVER_WINDOW_HEIGHT=1024          # Browser window height

# Integration
WATEST_LOGGER_MODULE=./tests/logserver.js    # Path to logger module
WATEST_SERVICER_MODULE=./tests/servicer.js   # Path to servicer module
WATEST_IGNORE_PATTERN=_browser\.js$          # Regex for files to skip
```

### Webdrivers

Built-in webdriver configurations:

- `chrome` - Chrome browser
- `chrome-mobile` - Chrome with iPhone emulation
- `firefox` - Firefox browser
- `safari` - Safari browser

## CLI Options

```bash
watest [options] [patterns...]

Options:
  --skip-on-fail  Skip remaining tests in folder after first failure
  --timeout       Set webdriver condition timeout (ms)
  --debunk        Re-run passing test until it fails (flakiness detection)
  -v, --verify    Re-run failing tests
  --deps          Output metadata (servicers, services) as JSON
  --grid          Output grid metadata for distributed testing
  -h, --help      Show help
```

### Examples

```bash
watest                           # Run all tests
watest tests/unit                # Run specific folder
watest tests/e2e/t_login.js      # Run specific file
watest chrome firefox            # Run with multiple browsers
watest --debunk tests/e2e        # Find flaky tests
```

## Test API

### Assertions

```javascript
import { ok, is, contains, throws, no_throws } from '@camperaid/watest';

ok(value, 'value is truthy');
is(got, expected, 'values match');
contains(array, expected, 'array contains values');
throws(() => fn(), 'throws error');
no_throws(() => fn(), 'does not throw');
```

### Reporting

```javascript
import { success, fail, info, warn, todo, group } from '@camperaid/watest';

group('User authentication');
success('login completed');
fail('validation failed');
info('processing 100 items');
warn('deprecated API used');
todo('implement logout');
```

### Utilities

```javascript
import { assert, not_reached, inspect } from '@camperaid/watest';

assert(condition, 'condition must be true');  // Fails with stack trace
not_reached('should not get here');           // Always fails with stack trace
inspect(object);                              // Pretty-print object
```

### Test Helpers

```javascript
import { test_is, test_contains } from '@camperaid/watest';

// Silent checks (no success/fail logging)
if (test_is(got, expected)) { /* ... */ }
if (test_contains(array, subset)) { /* ... */ }
```

## Integration Testing

Configure a servicer in `.watestrc.js` to manage services. The servicer interface (`interfaces/servicer.js`) must implement:

- `start(services)` - Start services
- `stop()` - Stop services

When watest encounters `services` in `meta.js`, it calls the servicer to start/stop services.

## E2E Testing

### Driver

Chainable wrapper around Selenium WebDriver:

```javascript
import { scope } from '@camperaid/watest';

export const test = scope('https://example.com', async session => {
  await session.driver
    .get('/')
    .findElement('#login')
    .click()
    .findElement('#email')
    .sendKeys('user@example.com');
});
```

### AppDriver

Base class for page object patterns:

```javascript
import { AppDriver } from '@camperaid/watest';

class LoginPage extends AppDriver {
  login({ email, password }) {
    return this.chain(() =>
      this.action('Login')
        .sendKeys(this.Email, email)
        .sendKeys(this.Password, password)
        .click(this.Submit)
    );
  }

  getSelectors() {
    return {
      Self: '#login-page',
      Email: '#email',
      Password: '#password',
      Submit: 'button[type=submit]',
    };
  }
}
```

### ControlDriver

Base class for reusable UI component drivers (dropdowns, modals, etc.).

## Expected Failures

Handle known intermittent or permanent failures in `meta.js`:

```javascript
export const expected_failures = [
  [
    'test_file.js',  // or '*' for all files
    [
      [platform, type, group, failures, description],
    ],
  ],
];
```

- `platform`: `'all'`, `'darwin'`, `'linux'`, `'darwin-chrome'`, etc.
- `type`: `'perma'` or `'intermittent'`
- `group`: Test group name or `'*'`
- `failures`: Array of failure message patterns
- `description`: Human-readable description

Example:

```javascript
export const expected_failures = [
  [
    '*',
    [
      ['all', 'intermittent', '*', ['socket hang up'], 'Network flakiness'],
      ['darwin-safari', 'perma', '*', ['WebDriver timeout'], 'Safari bug'],
    ],
  ],
];
```

## ES Module Mocking

Enable custom module resolution in `meta.js`:

```javascript
export const loader = true;

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === './api.js') {
    specifier = './api_mock.js';
  }
  return defaultResolve(specifier, context, defaultResolve);
}
```

## Grid Metadata for Distributed Testing

Watest provides metadata helpers for external orchestrators to distribute tests across multiple workers. Define grid splits in `meta.js`:

```javascript
// tests/meta.js
export const grid = {
  'e2e+': ['tests/e2e'],      // '+' = split per browser
  'www+': ['tests/www'],
  'services': ['tests/services', 'tests/integration'],
  'misc': ['tests/lib', 'tests/ops'],
};
```

Query metadata for orchestration:

```bash
# Get grid metadata as JSON
watest --grid
watest --grid chrome firefox
watest --grid tests/e2e tests/www

# Get dependency metadata (servicers, services)
watest --deps tests/e2e
```

**Note**: Watest doesn't implement distributed test execution. These flags output metadata (JSON) that orchestration tools use to spawn workers and split test workload.

## System Commands

```javascript
import { runCommand, execCommand, spawn, runBashScript } from '@camperaid/watest';

// Run command, log output
await runCommand('npm', ['install']);

// Run command, capture output
const { stdout, stderr, code } = await execCommand('git', ['status']);

// Spawn with custom handling
const proc = spawn('node', ['server.js']);

// Run bash script
await runBashScript('setup.sh');
```

## License

MPL-2.0
