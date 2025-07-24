/**
 * Manages services requested by a testsuite.
 */
class Servicer {
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
  shutdown() {
  }

  /**
   * Called when test is started.
   */
  ontest(/* testname */) {}

  has(/* service */) {}

  get(/* service */) {}
}

export default new Servicer();
