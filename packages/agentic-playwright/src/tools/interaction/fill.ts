/**
 * Fill input interaction tool (instant, no typing delay)
 * @module tools/interaction/fill
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface FillOptions {
  selector: string;
  value: string;
  timeout?: number;
  force?: boolean;
  noWaitAfter?: boolean;
}

export interface FillResult {
  success: boolean;
  selector: string;
  value: string;
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
 * Fill input field instantly (faster than type)
 */
export async function fill(options: FillOptions): Promise<FillResult> {
  const {
    selector,
    value,
    timeout = DEFAULT_TIMEOUT,
    force = false,
    noWaitAfter = false,
  } = options;

  logger.info(`Filling element: ${selector}`, { valueLength: value.length });

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      // Wait for element to be actionable
      await page.waitForSelector(selector, {
        state: 'visible',
        timeout,
      });

      // Fill the input
      await page.fill(selector, value, {
        timeout,
        force,
        noWaitAfter,
      });

      logger.debug(`Fill successful: ${selector}`);

      return {
        success: true,
        selector,
        value,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Fill attempt ${attempt}/${MAX_RETRIES} failed: ${selector}`,
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
    throw new TimeoutError(`fill ${selector}`, timeout, { selector, lastError });
  }

  throw new ElementNotFoundError(selector, { lastError });
}
