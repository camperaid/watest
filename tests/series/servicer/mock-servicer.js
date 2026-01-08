import { log } from '../../../logging/logging.js';
import { MockSeries } from '../mock-series.js';

/**
 * Mock servicer for testing servicer lifecycle.
 * Logs all operations for test validation.
 */
class MockServicer {
  constructor(type) {
    this.type = type;
    this.services = new Set();
  }

  async init(services) {
    log(`MockServicer:${this.type} init`);
    if (services) {
      for (const service of services) {
        await this.start(service);
      }
    }
  }

  async deinit(services) {
    log(`MockServicer:${this.type} deinit`);
    if (services) {
      for (const service of [...services].reverse()) {
        await this.stop(service);
      }
    }
  }

  async start(service) {
    log(`MockServicer:${this.type} starting ${service}`);
    this.services.add(service);
    return { started: service, type: this.type };
  }

  async stop(service) {
    log(`MockServicer:${this.type} stopping ${service}`);
    this.services.delete(service);
    return { stopped: service, type: this.type };
  }

  async shutdown() {
    const servicesStr =
      this.services.size > 0
        ? ` (services still running: ${Array.from(this.services).join(', ')})`
        : '';
    log(`MockServicer:${this.type} shutdown${servicesStr}`);
    return { shutdown: true, type: this.type };
  }

  async ontest() {
    return null;
  }
}

/**
 * MockSeries with servicer support.
 * Creates MockServicer instances for testing.
 */
class MockSeriesWithServicer extends MockSeries {
  createServicer(type) {
    return new MockServicer(type || 'docker');
  }
}

export { MockServicer, MockSeriesWithServicer };
