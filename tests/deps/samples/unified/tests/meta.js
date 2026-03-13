export const folders = [
  'disabled',
  'disabled-parent',
  'e2e',
  'integration',
  'lib',
  'services',
];

// Disabled cells stay listed here on purpose so deps/grid tests can verify
// that watest filters them out from generated metadata.
export const grid = {
  'disabled': ['tests/disabled'],
  'disabled-parent': ['tests/disabled-parent/child'],
  'e2e+': ['tests/e2e'],
  'integration': ['tests/integration'],
  'lib': ['tests/lib'],
  'services': ['tests/services'],
};
