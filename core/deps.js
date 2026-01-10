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
 * Extract service name from service definition.
 * Services can be either:
 * - A string: 'db'
 * - An array: ['nginx', { env: {...} }] where first element is the name
 */
function getServiceName(service) {
  return Array.isArray(service) ? service[0] : service;
}

/**
 * Check if a folder path should be traversed based on target paths.
 * Similar to series.js matchedPatterns logic:
 * - folderPath starts with target: we're IN or PAST the target
 * - target starts with folderPath: we're ON THE WAY to the target
 */
function matchesPath(folderPath, targetPaths) {
  return targetPaths.some(
    target => folderPath.startsWith(target) || target.startsWith(folderPath),
  );
}

/**
 * Collect metadata from a single directory's meta.js
 * Helper for collectDeps
 */
async function collectMetaFromDir(dirPath, result) {
  try {
    const metaPath = join(process.cwd(), dirPath, 'meta.js');
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
        const serviceName = getServiceName(service);
        if (!result.services.includes(serviceName)) {
          result.services.push(serviceName);
        }
      }
    }

    return meta;
  } catch {
    // No meta.js or error loading it - that's ok
    return null;
  }
}

/**
 * Recursively collect metadata from nested meta.js files.
 * Starts from root folder, walks DOWN the tree, only following branches that match target paths.
 * Similar to how series.js builds tests - uses bidirectional path matching.
 *
 * @param {string} folder - Current folder being traversed
 * @param {string[]} targetPaths - The specific test paths we're collecting deps for
 * @param {Object} result - Accumulated result object
 */
async function collectDepsRecursive(folder, targetPaths, result) {
  // Collect metadata from current folder
  const meta = await collectMetaFromDir(folder, result);

  // If this folder has subfolders, filter and recurse
  if (meta?.folders) {
    for (const subfolder of meta.folders) {
      const subfolderPath = join(folder, subfolder);

      // Only follow this branch if it matches any target path
      if (matchesPath(subfolderPath, targetPaths)) {
        await collectDepsRecursive(subfolderPath, targetPaths, result);
      }
    }
  }
}

/**
 * Collect metadata for given test paths.
 * Walks the tree from tests root, following only branches that lead to target paths.
 *
 * @param {string[]} paths - Test paths to collect metadata for (defaults to entire tree)
 * @param {Object} result - Initial result object
 */
export async function collectDeps(
  paths = [settings.testsFolder],
  result = { servicers: [], webdriver: false, services: [] },
) {
  const rootFolder = settings.testsFolder;

  // Filter to paths under root folder
  const targetPaths = paths.filter(
    p => p === rootFolder || p.startsWith(rootFolder + '/'),
  );

  if (targetPaths.length > 0) {
    await collectDepsRecursive(rootFolder, targetPaths, result);
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
    const meta = await collectDeps(cellPaths);

    if (split && meta.webdriver && browsers.length > 1) {
      // Split: one entry per browser
      for (const wd of browsers) {
        expandedGrid[`${name}-${wd}`] = {
          paths: cellPaths,
          webdrivers: wd,
          servicers: meta.servicers,
          services: meta.services,
        };
      }
    } else {
      // No split: single entry with all browsers as space-separated string
      let webdriversValue = '';
      if (meta.webdriver && browsers.length > 0) {
        webdriversValue = browsers.join(' ');
      }
      expandedGrid[name] = {
        paths: cellPaths,
        webdrivers: webdriversValue,
        servicers: meta.servicers,
        services: meta.services,
      };
    }
  }

  return expandedGrid;
}
