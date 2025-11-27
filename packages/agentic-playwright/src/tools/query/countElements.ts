/**
 * Count elements tool
 * @module tools/query/countElements
 */

import type { Page } from 'playwright';
import { z } from 'zod';
import { getCurrentPage } from '../../utils/context.js';
import { logger } from '../../utils/logger.js';
import { normalizeSelector } from '../../utils/selectors.js';

/**
 * Zod schema for count elements input
 */
export const CountElementsInputSchema = z.object({
  selector: z.string().describe('CSS selector for elements'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
  state: z.enum(['attached', 'visible']).optional().describe('State filter for counting'),
});

/**
 * Type for count elements input
 */
export type CountElementsInput = z.infer<typeof CountElementsInputSchema>;

/**
 * Zod schema for count elements output
 */
export const CountElementsOutputSchema = z.object({
  count: z.number(),
  selector: z.string(),
});

/**
 * Type for count elements output
 */
export type CountElementsOutput = z.infer<typeof CountElementsOutputSchema>;

/**
 * Result of counting elements
 */
export interface CountElementsResult {
  count: number;
  selector: string;
}

/**
 * Options for counting elements
 */
export interface CountElementsOptions {
  selector: string;
  timeout?: number;
  state?: 'attached' | 'visible';
}

/**
 * Count elements matching a selector
 *
 * @param options - Count options
 * @param page - Optional page instance (uses current page if not provided)
 * @returns Count result
 *
 * @example
 * ```typescript
 * const result = await countElements({ selector: 'li.item' });
 * console.log(`Found ${result.count} items`);
 *
 * // Count only visible elements
 * const visibleResult = await countElements({
 *   selector: 'li.item',
 *   state: 'visible'
 * });
 * console.log(`Found ${visibleResult.count} visible items`);
 * ```
 */
export async function countElements(
  options: CountElementsOptions,
  page?: Page
): Promise<CountElementsResult> {
  const {
    selector: rawSelector,
    timeout = 5000,
    state = 'attached',
  } = options;

  const selector = normalizeSelector(rawSelector);
  const currentPage = page || getCurrentPage();

  logger.debug(`Counting elements: ${selector}`, { state, timeout });

  try {
    const locator = currentPage.locator(selector);

    // Wait for at least one element if using attached state
    if (state === 'attached') {
      try {
        await locator.first().waitFor({ state: 'attached', timeout });
      } catch {
        // No elements found
        logger.debug(`No elements found: ${selector}`);
        return {
          count: 0,
          selector,
        };
      }
    }

    // Count elements based on state
    let count: number;

    if (state === 'visible') {
      // Count only visible elements
      const allCount = await locator.count();
      let visibleCount = 0;

      for (let i = 0; i < allCount; i++) {
        try {
          const isVisible = await locator.nth(i).isVisible();
          if (isVisible) {
            visibleCount++;
          }
        } catch {
          // Element might be stale, skip it
        }
      }

      count = visibleCount;
    } else {
      // Count all attached elements
      count = await locator.count();
    }

    logger.debug(`Element count: ${selector}`, { count, state });

    return {
      count,
      selector,
    };
  } catch (error) {
    logger.error(`Error counting elements: ${selector}`, error);
    throw error;
  }
}

/**
 * Count all elements (shorthand)
 *
 * @param selector - Element selector
 * @param page - Optional page instance
 * @returns Number of elements
 */
export async function count(selector: string, page?: Page): Promise<number> {
  const result = await countElements({ selector }, page);
  return result.count;
}

/**
 * Count visible elements
 *
 * @param selector - Element selector
 * @param page - Optional page instance
 * @returns Number of visible elements
 */
export async function countVisible(selector: string, page?: Page): Promise<number> {
  const result = await countElements({ selector, state: 'visible' }, page);
  return result.count;
}

/**
 * Check if element count matches expected value
 *
 * @param selector - Element selector
 * @param expectedCount - Expected number of elements
 * @param page - Optional page instance
 * @returns True if count matches
 */
export async function hasCount(
  selector: string,
  expectedCount: number,
  page?: Page
): Promise<boolean> {
  const result = await countElements({ selector }, page);
  return result.count === expectedCount;
}

/**
 * Wait for element count to reach expected value
 *
 * @param selector - Element selector
 * @param expectedCount - Expected number of elements
 * @param timeout - Timeout in milliseconds
 * @param page - Optional page instance
 * @returns True if count reached expected value
 */
export async function waitForCount(
  selector: string,
  expectedCount: number,
  timeout: number = 10000,
  page?: Page
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await countElements({ selector, timeout: 1000 }, page);

    if (result.count === expectedCount) {
      return true;
    }

    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return false;
}

/**
 * Wait for at least N elements
 *
 * @param selector - Element selector
 * @param minCount - Minimum number of elements
 * @param timeout - Timeout in milliseconds
 * @param page - Optional page instance
 * @returns True if minimum count reached
 */
export async function waitForMinCount(
  selector: string,
  minCount: number,
  timeout: number = 10000,
  page?: Page
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await countElements({ selector, timeout: 1000 }, page);

    if (result.count >= minCount) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return false;
}

/**
 * Get count statistics for multiple selectors
 *
 * @param selectors - Array of element selectors
 * @param page - Optional page instance
 * @returns Map of selector to count
 */
export async function getCountMap(
  selectors: string[],
  page?: Page
): Promise<Map<string, number>> {
  const results = await Promise.all(
    selectors.map(async selector => {
      try {
        const result = await countElements({ selector, timeout: 2000 }, page);
        return { selector, count: result.count };
      } catch {
        return { selector, count: 0 };
      }
    })
  );

  return new Map(results.map(r => [r.selector, r.count]));
}

/**
 * Check if selector matches exactly one element
 *
 * @param selector - Element selector
 * @param page - Optional page instance
 * @returns True if exactly one element matches
 */
export async function isUnique(selector: string, page?: Page): Promise<boolean> {
  const result = await countElements({ selector }, page);
  return result.count === 1;
}
