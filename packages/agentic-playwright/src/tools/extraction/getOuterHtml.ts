import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Schema for getOuterHtml tool input
 */
export const GetOuterHtmlInputSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  selector: z.string().describe('CSS selector to target element'),
  all: z.boolean().default(false).optional().describe('Get outer HTML from all matching elements'),
  timeout: z.number().default(5000).optional().describe('Timeout in milliseconds'),
});

export type GetOuterHtmlInput = z.infer<typeof GetOuterHtmlInputSchema>;

/**
 * Schema for getOuterHtml tool output
 */
export const GetOuterHtmlOutputSchema = z.object({
  html: z.union([z.string(), z.array(z.string())]).describe('Outer HTML content'),
  selector: z.string().describe('Selector used'),
  count: z.number().optional().describe('Number of elements found (for all=true)'),
});

export type GetOuterHtmlOutput = z.infer<typeof GetOuterHtmlOutputSchema>;

/**
 * Get outer HTML from element(s)
 *
 * Features:
 * - Smart waiting for elements
 * - Support for Shadow DOM
 * - Handle hidden elements gracefully
 * - Returns outerHTML content (includes the element itself)
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Outer HTML content from element(s)
 */
export async function getOuterHtml(
  page: Page,
  input: GetOuterHtmlInput
): Promise<GetOuterHtmlOutput> {
  const { selector, all, timeout } = input;

  try {
    // Wait for the selector to be available
    await page.waitForSelector(selector, {
      timeout,
      state: 'attached'
    });

    if (all) {
      // Get outer HTML from all matching elements
      const elements = await page.$$(selector);
      const htmls: string[] = [];

      for (const element of elements) {
        const html = await element.evaluate((el) => {
          // For Shadow DOM, return the host element's outerHTML
          if (el.shadowRoot) {
            // Return the host element with shadow root indicator
            return el.outerHTML + '<!-- Shadow DOM content -->';
          }
          return el.outerHTML;
        });

        htmls.push(html);
      }

      return {
        html: htmls,
        selector,
        count: htmls.length,
      };
    } else {
      // Get outer HTML from first matching element
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      const html = await element.evaluate((el) => {
        // For Shadow DOM, return the host element's outerHTML
        if (el.shadowRoot) {
          // Return the host element with shadow root indicator
          return el.outerHTML + '<!-- Shadow DOM content -->';
        }
        return el.outerHTML;
      });

      return {
        html,
        selector,
      };
    }
  } catch (error) {
    throw new Error(
      `Failed to get outer HTML from selector "${selector}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * MCP tool definition for getOuterHtml
 */
export const getOuterHtmlTool = {
  name: 'playwright_get_outer_html',
  description: 'Extract outer HTML content from element(s). Includes the element itself and all children. Supports Shadow DOM.',
  inputSchema: GetOuterHtmlInputSchema,
  outputSchema: GetOuterHtmlOutputSchema,
};
