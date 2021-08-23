'use strict';

const { is_output, is_object } = require('./test.js');

module.exports.test = async () => {
  // sucess
  await is_output(
    () => is_object({ field: 'hey' }, { field: 'hey' }, 'TstMsg'),
    [`Ok: TstMsg, got: {field: 'hey'}\n`],
    [],
    `sucess`
  );

  // types: Set
  await is_output(
    () => is_object(new Set(['v1', 'v2']), ['v1', 'v2'], 'TstMsg'),
    [`Ok: TstMsg, got: Set['v1', 'v2']`],
    [],
    `types: Set`
  );

  // types: Map
  await is_output(
    () => is_object(new Map([['key', 'val']]), [['key', 'val']], 'TstMsg'),
    [`Ok: TstMsg, got: Map{key: 'val'}`],
    [],
    `types: Map`
  );

  // function sucess
  await is_output(
    () => is_object({ field: 'hey' }, () => true, 'TstMsg'),
    [`Ok: TstMsg, got: {field: 'hey'}`],
    [],
    `function sucess`
  );

  // function failure
  await is_output(
    () => is_object({ field: 'hey' }, () => false, 'TstMsg'),
    [],
    [
      `Failed: TstMsg: unexpected value: {field: 'hey'}, expected: () => false`,
      `Failed: TstMsg`,
    ],
    `function failure`
  );

  // failure: type mismatch
  await is_output(
    () => is_object({ key: 3 }, { key: '3' }, 'TstMsg'),
    [],
    [
      `Failed: TstMsg: 'key' field type mismatch, got type: number, expected type: string, got value: 3, expected value: '3'`,
      `Failed: TstMsg`,
    ],
    `failure: type mismatch`
  );

  // failure: class mismatch
  await is_output(
    () => is_object([], new Map(), 'TstMsg'),
    [],
    [
      `Failed: TstMsg: class mismatch, got: Array, expected: Map`,
      `Failed: TstMsg`,
    ],
    `failure: class mismatch, expected of a different class`
  );

  // failure: class mismatch
  await is_output(
    () => is_object(new Set(), new Map(), 'TstMsg'),
    [],
    [
      `Failed: TstMsg: class mismatch, got: Set, expected: Map`,
      `Failed: TstMsg`,
    ],
    `failure: class mismatch, |expected| and |got| belong to different classes`
  );

  // success: class mismatch but |expected| is a generic Object
  class A {
    constructor() {
      this.name = 'name';
    }
    foo() {}
  }
  await is_output(
    () => is_object(new A(), { name: 'name' }, 'TstMsg'),
    [`Ok: TstMsg, got: {name: 'name'}`],
    [],
    `success: class mismatch but |expected| is a generic Object`
  );

  // failure: value mismatch
  await is_output(
    () => is_object({}, null, 'TstMsg'),
    [],
    [
      `Failed: TstMsg: class mismatch, got: Object, expected: null`,
      `Failed: TstMsg`,
    ],
    `failure: class mismatch (null) #2`
  );

  // failure: value mismatch
  await is_output(
    () => is_object({ field: 'hey' }, { field: 'pey' }, 'TstMsg'),
    [],
    [
      `Failed: TstMsg: 'field' field value mismatch;\ngot:\nhey\nexpected:\npey\nunexpected character: 'h' at 0 pos, expected: 'p' at '' line`,
      `Failed: TstMsg`,
    ],
    `failure: value mismatch (strings)`
  );

  // failure: not enumerable property value mismatch
  await is_output(
    () =>
      is_object(
        new (class {
          get field() {
            return 'hey';
          }
        })(),
        { field: 'pey' },
        'TstMsg'
      ),
    [],
    [
      `Failed: TstMsg: 'field' field value mismatch;\ngot:\nhey\nexpected:\npey\nunexpected character: 'h' at 0 pos, expected: 'p' at '' line`,
      `Failed: TstMsg`,
    ],
    `failure: not enumerable property value mismatch`
  );

  // failure: primitive
  await is_output(
    () => is_object(null, {}, 'TstMsg'),
    [],
    [`Failed: TstMsg, got: null, expected: [object Object]`],
    `failure: value mismatch (null)`
  );

  // failure: field was not expected
  await is_output(
    () =>
      is_object(
        {
          f1: 'f1',
          f2: {
            f21: 'f21',
          },
        },
        {
          f2: {},
        },
        'TstMsg'
      ),
    [],
    [
      `Failed: TstMsg: 'f1' field was not expected, got: 'f1'`,
      `Failed: TstMsg: 'f2->f21' field was not expected, got: 'f21'`,
      `Failed: TstMsg`,
    ],
    `failure: class mismatch`
  );

  // failure: nested fields, array length mismatch
  await is_output(
    () =>
      is_object(
        {
          f1: {
            f2: [],
          },
        },
        {
          f1: {
            f2: [3],
          },
        },
        'TstMsg'
      ),
    [],
    [
      `Failed: TstMsg: 'f1->f2' field array length mismatch, got: 0, expected: 1.\nGot: []\nExpected: [3]`,
      `Failed: TstMsg`,
    ],
    `failure: nested fields array length mismatch`
  );
};
