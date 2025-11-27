/**
 * Check if element is enabled tool
 * @module tools/query/isEnabled
 */

import type { Page } from 'playwright';
import { z } from 'zod';
import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { normalizeSelector } from '../../utils/selectors.js';

/**
 * Zod schema for is enabled input
 */
export const IsEnabledInputSchema = z.object({
  selector: z.string().describe('CSS selector for the element'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
});

/**
 * Type for is enabled input
 */
export type IsEnabledInput = z.infer<typeof IsEnabledInputSchema>;

/**
 * Zod schema for is enabled output
 */
export const IsEnabledOutputSchema = z.object({
  enabled: z.boolean(),
  selector: z.string(),
  exists: z.boolean(),
});

/**
 * Type for is enabled output
 */
export type IsEnabledOutput = z.infer<typeof IsEnabledOutputSchema>;

/**
 * Result of enabled check
 */
export interface IsEnabledResult {
  enabled: boolean;
  selector: string;
  exists: boolean;
}

/**
 * Options for checking if enabled
 */
export interface IsEnabledOptions {
  selector: string;
  timeout?: number;
}

/**
 * Check if an element is enabled on the page
 *
 * An element is considered enabled if it is not disabled (no disabled attribute)
 * and is not in a disabled state.
 *
 * @param options - Enabled check options
 * @param page - Optional page instance (uses current page if not provided)
 * @returns Enabled result
 *
 * @example
 * ```typescript
 * const result = await isEnabled({ selector: 'button.submit' });
 *
 * if (result.enabled) {
 *   console.log('Button is enabled and can be clicked');
 * } else if (result.exists) {
 *   console.log('Button exists but is disabled');
 * } else {
 *   console.log('Button does not exist');
 * }
 * ```
 */
export async function isEnabled(
  options: IsEnabledOptions,
  page?: Page
): Promise<IsEnabledResult> {
  const { selector: rawSelector, timeout = 5000 } = options;

  const selector = normalizeSelector(rawSelector);
  const currentPage = page || getCurrentPage();

  logger.debug(`Checking if enabled: ${selector}`, { timeout });

  try {
    const locator = currentPage.locator(selector);

    // Check if element exists first
    try {
      await locator.first().waitFor({ state: 'attached', timeout });
    } catch {
      logger.debug(`Element not found: ${selector}`);
      return {
        enabled: false,
        selector,
        exists: false,
      };
    }

    // Check if enabled
    const enabled = await locator.first().isEnabled();

    logger.debug(`Element enabled status: ${selector}`, { enabled });

    return {
      enabled,
      selector,
      exists: true,
    };
  } catch (error) {
    logger.error(`Error checking enabled status: ${selector}`, error);
    throw new ElementNotFoundError(selector, error);
  }
}

/**
 * Wait for element to become enabled
 *
 * @param selector - Element selector
 * @param timeout - Timeout in milliseconds
 * @param page - Optional page instance
 * @returns True if element became enabled
 */
export async function waitUntilEnabled(
  selector: string,
  timeout: number = 10000,
  page?: Page
): Promise<boolean> {
  const currentPage = page || getCurrentPage();
  const locator = currentPage.locator(normalizeSelector(selector));

  try {
    await locator.first().waitFor({ state: 'attached', timeout: 5000 });

    // Poll for enabled state
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const enabled = await locator.first().isEnabled();
      if (enabled) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Wait for element to become disabled
 *
 * @param selector - Element selector
 * @param timeout - Timeout in milliseconds
 * @param page - Optional page instance
 * @returns True if element became disabled
 */
export async function waitUntilDisabled(
  selector: string,
  timeout: number = 10000,
  page?: Page
): Promise<boolean> {
  const currentPage = page || getCurrentPage();
  const locator = currentPage.locator(normalizeSelector(selector));

  try {
    await locator.first().waitFor({ state: 'attached', timeout: 5000 });

    // Poll for disabled state
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const enabled = await locator.first().isEnabled();
      if (!enabled) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if element is disabled (opposite of enabled)
 *
 * @param selector - Element selector
 * @param page - Optional page instance
 * @returns True if element is disabled
 */
export async function isDisabled(
  selector: string,
  page?: Page
): Promise<boolean> {
  const result = await isEnabled({ selector }, page);
  return result.exists && !result.enabled;
}

/**
 * Check if element has disabled attribute
 *
 * @param selector - Element selector
 * @param page - Optional page instance
 * @returns True if element has disabled attribute
 */
export async function hasDisabledAttribute(
  selector: string,
  page?: Page
): Promise<boolean> {
  const currentPage = page || getCurrentPage();
  const locator = currentPage.locator(normalizeSelector(selector));

  try {
    const disabled = await locator.first().getAttribute('disabled');
    return disabled !== null;
  } catch {
    return false;
  }
}

/**
 * Get enabled status for multiple elements
 *
 * @param selectors - Array of element selectors
 * @param page - Optional page instance
 * @returns Map of selector to enabled status
 */
export async function getEnabledMap(
  selectors: string[],
  page?: Page
): Promise<Map<string, boolean>> {
  const results = await Promise.all(
    selectors.map(async selector => {
      try {
        const result = await isEnabled({ selector, timeout: 2000 }, page);
        return { selector, enabled: result.enabled };
      } catch {
        return { selector, enabled: false };
      }
    })
  );

  return new Map(results.map(r => [r.selector, r.enabled]));
}

/**
 * Check if element is editable (enabled and not readonly)
 *
 * @param selector - Element selector
 * @param page - Optional page instance
 * @returns True if element is editable
 */
export async function isEditable(
  selector: string,
  page?: Page
): Promise<boolean> {
  const currentPage = page || getCurrentPage();
  const locator = currentPage.locator(normalizeSelector(selector));

  try {
    const [enabled, readonly] = await Promise.all([
      locator.first().isEnabled(),
      locator.first().getAttribute('readonly'),
    ]);

    return enabled && readonly === null;
  } catch {
    return false;
  }
}
