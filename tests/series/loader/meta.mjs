export const loader = true;

export async function resolve(specifier, context, nextResolve) {
  switch (specifier) {
    case './base.mjs':
      specifier = './base_mock.mjs';
      break;
  }
  return nextResolve(specifier, context);
}
