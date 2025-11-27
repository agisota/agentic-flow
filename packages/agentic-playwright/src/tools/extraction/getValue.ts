import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Schema for getValue tool input
 */
export const GetValueInputSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  selector: z.string().describe('CSS selector to target input element'),
  all: z.boolean().default(false).optional().describe('Get value from all matching input elements'),
  timeout: z.number().default(5000).optional().describe('Timeout in milliseconds'),
});

export type GetValueInput = z.infer<typeof GetValueInputSchema>;

/**
 * Schema for getValue tool output
 */
export const GetValueOutputSchema = z.object({
  value: z.union([z.string(), z.array(z.string())]).describe('Input value(s)'),
  selector: z.string().describe('Selector used'),
  count: z.number().optional().describe('Number of elements found (for all=true)'),
});

export type GetValueOutput = z.infer<typeof GetValueOutputSchema>;

/**
 * Get value from input element(s)
 *
 * Features:
 * - Smart waiting for elements
 * - Support for various input types (text, textarea, select, checkbox, radio)
 * - Handle hidden elements gracefully
 * - Support for Shadow DOM
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Value(s) from input element(s)
 */
export async function getValue(
  page: Page,
  input: GetValueInput
): Promise<GetValueOutput> {
  const { selector, all, timeout } = input;

  try {
    // Wait for the selector to be available
    await page.waitForSelector(selector, {
      timeout,
      state: 'attached'
    });

    if (all) {
      // Get value from all matching elements
      const elements = await page.$$(selector);
      const values: string[] = [];

      for (const element of elements) {
        const value = await element.evaluate((el: Element) => {
          let targetEl: Element = el;
          // Check Shadow DOM first
          if (el.shadowRoot) {
            const input = el.shadowRoot.querySelector('input, textarea, select');
            if (input) {
              targetEl = input as HTMLElement;
            }
          }

          // Handle different input types
          if (targetEl instanceof HTMLInputElement) {
            if (targetEl.type === 'checkbox' || targetEl.type === 'radio') {
              return targetEl.checked ? 'true' : 'false';
            }
            return targetEl.value;
          } else if (targetEl instanceof HTMLTextAreaElement) {
            return targetEl.value;
          } else if (targetEl instanceof HTMLSelectElement) {
            return targetEl.value;
          } else {
            // Fallback for other elements
            return (targetEl as any).value || '';
          }
        });

        values.push(value);
      }

      return {
        value: values,
        selector,
        count: values.length,
      };
    } else {
      // Get value from first matching element
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      const value = await element.evaluate((el: Element) => {
        let targetEl: Element = el;
        // Check Shadow DOM first
        if (el.shadowRoot) {
          const input = el.shadowRoot.querySelector('input, textarea, select');
          if (input) {
            targetEl = input as HTMLElement;
          }
        }

        // Handle different input types
        if (targetEl instanceof HTMLInputElement) {
          if (targetEl.type === 'checkbox' || targetEl.type === 'radio') {
            return targetEl.checked ? 'true' : 'false';
          }
          return targetEl.value;
        } else if (targetEl instanceof HTMLTextAreaElement) {
          return targetEl.value;
        } else if (targetEl instanceof HTMLSelectElement) {
          return targetEl.value;
        } else {
          // Fallback for other elements
          return (targetEl as any).value || '';
        }
      });

      return {
        value,
        selector,
      };
    }
  } catch (error) {
    throw new Error(
      `Failed to get value from selector "${selector}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * MCP tool definition for getValue
 */
export const getValueTool = {
  name: 'playwright_get_value',
  description: 'Get value from input element(s). Supports text inputs, textareas, selects, checkboxes, and radio buttons.',
  inputSchema: GetValueInputSchema,
  outputSchema: GetValueOutputSchema,
};
