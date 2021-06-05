# watest

WATest stands for Web Application Testsuite. It is a lightweight, minimal dependency
testsuite designed for webdriver-based testing. It also can great be for
unit and integration testing.

## Install

Invoke

```
npm install @camperaid/watest --save
```

in the project root.

Use `watest` command to run tests located in `tests/` folder. For example, add

```
scripts: {
  test: 'watest'
}
```

in `package.json` and then run the tests by

```
npm test
```

## Structure

Tests has to be located in `tests/` folder. Each test folder can contain
`meta.js` file describing the test flow.

`init` function used to initialize tests in a folder
`uninit` function used to initialize tests in a folder
`folders` is a list of nested folders containing tests
`services` is a list of services to run

## Configuration

`.watestrc.js` is used to define configuration.

Pre-defined webdrivers:

- `chrome` to run tests in Chrome
- `chrome-mobile` to run tests in Chrome on iPhone
- `firefox` to run tests in Firefox
- `safari` to run tests in Safari

## Unit testing

The testsuite has basic functions:

- `fail(msg)` to record test failure
- `success(msg)` to record test success
- `ok(cond, msg)` to test a boolean value
- `is(got, expected, msg)` to compare two values

Other functions:

- `info(msg)`to print an info message
- `assert(expression, msg)` to print an assert message if an expression fails
- `not_reached(msg)` to fail with stack trace printed
- `group(msg)` prints a grouping message, useful to logically group a test checks
- `intermittent(msg)` to print an intermittent message
- `todo(msg)` to print a todo message
- `warn(msg)` to print a warning message

## Integration testing

Make sure to add `servicer` into `watestrc.js` configuration, which refers to an object managing the services. See interfaces/servicer.js for the API, which should be implemented by a `servicer`.

Each time when the testsuite encounters `services` directive in `meta.js` file, it pokes into `servicer` object to start the referred services, and then to stop them, when leaving the folder.

## E2E testing

The testuiste provides two helper classes to simplify webdriver testing.

### Driver

`Driver` is a chainable wrapper around selenium webdriver. It provides a set
of handy functions used to implement high level application drivers.

### AppDriver

This is a base class for all application testing blocks. A typical scenario of
application block would look the following way. Let's you have a chat
webapp, so you might want to have `Chat` appdriver like this:

```
class Chat extends AppDriver {
  sendMessage({ from, to, message }) {
    return this.chain(() => this.action(`Send a message from ${from} to ${to})).
      sendKeys(this.MainInput, message, `send keys to main input field`).
      hitEnter());
  }

  checkMessages({ messages }) {
    return this.chain(() => this.action(`Check messages`).
      getTextAll(this.Messages, messages, `check message boxes`));
  }

  getSelectors() {
    return {
      Self: '#chat',
      MainInput: '#main-input',
      Messages: '.messages',
    };
  }
}
module.exports = Chat;
```

and the test will be like

```
module.exports.test = scope(url, async session => {
  await session.Chat.get().
    sendMessage({ from: 'me', to: 'you', 'hi' }).
    checkMessages({ messages: ['hi']});
})
```

## Intermittent and perma failures

`meta.js` supports `expected_failures` instruction to handle intermittent and
perma failures:

```
module.exports.expected_failures = [
  [
    test_file,
    [
      [platform, failure_type, test_group, ...failures],
    ],
  ],
];
```

where

- `platform` is a value of `process.platform` or in case of webdriver tests
  it is a dash separated `process.platform` and webdriver name, for example,
  `darwin-chrome`, can be `all` to indicate that failure can happen on any
  platform
- `failure_type` is either 'perma' or 'intermittent'
- `test_group` is a test group name, can be `*`
- `...failures` is a list of expected failures

For example:

```
module.exports.expected_failures = [
  [
    '*',
    [
      ['all', 'intermittent', '*', [`socket hang up`], `Socket hang up`],
      [
        'all',
        'intermittent',
        '*',
        [`[map:bounds] map retrieveBounds timeout`, `*`],
        `GoogleMaps is not loaded`,
      ],
      [
        'darwin-safari',
        'intermittent',
        '*',
        [`Wait for LocSearch focus`, `Waiting until element is focused`],
        `LocSearch is not focused`,
      ],
    ],
  ],
];
```

## Testsuite options

- `--debunk` to enable debunk mode which will run a test the number of times or until it fails whichever is first
- `-v` or `--verify` to re-run failing tests
- `--timeout` to set up a custom timeout for webdriver tests, for example, to break wd condition early
