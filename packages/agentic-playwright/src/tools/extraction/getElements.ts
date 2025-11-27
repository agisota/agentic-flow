import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Schema for getElements tool input
 */
export const GetElementsInputSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  selector: z.string().describe('CSS selector to target elements'),
  limit: z.number().default(100).optional().describe('Maximum number of elements to return'),
  includeHidden: z.boolean().default(false).optional().describe('Include hidden elements'),
  attributes: z.array(z.string()).optional().describe('Specific attributes to extract (e.g., ["href", "class"])'),
  timeout: z.number().default(5000).optional().describe('Timeout in milliseconds'),
});

export type GetElementsInput = z.infer<typeof GetElementsInputSchema>;

/**
 * Schema for element info
 */
export const ElementInfoSchema = z.object({
  text: z.string().describe('Element text content'),
  tag: z.string().describe('HTML tag name'),
  attributes: z.record(z.string(), z.string().nullable()).describe('Element attributes'),
  visible: z.boolean().describe('Whether element is visible'),
  boundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional().describe('Element position and size'),
});

export type ElementInfo = z.infer<typeof ElementInfoSchema>;

/**
 * Schema for getElements tool output
 */
export const GetElementsOutputSchema = z.object({
  elements: z.array(ElementInfoSchema).describe('Array of element information'),
  count: z.number().describe('Total number of matching elements'),
  selector: z.string().describe('Selector used'),
});

export type GetElementsOutput = z.infer<typeof GetElementsOutputSchema>;

/**
 * Get information about multiple elements
 *
 * Features:
 * - Extract multiple element details
 * - Configurable attribute extraction
 * - Visibility detection
 * - Position and size information
 * - Support for Shadow DOM
 * - Limit results for performance
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Array of element information
 */
export async function getElements(
  page: Page,
  input: GetElementsInput
): Promise<GetElementsOutput> {
  const { selector, limit, includeHidden, attributes, timeout } = input;

  try {
    // Wait for at least one element
    await page.waitForSelector(selector, {
      timeout,
      state: 'attached'
    });

    // Get all matching elements
    const elements = await page.$$(selector);
    const totalCount = elements.length;

    // Limit number of elements to process
    const limitedElements = elements.slice(0, limit);

    // Extract information from each element
    const elementInfos: ElementInfo[] = [];

    for (const element of limitedElements) {
      const info = await element.evaluate((el, options) => {
        const { includeHidden, attributes } = options;

        // Check visibility
        const style = window.getComputedStyle(el);
        const visible = style.display !== 'none' &&
                       style.visibility !== 'hidden' &&
                       style.opacity !== '0';

        // Skip hidden elements if not included
        if (!includeHidden && !visible) {
          return null;
        }

        // Get text content
        const text = (el as HTMLElement).innerText || el.textContent || '';

        // Get tag name
        const tag = el.tagName.toLowerCase();

        // Get attributes
        const attrs: Record<string, string | null> = {};

        if (attributes && attributes.length > 0) {
          // Get specific attributes
          attributes.forEach((attr: string) => {
            attrs[attr] = el.getAttribute(attr);
          });
        } else {
          // Get all attributes
          Array.from(el.attributes).forEach(attr => {
            attrs[attr.name] = attr.value;
          });
        }

        // Get bounding box
        const rect = el.getBoundingClientRect();
        const boundingBox = {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        };

        return {
          text: text.trim(),
          tag,
          attributes: attrs,
          visible,
          boundingBox: boundingBox.width > 0 && boundingBox.height > 0 ? boundingBox : undefined,
        };
      }, { includeHidden, attributes });

      // Skip null results (hidden elements when includeHidden is false)
      if (info) {
        elementInfos.push(info as ElementInfo);
      }
    }

    return {
      elements: elementInfos,
      count: totalCount,
      selector,
    };
  } catch (error) {
    throw new Error(
      `Failed to get elements for selector "${selector}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * MCP tool definition for getElements
 */
export const getElementsTool = {
  name: 'playwright_get_elements',
  description: 'Get detailed information about multiple elements matching a selector. Returns text, tag, attributes, visibility, and position for each element.',
  inputSchema: GetElementsInputSchema,
  outputSchema: GetElementsOutputSchema,
};
