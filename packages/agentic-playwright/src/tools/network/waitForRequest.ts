/**
 * Wait for a specific network request
 * Waits for a network request matching the URL pattern
 */

import { Page, Request } from 'playwright';
import { z } from 'zod';

/**
 * Input schema for waitForRequest tool
 */
export const waitForRequestSchema = z.object({
  urlPattern: z.string().describe('URL pattern to wait for'),
  timeout: z.number().min(0).max(300000).default(30000).describe('Timeout in milliseconds'),
});

export type WaitForRequestInput = z.infer<typeof waitForRequestSchema>;

/**
 * Output schema for waitForRequest tool
 */
export interface WaitForRequestOutput {
  success: boolean;
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  timestamp: string;
}

/**
 * Wait for a network request
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Request details
 */
export async function waitForRequest(
  page: Page,
  input: WaitForRequestInput
): Promise<WaitForRequestOutput> {
  try {
    const request = await page.waitForRequest(
      (req: Request) => {
        const url = req.url();
        // Support glob patterns
        const pattern = input.urlPattern.replace(/\*/g, '.*');
        const regex = new RegExp(pattern);
        return regex.test(url);
      },
      { timeout: input.timeout }
    );

    return {
      success: true,
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData() || undefined,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Timeout')) {
      throw new Error(
        `Timeout waiting for request matching pattern: ${input.urlPattern}`
      );
    }
    throw new Error(
      `Failed to wait for request: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool metadata for MCP server
 */
export const waitForRequestTool = {
  name: 'playwright_wait_for_request',
  description: 'Wait for a network request matching the URL pattern',
  inputSchema: waitForRequestSchema,
  handler: waitForRequest,
};
