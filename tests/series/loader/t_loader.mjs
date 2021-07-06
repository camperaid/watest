import { is } from '../../../index.js';
import { get } from './module.mjs';

export function test() {
  is(get(), 'BaseMock', 'module mocking');
}
