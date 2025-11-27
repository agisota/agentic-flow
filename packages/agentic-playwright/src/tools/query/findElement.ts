/**
 * Find single element tool
 * @module tools/query/findElement
 */

import type { Page } from 'playwright';
import { z } from 'zod';
import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { normalizeSelector } from '../../utils/selectors.js';

/**
 * Zod schema for finding an element
 */
export const FindElementInputSchema = z.object({
  selector: z.string().describe('CSS selector for the element'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
  strict: z.boolean().optional().describe('Require exactly one match'),
});

/**
 * Type for finding an element input
 */
export type FindElementInput = z.infer<typeof FindElementInputSchema>;

/**
 * Zod schema for find element result
 */
export const FindElementOutputSchema = z.object({
  found: z.boolean(),
  selector: z.string(),
  tag: z.string().optional(),
  text: z.string().optional(),
  attributes: z.record(z.string()).optional(),
  visible: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

/**
 * Type for finding an element result
 */
export type FindElementOutput = z.infer<typeof FindElementOutputSchema>;

/**
 * Result of finding an element
 */
export interface FindElementResult {
  found: boolean;
  selector: string;
  tag?: string;
  text?: string;
  attributes?: Record<string, string>;
  visible?: boolean;
  enabled?: boolean;
}

/**
 * Options for finding an element
 */
export interface FindElementOptions {
  selector: string;
  timeout?: number;
  strict?: boolean;
}

/**
 * Find a single element on the page
 *
 * @param options - Find element options
 * @param page - Optional page instance (uses current page if not provided)
 * @returns Element information
 *
 * @example
 * ```typescript
 * const result = await findElement({
 *   selector: 'button.submit',
 *   timeout: 5000
 * });
 *
 * if (result.found) {
 *   console.log(`Found ${result.tag} with text: ${result.text}`);
 * }
 * ```
 */
export async function findElement(
  options: FindElementOptions,
  page?: Page
): Promise<FindElementResult> {
  const {
    selector: rawSelector,
    timeout = 10000,
    strict = false,
  } = options;

  const selector = normalizeSelector(rawSelector);
  const currentPage = page || getCurrentPage();

  logger.debug(`Finding element: ${selector}`, { timeout, strict });

  try {
    // Wait for element to be attached
    const locator = currentPage.locator(selector);

    // Set strict mode if requested
    if (strict) {
      await locator.first().waitFor({ state: 'attached', timeout });
    } else {
      await locator.first().waitFor({ state: 'attached', timeout });
    }

    // Check if element exists
    const count = await locator.count();
    if (count === 0) {
      logger.debug(`Element not found: ${selector}`);
      return {
        found: false,
        selector,
      };
    }

    if (strict && count > 1) {
      logger.warn(`Multiple elements found (${count}) for selector: ${selector}`);
    }

    // Get the first matching element
    const element = locator.first();

    // Get element information
    const [tag, text, visible, enabled] = await Promise.all([
      element.evaluate(el => el.tagName.toLowerCase()),
      element.textContent().catch(() => ''),
      element.isVisible().catch(() => false),
      element.isEnabled().catch(() => false),
    ]);

    // Get attributes
    const attributes = await element.evaluate(el => {
      const attrs: Record<string, string> = {};
      for (const attr of Array.from(el.attributes)) {
        attrs[attr.name] = attr.value;
      }
      return attrs;
    });

    logger.debug(`Element found: ${selector}`, { tag, text: text?.substring(0, 50) });

    return {
      found: true,
      selector,
      tag,
      text: text || undefined,
      attributes,
      visible,
      enabled,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      logger.debug(`Element not found (timeout): ${selector}`);
      throw new TimeoutError(`findElement: ${selector}`, timeout, error);
    }

    logger.error(`Error finding element: ${selector}`, error);
    throw new ElementNotFoundError(selector, error);
  }
}

/**
 * Check if element exists (shorthand for findElement)
 *
 * @param selector - Element selector
 * @param page - Optional page instance
 * @returns True if element exists
 */
export async function elementExists(selector: string, page?: Page): Promise<boolean> {
  try {
    const result = await findElement({ selector, timeout: 5000 }, page);
    return result.found;
  } catch {
    return false;
  }
}

/**
 * Get element text content
 *
 * @param selector - Element selector
 * @param page - Optional page instance
 * @returns Element text content or null if not found
 */
export async function getElementText(selector: string, page?: Page): Promise<string | null> {
  try {
    const result = await findElement({ selector }, page);
    return result.found ? (result.text || null) : null;
  } catch {
    return null;
  }
}

/**
 * Get element attribute
 *
 * @param selector - Element selector
 * @param attributeName - Attribute name
 * @param page - Optional page instance
 * @returns Attribute value or null if not found
 */
export async function getElementAttribute(
  selector: string,
  attributeName: string,
  page?: Page
): Promise<string | null> {
  try {
    const result = await findElement({ selector }, page);
    return result.found ? (result.attributes?.[attributeName] || null) : null;
  } catch {
    return null;
  }
}
