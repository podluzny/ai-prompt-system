/**
 * Configuration for test execution
 */
export const TEST_CONFIG = {
  /**
   * Maximum number of retry attempts for failed requests
   */
  MAX_RETRY_ATTEMPTS: 1,

  /**
   * Delay between retry attempts in milliseconds
   * Default: 30000ms (30 seconds) 30_000
   */
  RETRY_DELAY_MS: 2_000,

  /**
   * Maximum number of concurrent requests
   */
  MAX_CONCURRENT_REQUESTS: 2,

  /**
   * Request timeout in milliseconds
   * If response is not received within this time, the request is considered failed
   * Default: 30000ms (30 seconds)
   */
  REQUEST_TIMEOUT_MS: 30_000,
} as const

export type TestConfig = typeof TEST_CONFIG
