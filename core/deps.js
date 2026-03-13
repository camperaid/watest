/**
 * Dependency and grid metadata extraction for distributed testing.
 * Parses test folder metadata and generates grid configurations.
 */

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isMetaEnabled } from './meta.js';
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
 * Collect metadata from a single directory's meta.js.
 */
async function scanMetaDir(dirPath, result) {
  const metaPath = join(process.cwd(), dirPath, 'meta.js');
  if (!fs.existsSync(metaPath)) {
    return null;
  }

  const metaUrl = pathToFileURL(metaPath).href;
  const meta = await import(metaUrl);

  if (!isMetaEnabled(meta)) {
    return undefined;
  }

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
}

/**
 * Walk nested meta.js files from root toward the requested target paths.
 * Starts from root folder, walks DOWN the tree, only following branches that match target paths.
 * Similar to how series.js builds tests - uses bidirectional path matching.
 *
 * @param {string} folder - Current folder being traversed
 * @param {string[]} targetPaths - The specific test paths we're collecting deps for
 * @param {Object} result - Accumulated result object
 */
async function walkDepsTree(folder, targetPaths, result) {
  // Collect metadata from current folder
  const meta = await scanMetaDir(folder, result);

  if (meta === undefined) {
    return false;
  }

  let hasEnabledTarget = targetPaths.some(target => target === folder);

  // If this folder has subfolders, filter and recurse
  if (meta?.folders) {
    for (const subfolder of meta.folders) {
      const subfolderPath = join(folder, subfolder);

      // Only follow this branch if it matches any target path
      if (matchesPath(subfolderPath, targetPaths)) {
        if (await walkDepsTree(subfolderPath, targetPaths, result)) {
          hasEnabledTarget = true;
        }
      }
    }
  } else if (targetPaths.some(target => target.startsWith(`${folder}/`))) {
    hasEnabledTarget = true;
  }

  return hasEnabledTarget;
}

/**
 * Collect metadata for given test paths.
 * Walks the tree from tests root, following only branches that lead to target paths.
 *
 * @param {string[]} paths - Test paths to collect metadata for (defaults to entire tree)
 * @param {Object} result - Initial result object
 */
async function buildDepsState(
  paths = [settings.testsFolder],
  result = { servicers: [], webdriver: false, services: [] },
) {
  const rootFolder = settings.testsFolder;

  // Filter to paths under root folder
  const targetPaths = paths.filter(
    p => p === rootFolder || p.startsWith(rootFolder + '/'),
  );

  let hasEnabledTarget = false;

  if (targetPaths.length > 0) {
    hasEnabledTarget = await walkDepsTree(rootFolder, targetPaths, result);
  }

  return { deps: result, hasEnabledTarget };
}

export async function collectDeps(
  paths = [settings.testsFolder],
  result = { servicers: [], webdriver: false, services: [] },
) {
  return (await buildDepsState(paths, result)).deps;
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
    const { deps, hasEnabledTarget } = await buildDepsState(cellPaths);

    if (!hasEnabledTarget) {
      continue;
    }

    if (split && deps.webdriver && browsers.length > 1) {
      // Split: one entry per browser
      for (const wd of browsers) {
        expandedGrid[`${name}-${wd}`] = {
          paths: cellPaths,
          webdrivers: wd,
          servicers: deps.servicers,
          services: deps.services,
        };
      }
    } else {
      // No split: single entry with all browsers as space-separated string
      let webdriversValue = '';
      if (deps.webdriver && browsers.length > 0) {
        webdriversValue = browsers.join(' ');
      }
      expandedGrid[name] = {
        paths: cellPaths,
        webdrivers: webdriversValue,
        servicers: deps.servicers,
        services: deps.services,
      };
    }
  }

  return expandedGrid;
}
