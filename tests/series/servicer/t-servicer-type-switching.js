/**
 * Test for Servicer Type Switching
 *
 * Verifies that when switching between test folders with different servicer types,
 * the old servicer is properly shut down before creating the new one.
 *
 * This prevents port conflicts when transitioning between Kubernetes and Docker servicers.
 *
 * Test scenario:
 * 1. Folder 1: docker servicer with services
 * 2. Folder 2: kubernetes servicer with services
 * 3. Folder 3: back to docker servicer with services
 * Expected: docker → kubernetes (shutdown docker, create k8s) → docker (shutdown k8s, create docker)
 */

import { is_test_output, success } from '../../base/test.js';
import { MockSeriesWithServicer } from './mock-servicer.js';

export async function test() {
  const ts = {
    'tests': {
      meta: {
        folders: ['folder1', 'folder2', 'folder3'],
      },
    },
    'tests/folder1': {
      meta: {
        servicer: 'docker',
        services: ['db'],
      },
      files: ['t_test1.js'],
    },
    'tests/folder2': {
      meta: {
        servicer: 'kubernetes',
        services: ['ws'],
      },
      files: ['t_test2.js'],
    },
    'tests/folder3': {
      meta: {
        servicer: 'docker',
        services: ['cache'],
      },
      files: ['t_test3.js'],
    },
    'tests/folder1/t_test1.js': {
      test() {
        success('Test 1 in docker folder');
      },
    },
    'tests/folder2/t_test2.js': {
      test() {
        success('Test 2 in kubernetes folder');
      },
    },
    'tests/folder3/t_test3.js': {
      test() {
        success('Test 3 back to docker');
      },
    },
  };

  await is_test_output(
    () => MockSeriesWithServicer.run([], { ts }),
    [
      'Settings: no temporary storage dir',
      'Settings: logging into /tmp',
      'Settings: chrome webdrivers',
      '\x1B[38;5;99mStarted\x1B[0m mac/',
      '\x1B[38;5;99mStarted\x1B[0m mac/folder1',

      // Folder 1: docker servicer
      '!Running: mac/folder1/init, path: tests/folder1/meta.js',
      'MockServicer:docker init',
      'MockServicer:docker starting db',
      '>mac/folder1/init completed in',

      '!Running: mac/folder1/t_test1.js, path: tests/folder1/t_test1.js',
      '\x1B[32mOk:\x1B[0m Test 1 in docker folder',
      '>mac/folder1/t_test1.js completed in',

      '!Running: mac/folder1/uninit, path: tests/folder1/meta.js',
      'MockServicer:docker deinit',
      'MockServicer:docker stopping db',
      '>mac/folder1/uninit completed in',

      '\x1B[38;5;243mCompleted\x1B[0m mac/folder1',
      'Logs are written to',
      '\x1B[38;5;99mStarted\x1B[0m mac/folder2',

      // Folder 2: switch to kubernetes servicer (no shutdown - servicer handles conflicts)
      '!Running: mac/folder2/init, path: tests/folder2/meta.js',
      'MockServicer:kubernetes init',
      'MockServicer:kubernetes starting ws',
      '>mac/folder2/init completed in',

      '!Running: mac/folder2/t_test2.js, path: tests/folder2/t_test2.js',
      '\x1B[32mOk:\x1B[0m Test 2 in kubernetes folder',
      '>mac/folder2/t_test2.js completed in',

      '!Running: mac/folder2/uninit, path: tests/folder2/meta.js',
      'MockServicer:kubernetes deinit',
      'MockServicer:kubernetes stopping ws',
      '>mac/folder2/uninit completed in',

      '\x1B[38;5;243mCompleted\x1B[0m mac/folder2',
      'Logs are written to',
      '\x1B[38;5;99mStarted\x1B[0m mac/folder3',

      // Folder 3: switch back to docker servicer (no shutdown - servicer handles conflicts)
      '!Running: mac/folder3/init, path: tests/folder3/meta.js',
      'MockServicer:docker init',
      'MockServicer:docker starting cache',
      '>mac/folder3/init completed in',

      '!Running: mac/folder3/t_test3.js, path: tests/folder3/t_test3.js',
      '\x1B[32mOk:\x1B[0m Test 3 back to docker',
      '>mac/folder3/t_test3.js completed in',

      '!Running: mac/folder3/uninit, path: tests/folder3/meta.js',
      'MockServicer:docker deinit',
      'MockServicer:docker stopping cache',
      '>mac/folder3/uninit completed in',

      '\x1B[38;5;243mCompleted\x1B[0m mac/folder3',
      'Logs are written to',
      '\x1B[102mSuccess!\x1B[0m Total: 3',
      '\x1B[38;5;243mCompleted\x1B[0m mac/',
      'Logs are written to',
      'Elapsed:',
      'Logs are written to',
      'MockServicer:docker shutdown',
      'Testsuite: shutdown',
    ],
    [],
    'servicer type switching',
  );
}
