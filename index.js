'use strict';

const {
  assert,
  group,
  fail,
  failed,
  info,
  not_reached,
  success,
  todo,
  warn,
} = require('./core/core.js');

const {
  ok,
  is,
  contains,
  is_output,
  no_throws,
  throws,

  test_is,
  test_contains,
} = require('./core/base.js');

const { inspect } = require('./core/util.js');

const { tmp_storage_dir } = require('./core/settings.js');

const { AppDriver } = require('./webdriver/app_driver.js');
const { ControlDriver } = require('./webdriver/control_driver.js');
const { start_session, scope } = require('./webdriver/session.js');

module.exports = {
  AppDriver,
  ControlDriver,

  assert,
  contains,
  failed,
  fail,
  group,
  is,
  is_output,
  info,
  inspect,
  not_reached,
  no_throws,
  ok,
  scope,
  start_session,
  success,
  todo,
  test_is,
  test_contains,
  throws,
  tmp_storage_dir,
  warn,
};
