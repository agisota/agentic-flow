/**
 * Type text interaction tool (simulates human typing)
 * @module tools/interaction/type
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface TypeOptions {
  selector: string;
  text: string;
  delay?: number; // ms between keystrokes
  timeout?: number;
  noWaitAfter?: boolean;
}

export interface TypeResult {
  success: boolean;
  selector: string;
  text: string;
  charactersTyped: number;
  error?: string;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_DELAY = 50; // 50ms between keys simulates human typing
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Wait and retry helper
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Type text into an element with human-like delay
 */
export async function type(options: TypeOptions): Promise<TypeResult> {
  const {
    selector,
    text,
    delay = DEFAULT_DELAY,
    timeout = DEFAULT_TIMEOUT,
    noWaitAfter = false,
  } = options;

  logger.info(`Typing text into element: ${selector}`, {
    textLength: text.length,
    delay,
  });

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      // Wait for element to be actionable
      await page.waitForSelector(selector, {
        state: 'visible',
        timeout,
      });

      // Focus the element first
      await page.focus(selector);

      // Type with delay
      await page.type(selector, text, {
        delay,
        timeout,
        noWaitAfter,
      });

      logger.debug(`Type successful: ${selector}`, { charactersTyped: text.length });

      return {
        success: true,
        selector,
        text,
        charactersTyped: text.length,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Type attempt ${attempt}/${MAX_RETRIES} failed: ${selector}`,
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
    throw new TimeoutError(`type into ${selector}`, timeout, {
      selector,
      lastError,
    });
  }

  throw new ElementNotFoundError(selector, { lastError });
}
