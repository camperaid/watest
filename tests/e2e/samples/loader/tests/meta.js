export const loader = true;

export async function resolve(specifier, context, defaultResolve) {
  switch (specifier) {
    case './module.js':
      specifier = './module_mock.js';
      break;
  }
  return defaultResolve(specifier, context, defaultResolve);
}
