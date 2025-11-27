/**
 * Uncheck checkbox interaction tool
 * @module tools/interaction/uncheck
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface UncheckOptions {
  selector: string;
  timeout?: number;
  force?: boolean;
  noWaitAfter?: boolean;
}

export interface UncheckResult {
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
 * Uncheck a checkbox
 */
export async function uncheck(options: UncheckOptions): Promise<UncheckResult> {
  const {
    selector,
    timeout = DEFAULT_TIMEOUT,
    force = false,
    noWaitAfter = false,
  } = options;

  logger.info(`Unchecking checkbox: ${selector}`);

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      // Wait for element to be actionable
      await page.waitForSelector(selector, {
        state: 'visible',
        timeout,
      });

      // Uncheck the checkbox
      await page.uncheck(selector, {
        timeout,
        force,
        noWaitAfter,
      });

      // Verify it's unchecked
      const isChecked = await page.isChecked(selector);

      logger.debug(`Uncheck successful: ${selector}`, { checked: isChecked });

      return {
        success: true,
        selector,
        checked: isChecked,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Uncheck attempt ${attempt}/${MAX_RETRIES} failed: ${selector}`,
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
    throw new TimeoutError(`uncheck ${selector}`, timeout, {
      selector,
      lastError,
    });
  }

  throw new ElementNotFoundError(selector, { lastError });
}
