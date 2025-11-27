import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Schema for getAttribute tool input
 */
export const GetAttributeInputSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  selector: z.string().describe('CSS selector to target element'),
  attribute: z.string().describe('Attribute name to extract (e.g., href, src, class, id, data-*)'),
  all: z.boolean().default(false).optional().describe('Get attribute from all matching elements'),
  timeout: z.number().default(5000).optional().describe('Timeout in milliseconds'),
});

export type GetAttributeInput = z.infer<typeof GetAttributeInputSchema>;

/**
 * Schema for getAttribute tool output
 */
export const GetAttributeOutputSchema = z.object({
  value: z.union([z.string().nullable(), z.array(z.string().nullable())]).describe('Attribute value(s)'),
  attribute: z.string().describe('Attribute name'),
  selector: z.string().describe('Selector used'),
  count: z.number().optional().describe('Number of elements found (for all=true)'),
});

export type GetAttributeOutput = z.infer<typeof GetAttributeOutputSchema>;

/**
 * Get attribute value from element(s)
 *
 * Features:
 * - Smart waiting for elements
 * - Support for Shadow DOM
 * - Handle missing attributes gracefully
 * - Support for data-* attributes
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Attribute value(s) from element(s)
 */
export async function getAttribute(
  page: Page,
  input: GetAttributeInput
): Promise<GetAttributeOutput> {
  const { selector, attribute, all, timeout } = input;

  try {
    // Wait for the selector to be available
    await page.waitForSelector(selector, {
      timeout,
      state: 'attached'
    });

    if (all) {
      // Get attribute from all matching elements
      const elements = await page.$$(selector);
      const values: (string | null)[] = [];

      for (const element of elements) {
        const value = await element.evaluate((el, attr) => {
          // Check Shadow DOM first
          if (el.shadowRoot) {
            const shadowEl = el.shadowRoot.querySelector('*');
            if (shadowEl) {
              return shadowEl.getAttribute(attr);
            }
          }
          return el.getAttribute(attr);
        }, attribute);

        values.push(value);
      }

      return {
        value: values,
        attribute,
        selector,
        count: values.length,
      };
    } else {
      // Get attribute from first matching element
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      const value = await element.evaluate((el, attr) => {
        // Check Shadow DOM first
        if (el.shadowRoot) {
          const shadowEl = el.shadowRoot.querySelector('*');
          if (shadowEl) {
            return shadowEl.getAttribute(attr);
          }
        }
        return el.getAttribute(attr);
      }, attribute);

      return {
        value,
        attribute,
        selector,
      };
    }
  } catch (error) {
    throw new Error(
      `Failed to get attribute "${attribute}" from selector "${selector}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * MCP tool definition for getAttribute
 */
export const getAttributeTool = {
  name: 'playwright_get_attribute',
  description: 'Extract attribute value from element(s). Supports any HTML attribute including data-* attributes and Shadow DOM.',
  inputSchema: GetAttributeInputSchema,
  outputSchema: GetAttributeOutputSchema,
};
