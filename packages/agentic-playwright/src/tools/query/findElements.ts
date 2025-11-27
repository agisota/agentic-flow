/**
 * Find multiple elements tool
 * @module tools/query/findElements
 */

import type { Page } from 'playwright';
import { z } from 'zod';
import { getCurrentPage } from '../../utils/context.js';
import { logger } from '../../utils/logger.js';
import { normalizeSelector } from '../../utils/selectors.js';

/**
 * Zod schema for element info
 */
export const ElementInfoSchema = z.object({
  index: z.number(),
  tag: z.string(),
  text: z.string().optional(),
  attributes: z.record(z.string()),
  visible: z.boolean(),
  enabled: z.boolean(),
});

/**
 * Zod schema for finding multiple elements input
 */
export const FindElementsInputSchema = z.object({
  selector: z.string().describe('CSS selector for elements'),
  limit: z.number().optional().describe('Maximum number of elements to return'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
});

/**
 * Type for finding multiple elements input
 */
export type FindElementsInput = z.infer<typeof FindElementsInputSchema>;

/**
 * Zod schema for finding multiple elements output
 */
export const FindElementsOutputSchema = z.object({
  elements: z.array(ElementInfoSchema),
  count: z.number(),
  selector: z.string(),
});

/**
 * Type for finding multiple elements output
 */
export type FindElementsOutput = z.infer<typeof FindElementsOutputSchema>;

/**
 * Information about a single element
 */
export interface ElementInfo {
  index: number;
  tag: string;
  text?: string;
  attributes: Record<string, string>;
  visible: boolean;
  enabled: boolean;
}

/**
 * Result of finding multiple elements
 */
export interface FindElementsResult {
  elements: ElementInfo[];
  count: number;
  selector: string;
}

/**
 * Options for finding multiple elements
 */
export interface FindElementsOptions {
  selector: string;
  limit?: number;
  timeout?: number;
}

/**
 * Find multiple elements on the page
 *
 * @param options - Find elements options
 * @param page - Optional page instance (uses current page if not provided)
 * @returns Array of element information
 *
 * @example
 * ```typescript
 * const result = await findElements({
 *   selector: 'li.item',
 *   limit: 10
 * });
 *
 * console.log(`Found ${result.count} elements`);
 * result.elements.forEach(el => {
 *   console.log(`${el.tag}: ${el.text}`);
 * });
 * ```
 */
export async function findElements(
  options: FindElementsOptions,
  page?: Page
): Promise<FindElementsResult> {
  const {
    selector: rawSelector,
    limit,
    timeout = 10000,
  } = options;

  const selector = normalizeSelector(rawSelector);
  const currentPage = page || getCurrentPage();

  logger.debug(`Finding elements: ${selector}`, { limit, timeout });

  try {
    // Get all matching elements
    const locator = currentPage.locator(selector);

    // Wait for at least one element (with timeout)
    try {
      await locator.first().waitFor({ state: 'attached', timeout });
    } catch (error) {
      // No elements found
      logger.debug(`No elements found: ${selector}`);
      return {
        elements: [],
        count: 0,
        selector,
      };
    }

    // Get count
    const count = await locator.count();
    const actualLimit = limit && limit < count ? limit : count;

    logger.debug(`Found ${count} elements for: ${selector}`, { limit: actualLimit });

    // Get information for each element (up to limit)
    const elements: ElementInfo[] = [];

    for (let i = 0; i < actualLimit; i++) {
      const element = locator.nth(i);

      try {
        const [tag, text, visible, enabled] = await Promise.all([
          element.evaluate(el => el.tagName.toLowerCase()),
          element.textContent().catch(() => ''),
          element.isVisible().catch(() => false),
          element.isEnabled().catch(() => false),
        ]);

        const attributes = await element.evaluate(el => {
          const attrs: Record<string, string> = {};
          for (const attr of Array.from(el.attributes)) {
            attrs[attr.name] = attr.value;
          }
          return attrs;
        });

        elements.push({
          index: i,
          tag,
          text: text || undefined,
          attributes,
          visible,
          enabled,
        });
      } catch (error) {
        logger.warn(`Error getting info for element ${i}`, error);
        // Continue with next element
      }
    }

    return {
      elements,
      count,
      selector,
    };
  } catch (error) {
    logger.error(`Error finding elements: ${selector}`, error);
    throw error;
  }
}

/**
 * Count elements matching selector
 *
 * @param selector - Element selector
 * @param page - Optional page instance
 * @returns Number of matching elements
 */
export async function countElements(selector: string, page?: Page): Promise<number> {
  const result = await findElements({ selector, timeout: 5000 }, page);
  return result.count;
}

/**
 * Get text content from all matching elements
 *
 * @param selector - Element selector
 * @param page - Optional page instance
 * @returns Array of text content
 */
export async function getAllElementTexts(selector: string, page?: Page): Promise<string[]> {
  const result = await findElements({ selector }, page);
  return result.elements
    .map(el => el.text)
    .filter((text): text is string => text !== undefined);
}

/**
 * Filter elements by visibility
 *
 * @param selector - Element selector
 * @param visible - Filter for visible (true) or hidden (false) elements
 * @param page - Optional page instance
 * @returns Filtered elements
 */
export async function filterElementsByVisibility(
  selector: string,
  visible: boolean,
  page?: Page
): Promise<ElementInfo[]> {
  const result = await findElements({ selector }, page);
  return result.elements.filter(el => el.visible === visible);
}

/**
 * Get first N elements
 *
 * @param selector - Element selector
 * @param count - Number of elements to get
 * @param page - Optional page instance
 * @returns First N elements
 */
export async function getFirstElements(
  selector: string,
  count: number,
  page?: Page
): Promise<ElementInfo[]> {
  const result = await findElements({ selector, limit: count }, page);
  return result.elements;
}
