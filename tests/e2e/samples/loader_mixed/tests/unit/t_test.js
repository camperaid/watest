import { is } from 'watest';
import { constant } from '../module.js';

export const test = () => {
  is(constant, 'real', 'Real!');
};
