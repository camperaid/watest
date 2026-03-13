function normalizeMetaEnabled(value) {
  if (value && typeof value.then === 'function') {
    throw new Error(
      "Invalid meta.enabled value: async values are not supported; use a boolean, 'true', 'false', or a synchronous function returning one of those values",
    );
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  throw new Error(
    `Invalid meta.enabled value: expected boolean, 'true', 'false', or a function returning one of those values; got ${JSON.stringify(value)}`,
  );
}

export function isMetaEnabled(meta) {
  if (!meta || meta.enabled === undefined) {
    return true;
  }

  const value =
    typeof meta.enabled === 'function' ? meta.enabled() : meta.enabled;

  return normalizeMetaEnabled(value);
}
