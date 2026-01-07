/**
 * Manages services requested by a testsuite.
 */
class Servicer {
  /**
   * Initialize servicer and optionally start services.
   * Called at the beginning of a test folder.
   */
  async init(/* services */) {}

  /**
   * Deinitialize servicer and stop services.
   * Called at the end of a test folder.
   */
  async deinit(/* services */) {}

  /**
   * Starts a service.
   */
  start(/* service */) {}

  /**
   * Stops the service.
   */
  stop(/* service */) {}

  /**
   * Called when the testsuite gets shutdown.
   */
  shutdown() {}

  /**
   * Called when test is started.
   */
  ontest(/* testname */) {}

  has(/* service */) {}

  get(/* service */) {}
}

export default new Servicer();
