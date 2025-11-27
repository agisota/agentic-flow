/**
 * Focus interaction tool
 * @module tools/interaction/focus
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface FocusOptions {
  selector: string;
  timeout?: number;
}

export interface FocusResult {
  success: boolean;
  selector: string;
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
 * Focus an element
 */
export async function focus(options: FocusOptions): Promise<FocusResult> {
  const { selector, timeout = DEFAULT_TIMEOUT } = options;

  logger.info(`Focusing element: ${selector}`);

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      // Wait for element to be actionable
      await page.waitForSelector(selector, {
        state: 'visible',
        timeout,
      });

      // Focus the element
      await page.focus(selector, { timeout });

      logger.debug(`Focus successful: ${selector}`);

      return {
        success: true,
        selector,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Focus attempt ${attempt}/${MAX_RETRIES} failed: ${selector}`,
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
    throw new TimeoutError(`focus ${selector}`, timeout, {
      selector,
      lastError,
    });
  }

  throw new ElementNotFoundError(selector, { lastError });
}
