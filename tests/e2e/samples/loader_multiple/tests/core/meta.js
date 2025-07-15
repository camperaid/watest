export const loader = true;

export async function resolve(specifier, context, nextResolve) {
  switch (specifier) {
    case '../module.js':
      specifier = '../module_mock.js';
      break;
  }
  return nextResolve(specifier, context);
}
