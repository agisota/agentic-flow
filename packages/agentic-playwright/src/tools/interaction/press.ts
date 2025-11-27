/**
 * Press keyboard key interaction tool
 * @module tools/interaction/press
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface PressOptions {
  selector?: string; // Optional - if not provided, presses key on page
  key: string; // e.g., 'Enter', 'Escape', 'Tab', 'ArrowDown', 'Control+C'
  delay?: number;
  timeout?: number;
  noWaitAfter?: boolean;
}

export interface PressResult {
  success: boolean;
  key: string;
  selector: string | undefined;
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
 * Press a keyboard key
 */
export async function press(options: PressOptions): Promise<PressResult> {
  const {
    selector,
    key,
    delay,
    timeout = DEFAULT_TIMEOUT,
    noWaitAfter = false,
  } = options;

  logger.info(`Pressing key: ${key}`, { selector });

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      if (selector) {
        // Wait for element to be actionable
        await page.waitForSelector(selector, {
          state: 'visible',
          timeout,
        });

        // Press key on specific element
        const pressOptions: {
          delay?: number;
          timeout: number;
          noWaitAfter: boolean;
        } = {
          timeout,
          noWaitAfter,
        };
        if (delay !== undefined) {
          pressOptions.delay = delay;
        }
        await page.press(selector, key, pressOptions);
      } else {
        // Press key on page
        const keyboardOptions: { delay?: number } = {};
        if (delay !== undefined) {
          keyboardOptions.delay = delay;
        }
        await page.keyboard.press(key, keyboardOptions);
      }

      logger.debug(`Key press successful: ${key}`, { selector });

      return {
        success: true,
        key,
        selector: selector ?? undefined,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Press attempt ${attempt}/${MAX_RETRIES} failed: ${key}`,
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
    throw new TimeoutError(`press ${key}`, timeout, { key, selector, lastError });
  }

  if (selector) {
    throw new ElementNotFoundError(selector, { lastError });
  }

  throw new Error(`Failed to press key: ${key}`);
}
