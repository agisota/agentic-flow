/**
 * Check checkbox interaction tool
 * @module tools/interaction/check
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface CheckOptions {
  selector: string;
  timeout?: number;
  force?: boolean;
  noWaitAfter?: boolean;
}

export interface CheckResult {
  success: boolean;
  selector: string;
  checked: boolean;
  error?: string;
}

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Wait and retry helper
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check a checkbox
 */
export async function check(options: CheckOptions): Promise<CheckResult> {
  const {
    selector,
    timeout = DEFAULT_TIMEOUT,
    force = false,
    noWaitAfter = false,
  } = options;

  logger.info(`Checking checkbox: ${selector}`);

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      // Wait for element to be actionable
      await page.waitForSelector(selector, {
        state: 'visible',
        timeout,
      });

      // Check the checkbox
      await page.check(selector, {
        timeout,
        force,
        noWaitAfter,
      });

      // Verify it's checked
      const isChecked = await page.isChecked(selector);

      logger.debug(`Check successful: ${selector}`, { checked: isChecked });

      return {
        success: true,
        selector,
        checked: isChecked,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Check attempt ${attempt}/${MAX_RETRIES} failed: ${selector}`,
        error
      );

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY);
      }
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || 'Unknown error';

  if (errorMessage.includes('Timeout') || errorMessage.includes('timeout')) {
    throw new TimeoutError(`check ${selector}`, timeout, {
      selector,
      lastError,
    });
  }

  throw new ElementNotFoundError(selector, { lastError });
}
