/**
 * Dependency and grid metadata extraction for distributed testing.
 * Parses test folder metadata and generates grid configurations.
 */

import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { settings } from './settings.js';

/**
 * Parse cell syntax: 'e2e+' → { name: 'e2e', split: true }
 */
export function parseCellSyntax(cellKey) {
  if (cellKey.endsWith('+')) {
    return { name: cellKey.slice(0, -1), split: true };
  }
  return { name: cellKey, split: false };
}

/**
 * Separate paths (contain '/') from webdrivers (don't contain '/')
 */
export function parseGridArgs(args) {
  const paths = [];
  const webdrivers = [];

  for (const arg of args) {
    if (arg.includes('/')) {
      paths.push(arg);
    } else {
      webdrivers.push(arg);
    }
  }

  return { paths, webdrivers };
}

/**
 * Recursively collect metadata from nested meta.js files
 */
export async function collectNestedMeta(
  paths,
  result = { servicers: [], webdriver: false, services: [] },
) {
  for (const path of paths) {
    try {
      const metaPath = join(process.cwd(), path, 'meta.js');
      const metaUrl = pathToFileURL(metaPath).href;
      const meta = await import(metaUrl);

      if (meta.servicer && !result.servicers.includes(meta.servicer)) {
        result.servicers.push(meta.servicer);
      }
      if (meta.webdriver) {
        result.webdriver = true;
      }
      if (meta.services) {
        for (const service of meta.services) {
          if (!result.services.includes(service)) {
            result.services.push(service);
          }
        }
      }

      // Recursively process folders
      if (meta.folders) {
        const nestedPaths = meta.folders.map(f => join(path, f));
        await collectNestedMeta(nestedPaths, result);
      }
    } catch {
      // No meta.js or error loading it - that's ok
    }
  }

  return result;
}

/**
 * Generate expanded grid from grid config and args.
 * Returns cell→metadata mapping with + cells expanded per browser.
 *
 * Example:
 *   watest --grid-meta tests/e2e firefox chrome
 *   → {
 *       "e2e-firefox": { paths: ["tests/e2e"], webdriver: "firefox", servicers: [...], services: [...] },
 *       "e2e-chrome": { paths: ["tests/e2e"], webdriver: "chrome", servicers: [...], services: [...] }
 *     }
 */
export async function generateGridTasks(gridConfig, args) {
  const { paths, webdrivers } = parseGridArgs(args);
  const browsers =
    webdrivers.length > 0 ? webdrivers : settings.webdrivers || [];

  // Build cell → paths mapping
  const cellPathsMap = new Map();

  if (paths.length > 0) {
    // Map each requested path to its cell
    for (const [cellKey, cellPaths] of Object.entries(gridConfig)) {
      const matchingPaths = paths.filter(p =>
        cellPaths.some(cp => p.startsWith(cp)),
      );
      if (matchingPaths.length > 0) {
        cellPathsMap.set(cellKey, matchingPaths);
      }
    }
  } else {
    // Use all cells with their configured paths
    for (const [cellKey, cellPaths] of Object.entries(gridConfig)) {
      cellPathsMap.set(cellKey, cellPaths);
    }
  }

  // Build expanded grid with metadata
  const expandedGrid = {};
  for (const [cellKey, cellPaths] of cellPathsMap) {
    const { name, split } = parseCellSyntax(cellKey);
    const meta = await collectNestedMeta(cellPaths);

    if (split && meta.webdriver && browsers.length > 1) {
      // Split: one entry per browser
      for (const wd of browsers) {
        expandedGrid[`${name}-${wd}`] = {
          paths: cellPaths,
          webdriver: wd,
          servicers: meta.servicers,
          services: meta.services,
        };
      }
    } else {
      // No split: single entry
      expandedGrid[name] = {
        paths: cellPaths,
        webdriver: meta.webdriver ? (browsers[0] ?? null) : null,
        servicers: meta.servicers,
        services: meta.services,
      };
    }
  }

  return expandedGrid;
}
