/**
 * Hover interaction tool
 * @module tools/interaction/hover
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface HoverOptions {
  selector: string;
  timeout?: number;
  force?: boolean;
  noWaitAfter?: boolean;
  position?: { x: number; y: number };
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
}

export interface HoverResult {
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
 * Hover over an element
 */
export async function hover(options: HoverOptions): Promise<HoverResult> {
  const {
    selector,
    timeout = DEFAULT_TIMEOUT,
    force = false,
    noWaitAfter = false,
    position,
    modifiers,
  } = options;

  logger.info(`Hovering over element: ${selector}`);

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      // Wait for element to be actionable
      await page.waitForSelector(selector, {
        state: 'visible',
        timeout,
      });

      // Hover over the element
      const hoverOptions: {
        timeout: number;
        force: boolean;
        noWaitAfter: boolean;
        position?: { x: number; y: number };
        modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
      } = {
        timeout,
        force,
        noWaitAfter,
      };
      if (position !== undefined) {
        hoverOptions.position = position;
      }
      if (modifiers !== undefined) {
        hoverOptions.modifiers = modifiers;
      }
      await page.hover(selector, hoverOptions);

      logger.debug(`Hover successful: ${selector}`);

      return {
        success: true,
        selector,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Hover attempt ${attempt}/${MAX_RETRIES} failed: ${selector}`,
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
    throw new TimeoutError(`hover ${selector}`, timeout, {
      selector,
      lastError,
    });
  }

  throw new ElementNotFoundError(selector, { lastError });
}
