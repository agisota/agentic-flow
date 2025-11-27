/**
 * Wait for a specific network response
 * Waits for a network response matching the URL pattern
 */

import { Page, Response } from 'playwright';
import { z } from 'zod';

/**
 * Input schema for waitForResponse tool
 */
export const waitForResponseSchema = z.object({
  urlPattern: z.string().describe('URL pattern to wait for'),
  timeout: z.number().min(0).max(300000).default(30000).describe('Timeout in milliseconds'),
});

export type WaitForResponseInput = z.infer<typeof waitForResponseSchema>;

/**
 * Output schema for waitForResponse tool
 */
export interface WaitForResponseOutput {
  success: boolean;
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: string;
}

/**
 * Wait for a network response
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Response details
 */
export async function waitForResponse(
  page: Page,
  input: WaitForResponseInput
): Promise<WaitForResponseOutput> {
  try {
    const response = await page.waitForResponse(
      (res: Response) => {
        const url = res.url();
        // Support glob patterns
        const pattern = input.urlPattern.replace(/\*/g, '.*');
        const regex = new RegExp(pattern);
        return regex.test(url);
      },
      { timeout: input.timeout }
    );

    // Try to get response body
    let body: string | undefined;
    try {
      body = await response.text();
    } catch (error) {
      // Body might not be available for some responses
      body = undefined;
    }

    return {
      success: true,
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      body,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Timeout')) {
      throw new Error(
        `Timeout waiting for response matching pattern: ${input.urlPattern}`
      );
    }
    throw new Error(
      `Failed to wait for response: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool metadata for MCP server
 */
export const waitForResponseTool = {
  name: 'playwright_wait_for_response',
  description: 'Wait for a network response matching the URL pattern',
  inputSchema: waitForResponseSchema,
  handler: waitForResponse,
};
