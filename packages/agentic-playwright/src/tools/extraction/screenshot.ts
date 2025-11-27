import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Schema for screenshot tool input
 */
export const ScreenshotInputSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  selector: z.string().optional().describe('CSS selector to screenshot specific element (optional, takes full page if not provided)'),
  fullPage: z.boolean().default(false).optional().describe('Capture full scrollable page'),
  format: z.enum(['png', 'jpeg']).default('png').optional().describe('Image format'),
  quality: z.number().min(0).max(100).default(80).optional().describe('JPEG quality (0-100, ignored for PNG)'),
  path: z.string().optional().describe('File path to save screenshot (optional)'),
  omitBackground: z.boolean().default(false).optional().describe('Omit default background (transparent for PNG)'),
  timeout: z.number().default(30000).optional().describe('Timeout in milliseconds'),
});

export type ScreenshotInput = z.infer<typeof ScreenshotInputSchema>;

/**
 * Schema for screenshot tool output
 */
export const ScreenshotOutputSchema = z.object({
  success: z.boolean().describe('Whether screenshot was successful'),
  base64: z.string().optional().describe('Base64 encoded image data'),
  path: z.string().optional().describe('File path where screenshot was saved'),
  width: z.number().describe('Screenshot width in pixels'),
  height: z.number().describe('Screenshot height in pixels'),
  format: z.string().describe('Image format used'),
});

export type ScreenshotOutput = z.infer<typeof ScreenshotOutputSchema>;

/**
 * Take screenshot of page or element
 *
 * Features:
 * - Full page or element screenshots
 * - Multiple format support (PNG, JPEG)
 * - Quality control for JPEG
 * - Base64 encoding for embedding
 * - Optional file save
 * - Transparent backgrounds support
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Screenshot data and metadata
 */
export async function screenshot(
  page: Page,
  input: ScreenshotInput
): Promise<ScreenshotOutput> {
  const { selector, fullPage, format, quality, path, omitBackground, timeout } = input;

  try {
    let screenshotBuffer: Buffer;
    let width: number;
    let height: number;

    if (selector) {
      // Screenshot specific element
      await page.waitForSelector(selector, {
        timeout,
        state: 'visible' // Element must be visible for screenshot
      });

      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      // Get element dimensions
      const box = await element.boundingBox();
      if (!box) {
        throw new Error(`Element has no bounding box (might be hidden): ${selector}`);
      }

      width = Math.round(box.width);
      height = Math.round(box.height);

      // Take element screenshot
      screenshotBuffer = await element.screenshot({
        type: format,
        quality: format === 'jpeg' ? quality : undefined,
        omitBackground,
        path,
      });
    } else {
      // Screenshot full page or viewport
      const viewport = page.viewportSize();

      if (fullPage) {
        // Get full page dimensions
        const dimensions = await page.evaluate(() => ({
          width: Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth
          ),
          height: Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
          ),
        }));
        width = dimensions.width;
        height = dimensions.height;
      } else {
        // Use viewport dimensions
        width = viewport?.width || 1920;
        height = viewport?.height || 1080;
      }

      // Take page screenshot
      screenshotBuffer = await page.screenshot({
        type: format,
        quality: format === 'jpeg' ? quality : undefined,
        fullPage,
        omitBackground,
        path,
      });
    }

    // Convert to base64
    const base64 = screenshotBuffer.toString('base64');

    return {
      success: true,
      base64,
      path,
      width,
      height,
      format: format || 'png',
    };
  } catch (error) {
    throw new Error(
      `Failed to take screenshot${selector ? ` of selector "${selector}"` : ''}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * MCP tool definition for screenshot
 */
export const screenshotTool = {
  name: 'playwright_screenshot',
  description: 'Take screenshot of entire page or specific element. Returns base64 encoded image and optionally saves to file. Supports PNG and JPEG formats.',
  inputSchema: ScreenshotInputSchema,
  outputSchema: ScreenshotOutputSchema,
};
