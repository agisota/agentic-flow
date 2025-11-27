/**
 * Scroll interaction tool
 * @module tools/interaction/scroll
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface ScrollOptions {
  selector?: string; // Optional - scrolls page if not provided
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number; // Pixels to scroll
  timeout?: number;
  // Alternative: scroll to specific position
  position?: { x?: number; y?: number };
  // Alternative: scroll into view
  intoView?: boolean;
}

export interface ScrollResult {
  success: boolean;
  selector: string | undefined;
  scrolled: boolean;
  error?: string;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_SCROLL_AMOUNT = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Wait and retry helper
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scroll page or element
 */
export async function scroll(options: ScrollOptions): Promise<ScrollResult> {
  const {
    selector,
    direction,
    amount = DEFAULT_SCROLL_AMOUNT,
    timeout = DEFAULT_TIMEOUT,
    position,
    intoView = false,
  } = options;

  logger.info(`Scrolling ${selector || 'page'}`, {
    direction,
    amount,
    position,
    intoView,
  });

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      if (selector) {
        // Wait for element if selector is provided
        await page.waitForSelector(selector, {
          state: 'attached',
          timeout,
        });

        if (intoView) {
          // Scroll element into view
          await page.locator(selector).scrollIntoViewIfNeeded({ timeout });
        } else {
          // Scroll within element
          const element = page.locator(selector);
          if (position) {
            await element.evaluate((el, pos) => {
              el.scrollTo({ left: pos.x, top: pos.y, behavior: 'smooth' });
            }, { x: position.x, y: position.y });
          } else {
            await element.evaluate(
              (el, opts) => {
                if (opts.direction) {
                  const scrollMap = {
                    up: { top: -opts.amount, behavior: 'smooth' as const },
                    down: { top: opts.amount, behavior: 'smooth' as const },
                    left: { left: -opts.amount, behavior: 'smooth' as const },
                    right: { left: opts.amount, behavior: 'smooth' as const },
                  };
                  el.scrollBy(scrollMap[opts.direction]);
                }
              },
              { direction, amount }
            );
          }
        }
      } else {
        // Scroll the page
        if (position) {
          await page.evaluate((pos) => {
            (globalThis as any).window.scrollTo({ left: pos.x, top: pos.y, behavior: 'smooth' });
          }, { x: position.x, y: position.y });
        } else {
          await page.evaluate(
            (opts) => {
              if (opts.direction) {
                const scrollMap = {
                  up: { top: -opts.amount, behavior: 'smooth' as const },
                  down: { top: opts.amount, behavior: 'smooth' as const },
                  left: { left: -opts.amount, behavior: 'smooth' as const },
                  right: { left: opts.amount, behavior: 'smooth' as const },
                };
                (globalThis as any).window.scrollBy(scrollMap[opts.direction]);
              }
            },
            { direction, amount }
          );
        }
      }

      logger.debug(`Scroll successful: ${selector || 'page'}`);

      return {
        success: true,
        selector: selector ?? undefined,
        scrolled: true,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Scroll attempt ${attempt}/${MAX_RETRIES} failed: ${selector || 'page'}`,
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
    throw new TimeoutError(`scroll ${selector || 'page'}`, timeout, {
      selector,
      lastError,
    });
  }

  if (selector) {
    throw new ElementNotFoundError(selector, { lastError });
  }

  throw new Error(`Failed to scroll: ${errorMessage}`);
}

/**
 * Scroll to top of page or element
 */
export async function scrollToTop(
  selector?: string,
  timeout?: number
): Promise<ScrollResult> {
  const options: ScrollOptions = {
    position: { x: 0, y: 0 },
  };
  if (selector !== undefined) {
    options.selector = selector;
  }
  if (timeout !== undefined) {
    options.timeout = timeout;
  }
  return scroll(options);
}

/**
 * Scroll to bottom of page or element
 */
export async function scrollToBottom(
  selector?: string,
  timeout?: number
): Promise<ScrollResult> {
  const page = getCurrentPage();

  // Get page or element height
  const height = selector
    ? await page.locator(selector).evaluate(el => el.scrollHeight)
    : await page.evaluate(() => (globalThis as any).document.documentElement.scrollHeight);

  const options: ScrollOptions = {
    position: { x: 0, y: height },
  };
  if (selector !== undefined) {
    options.selector = selector;
  }
  if (timeout !== undefined) {
    options.timeout = timeout;
  }
  return scroll(options);
}
