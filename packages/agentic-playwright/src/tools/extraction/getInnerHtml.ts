import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Schema for getInnerHtml tool input
 */
export const GetInnerHtmlInputSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  selector: z.string().describe('CSS selector to target element'),
  all: z.boolean().default(false).optional().describe('Get inner HTML from all matching elements'),
  timeout: z.number().default(5000).optional().describe('Timeout in milliseconds'),
});

export type GetInnerHtmlInput = z.infer<typeof GetInnerHtmlInputSchema>;

/**
 * Schema for getInnerHtml tool output
 */
export const GetInnerHtmlOutputSchema = z.object({
  html: z.union([z.string(), z.array(z.string())]).describe('Inner HTML content'),
  selector: z.string().describe('Selector used'),
  count: z.number().optional().describe('Number of elements found (for all=true)'),
});

export type GetInnerHtmlOutput = z.infer<typeof GetInnerHtmlOutputSchema>;

/**
 * Get inner HTML from element(s)
 *
 * Features:
 * - Smart waiting for elements
 * - Support for Shadow DOM
 * - Handle hidden elements gracefully
 * - Returns innerHTML content
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Inner HTML content from element(s)
 */
export async function getInnerHtml(
  page: Page,
  input: GetInnerHtmlInput
): Promise<GetInnerHtmlOutput> {
  const { selector, all, timeout } = input;

  try {
    // Wait for the selector to be available
    await page.waitForSelector(selector, {
      timeout,
      state: 'attached'
    });

    if (all) {
      // Get inner HTML from all matching elements
      const elements = await page.$$(selector);
      const htmls: string[] = [];

      for (const element of elements) {
        const html = await element.evaluate((el) => {
          // Check Shadow DOM first
          if (el.shadowRoot) {
            return el.shadowRoot.innerHTML || '';
          }
          return el.innerHTML;
        });

        htmls.push(html);
      }

      return {
        html: htmls,
        selector,
        count: htmls.length,
      };
    } else {
      // Get inner HTML from first matching element
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      const html = await element.evaluate((el) => {
        // Check Shadow DOM first
        if (el.shadowRoot) {
          return el.shadowRoot.innerHTML || '';
        }
        return el.innerHTML;
      });

      return {
        html,
        selector,
      };
    }
  } catch (error) {
    throw new Error(
      `Failed to get inner HTML from selector "${selector}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * MCP tool definition for getInnerHtml
 */
export const getInnerHtmlTool = {
  name: 'playwright_get_inner_html',
  description: 'Extract inner HTML content from element(s). Includes all child elements and text. Supports Shadow DOM.',
  inputSchema: GetInnerHtmlInputSchema,
  outputSchema: GetInnerHtmlOutputSchema,
};
