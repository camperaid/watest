export const loader = true;

export async function resolve(specifier, context, defaultResolve) {
  switch (specifier) {
    case './base.mjs':
      specifier = './base_mock.mjs';
      break;
  }
  return defaultResolve(specifier, context, defaultResolve);
}
