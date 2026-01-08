import { is, parseCellSyntax } from './test.js';

export async function test() {
  is(parseCellSyntax('e2e'), { name: 'e2e', split: false }, 'without +');
  is(parseCellSyntax('e2e+'), { name: 'e2e', split: true }, 'with +');
}
