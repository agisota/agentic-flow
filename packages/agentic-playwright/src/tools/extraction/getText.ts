import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Schema for getText tool input
 */
export const GetTextInputSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  selector: z.string().describe('CSS selector to target element'),
  all: z.boolean().default(false).optional().describe('Get text from all matching elements'),
  trim: z.boolean().default(true).optional().describe('Trim whitespace from text'),
  normalizeWhitespace: z.boolean().default(true).optional().describe('Normalize whitespace'),
  timeout: z.number().default(5000).optional().describe('Timeout in milliseconds'),
});

export type GetTextInput = z.infer<typeof GetTextInputSchema>;

/**
 * Schema for getText tool output
 */
export const GetTextOutputSchema = z.object({
  text: z.union([z.string(), z.array(z.string())]).describe('Extracted text content'),
  selector: z.string().describe('Selector used'),
  count: z.number().optional().describe('Number of elements found (for all=true)'),
});

export type GetTextOutput = z.infer<typeof GetTextOutputSchema>;

/**
 * Get text content from element(s)
 *
 * Features:
 * - Smart waiting for elements
 * - Support for Shadow DOM
 * - Handle hidden elements gracefully
 * - Text normalization options
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Text content from element(s)
 */
export async function getText(
  page: Page,
  input: GetTextInput
): Promise<GetTextOutput> {
  const { selector, all, trim, normalizeWhitespace, timeout } = input;

  try {
    // Wait for the selector to be available
    await page.waitForSelector(selector, {
      timeout,
      state: 'attached' // Wait for element to be in DOM, even if hidden
    });

    if (all) {
      // Get text from all matching elements
      const elements = await page.$$(selector);
      const texts: string[] = [];

      for (const element of elements) {
        // Use innerText which respects CSS display and visibility
        let text = await element.evaluate((el) => {
          // Check Shadow DOM first
          if (el.shadowRoot) {
            return el.shadowRoot.textContent || '';
          }
          // Use innerText for visible text, fallback to textContent
          return (el as HTMLElement).innerText || el.textContent || '';
        });

        // Apply text transformations
        if (trim) {
          text = text.trim();
        }
        if (normalizeWhitespace) {
          text = text.replace(/\s+/g, ' ').trim();
        }

        texts.push(text);
      }

      return {
        text: texts,
        selector,
        count: texts.length,
      };
    } else {
      // Get text from first matching element
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      let text = await element.evaluate((el) => {
        // Check Shadow DOM first
        if (el.shadowRoot) {
          return el.shadowRoot.textContent || '';
        }
        // Use innerText for visible text, fallback to textContent
        return (el as HTMLElement).innerText || el.textContent || '';
      });

      // Apply text transformations
      if (trim) {
        text = text.trim();
      }
      if (normalizeWhitespace) {
        text = text.replace(/\s+/g, ' ').trim();
      }

      return {
        text,
        selector,
      };
    }
  } catch (error) {
    throw new Error(
      `Failed to get text from selector "${selector}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * MCP tool definition for getText
 */
export const getTextTool = {
  name: 'playwright_get_text',
  description: 'Extract text content from element(s) on the page. Supports Shadow DOM and text normalization.',
  inputSchema: GetTextInputSchema,
  outputSchema: GetTextOutputSchema,
};
