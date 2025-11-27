/**
 * Wait for selector tool
 * @module tools/query/waitForSelector
 */

import type { Page } from 'playwright';
import { z } from 'zod';
import { getCurrentPage } from '../../utils/context.js';
import { TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { normalizeSelector } from '../../utils/selectors.js';

/**
 * Element state to wait for
 */
export type ElementState = 'attached' | 'detached' | 'visible' | 'hidden';

/**
 * Zod schema for wait for selector input
 */
export const WaitForSelectorInputSchema = z.object({
  selector: z.string().describe('CSS selector for the element'),
  state: z.enum(['attached', 'detached', 'visible', 'hidden']).optional().describe('State to wait for'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
  strict: z.boolean().optional().describe('Require exactly one match'),
});

/**
 * Type for wait for selector input
 */
export type WaitForSelectorInput = z.infer<typeof WaitForSelectorInputSchema>;

/**
 * Zod schema for wait for selector output
 */
export const WaitForSelectorOutputSchema = z.object({
  success: z.boolean(),
  selector: z.string(),
  state: z.enum(['attached', 'detached', 'visible', 'hidden']),
  duration: z.number().optional(),
});

/**
 * Type for wait for selector output
 */
export type WaitForSelectorOutput = z.infer<typeof WaitForSelectorOutputSchema>;

/**
 * Result of waiting for selector
 */
export interface WaitForSelectorResult {
  success: boolean;
  selector: string;
  state: ElementState;
  duration?: number;
}

/**
 * Options for waiting for selector
 */
export interface WaitForSelectorOptions {
  selector: string;
  state?: ElementState;
  timeout?: number;
  strict?: boolean;
}

/**
 * Wait for an element to reach a specific state
 *
 * @param options - Wait options
 * @param page - Optional page instance (uses current page if not provided)
 * @returns Wait result
 *
 * @example
 * ```typescript
 * // Wait for element to be visible
 * await waitForSelector({
 *   selector: 'button.submit',
 *   state: 'visible',
 *   timeout: 5000
 * });
 *
 * // Wait for element to be hidden
 * await waitForSelector({
 *   selector: '.loading-spinner',
 *   state: 'hidden',
 *   timeout: 10000
 * });
 * ```
 */
export async function waitForSelector(
  options: WaitForSelectorOptions,
  page?: Page
): Promise<WaitForSelectorResult> {
  const {
    selector: rawSelector,
    state = 'visible',
    timeout = 30000,
    strict = false,
  } = options;

  const selector = normalizeSelector(rawSelector);
  const currentPage = page || getCurrentPage();

  logger.debug(`Waiting for selector: ${selector}`, { state, timeout, strict });

  const startTime = Date.now();

  try {
    const locator = currentPage.locator(selector);

    // If strict mode, ensure only one element matches
    if (strict) {
      const count = await locator.count();
      if (count > 1) {
        throw new Error(`Strict mode: Multiple elements (${count}) match selector: ${selector}`);
      }
    }

    // Wait for the specified state
    await locator.first().waitFor({ state, timeout });

    const duration = Date.now() - startTime;
    logger.debug(`Selector reached state: ${selector}`, { state, duration });

    return {
      success: true,
      selector,
      state,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof Error && error.name === 'TimeoutError') {
      logger.debug(`Timeout waiting for selector: ${selector}`, { state, duration });
      throw new TimeoutError(
        `waitForSelector: ${selector} (state: ${state})`,
        timeout,
        error
      );
    }

    logger.error(`Error waiting for selector: ${selector}`, error);
    throw error;
  }
}

/**
 * Wait for element to be visible
 *
 * @param selector - Element selector
 * @param timeout - Timeout in milliseconds
 * @param page - Optional page instance
 * @returns Wait result
 */
export async function waitForVisible(
  selector: string,
  timeout?: number,
  page?: Page
): Promise<WaitForSelectorResult> {
  return waitForSelector({ selector, state: 'visible', timeout }, page);
}

/**
 * Wait for element to be hidden
 *
 * @param selector - Element selector
 * @param timeout - Timeout in milliseconds
 * @param page - Optional page instance
 * @returns Wait result
 */
export async function waitForHidden(
  selector: string,
  timeout?: number,
  page?: Page
): Promise<WaitForSelectorResult> {
  return waitForSelector({ selector, state: 'hidden', timeout }, page);
}

/**
 * Wait for element to be attached to DOM
 *
 * @param selector - Element selector
 * @param timeout - Timeout in milliseconds
 * @param page - Optional page instance
 * @returns Wait result
 */
export async function waitForAttached(
  selector: string,
  timeout?: number,
  page?: Page
): Promise<WaitForSelectorResult> {
  return waitForSelector({ selector, state: 'attached', timeout }, page);
}

/**
 * Wait for element to be detached from DOM
 *
 * @param selector - Element selector
 * @param timeout - Timeout in milliseconds
 * @param page - Optional page instance
 * @returns Wait result
 */
export async function waitForDetached(
  selector: string,
  timeout?: number,
  page?: Page
): Promise<WaitForSelectorResult> {
  return waitForSelector({ selector, state: 'detached', timeout }, page);
}

/**
 * Wait for selector with retry logic
 *
 * @param selector - Element selector
 * @param state - Element state to wait for
 * @param maxRetries - Maximum number of retries
 * @param retryDelay - Delay between retries in milliseconds
 * @param page - Optional page instance
 * @returns Wait result
 */
export async function waitForSelectorWithRetry(
  selector: string,
  state: ElementState = 'visible',
  maxRetries: number = 3,
  retryDelay: number = 1000,
  page?: Page
): Promise<WaitForSelectorResult> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Wait attempt ${attempt}/${maxRetries} for: ${selector}`);
      return await waitForSelector({ selector, state, timeout: 5000 }, page);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        logger.debug(`Retry ${attempt} failed, waiting ${retryDelay}ms before next attempt`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  logger.error(`All ${maxRetries} attempts failed for: ${selector}`);
  throw lastError || new Error('Wait for selector failed');
}
