/**
 * Click interaction tool
 * @module tools/interaction/click
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface ClickOptions {
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
  timeout?: number;
  force?: boolean;
}

export interface ClickResult {
  success: boolean;
  selector: string;
  button?: string;
  clickCount?: number;
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
 * Click an element with retry logic
 */
export async function click(options: ClickOptions): Promise<ClickResult> {
  const {
    selector,
    button = 'left',
    clickCount = 1,
    modifiers = [],
    timeout = DEFAULT_TIMEOUT,
    force = false,
  } = options;

  logger.info(`Clicking element: ${selector}`, { button, clickCount, modifiers });

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      // Wait for element to be actionable
      await page.waitForSelector(selector, {
        state: 'visible',
        timeout,
      });

      // Perform click
      await page.click(selector, {
        button,
        clickCount,
        modifiers,
        timeout,
        force,
      });

      logger.debug(`Click successful: ${selector}`);

      return {
        success: true,
        selector,
        button,
        clickCount,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Click attempt ${attempt}/${MAX_RETRIES} failed: ${selector}`,
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
    throw new TimeoutError(`click ${selector}`, timeout, { selector, lastError });
  }

  throw new ElementNotFoundError(selector, { lastError });
}

/**
 * Click element and wait for navigation
 */
export async function clickAndWait(
  options: ClickOptions
): Promise<ClickResult & { url: string | undefined }> {
  const page = getCurrentPage();

  try {
    const [response] = await Promise.all([
      page.waitForNavigation({ timeout: options.timeout || DEFAULT_TIMEOUT }),
      click(options),
    ]);

    const result = await click(options);
    return {
      ...result,
      url: response?.url(),
    };
  } catch (error) {
    logger.error('Click and wait failed', error);
    throw error;
  }
}
