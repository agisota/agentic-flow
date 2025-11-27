/**
 * Check if element is visible tool
 * @module tools/query/isVisible
 */

import type { Page } from 'playwright';
import { z } from 'zod';
import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { normalizeSelector } from '../../utils/selectors.js';

/**
 * Zod schema for is visible input
 */
export const IsVisibleInputSchema = z.object({
  selector: z.string().describe('CSS selector for the element'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
});

/**
 * Type for is visible input
 */
export type IsVisibleInput = z.infer<typeof IsVisibleInputSchema>;

/**
 * Zod schema for is visible output
 */
export const IsVisibleOutputSchema = z.object({
  visible: z.boolean(),
  selector: z.string(),
  exists: z.boolean(),
});

/**
 * Type for is visible output
 */
export type IsVisibleOutput = z.infer<typeof IsVisibleOutputSchema>;

/**
 * Result of visibility check
 */
export interface IsVisibleResult {
  visible: boolean;
  selector: string;
  exists: boolean;
}

/**
 * Options for checking visibility
 */
export interface IsVisibleOptions {
  selector: string;
  timeout?: number;
}

/**
 * Check if an element is visible on the page
 *
 * @param options - Visibility check options
 * @param page - Optional page instance (uses current page if not provided)
 * @returns Visibility result
 *
 * @example
 * ```typescript
 * const result = await isVisible({ selector: 'button.submit' });
 *
 * if (result.visible) {
 *   console.log('Button is visible');
 * } else if (result.exists) {
 *   console.log('Button exists but is hidden');
 * } else {
 *   console.log('Button does not exist');
 * }
 * ```
 */
export async function isVisible(
  options: IsVisibleOptions,
  page?: Page
): Promise<IsVisibleResult> {
  const { selector: rawSelector, timeout = 5000 } = options;

  const selector = normalizeSelector(rawSelector);
  const currentPage = page || getCurrentPage();

  logger.debug(`Checking visibility: ${selector}`, { timeout });

  try {
    const locator = currentPage.locator(selector);

    // Check if element exists first
    try {
      await locator.first().waitFor({ state: 'attached', timeout });
    } catch {
      logger.debug(`Element not found: ${selector}`);
      return {
        visible: false,
        selector,
        exists: false,
      };
    }

    // Check visibility
    const visible = await locator.first().isVisible();

    logger.debug(`Element visibility: ${selector}`, { visible });

    return {
      visible,
      selector,
      exists: true,
    };
  } catch (error) {
    logger.error(`Error checking visibility: ${selector}`, error);
    throw new ElementNotFoundError(selector, error);
  }
}

/**
 * Wait for element to become visible
 *
 * @param selector - Element selector
 * @param timeout - Timeout in milliseconds
 * @param page - Optional page instance
 * @returns True if element became visible
 */
export async function waitUntilVisible(
  selector: string,
  timeout: number = 10000,
  page?: Page
): Promise<boolean> {
  const currentPage = page || getCurrentPage();
  const locator = currentPage.locator(normalizeSelector(selector));

  try {
    await locator.first().waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for element to become hidden
 *
 * @param selector - Element selector
 * @param timeout - Timeout in milliseconds
 * @param page - Optional page instance
 * @returns True if element became hidden
 */
export async function waitUntilHidden(
  selector: string,
  timeout: number = 10000,
  page?: Page
): Promise<boolean> {
  const currentPage = page || getCurrentPage();
  const locator = currentPage.locator(normalizeSelector(selector));

  try {
    await locator.first().waitFor({ state: 'hidden', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if any element in a list is visible
 *
 * @param selectors - Array of element selectors
 * @param page - Optional page instance
 * @returns First visible selector or null
 */
export async function findFirstVisible(
  selectors: string[],
  page?: Page
): Promise<string | null> {
  for (const selector of selectors) {
    try {
      const result = await isVisible({ selector, timeout: 1000 }, page);
      if (result.visible) {
        return selector;
      }
    } catch {
      // Continue to next selector
    }
  }
  return null;
}

/**
 * Check if all elements are visible
 *
 * @param selectors - Array of element selectors
 * @param page - Optional page instance
 * @returns True if all elements are visible
 */
export async function areAllVisible(
  selectors: string[],
  page?: Page
): Promise<boolean> {
  const results = await Promise.all(
    selectors.map(selector =>
      isVisible({ selector, timeout: 5000 }, page).catch(() => ({ visible: false }))
    )
  );

  return results.every(result => result.visible);
}

/**
 * Get visibility status for multiple elements
 *
 * @param selectors - Array of element selectors
 * @param page - Optional page instance
 * @returns Map of selector to visibility status
 */
export async function getVisibilityMap(
  selectors: string[],
  page?: Page
): Promise<Map<string, boolean>> {
  const results = await Promise.all(
    selectors.map(async selector => {
      try {
        const result = await isVisible({ selector, timeout: 2000 }, page);
        return { selector, visible: result.visible };
      } catch {
        return { selector, visible: false };
      }
    })
  );

  return new Map(results.map(r => [r.selector, r.visible]));
}
