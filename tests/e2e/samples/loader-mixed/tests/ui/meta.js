export const loader = true;

export async function resolve(specifier, context, nextResolve) {
  switch (specifier) {
    case '../module.js':
      specifier = '../module-mock.js';
      break;
  }
  return nextResolve(specifier, context);
}
