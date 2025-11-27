/**
 * Set extra HTTP headers
 * Set additional HTTP headers for all requests
 */

import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Input schema for setExtraHeaders tool
 */
export const setExtraHeadersSchema = z.object({
  headers: z.record(z.string()).describe('Headers to set as key-value pairs'),
});

export type SetExtraHeadersInput = z.infer<typeof setExtraHeadersSchema>;

/**
 * Output schema for setExtraHeaders tool
 */
export interface SetExtraHeadersOutput {
  success: boolean;
  headerCount: number;
  headers: Record<string, string>;
}

/**
 * Set extra HTTP headers
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Success status
 */
export async function setExtraHeaders(
  page: Page,
  input: SetExtraHeadersInput
): Promise<SetExtraHeadersOutput> {
  try {
    const context = page.context();
    await context.setExtraHTTPHeaders(input.headers);

    return {
      success: true,
      headerCount: Object.keys(input.headers).length,
      headers: input.headers,
    };
  } catch (error) {
    throw new Error(
      `Failed to set extra headers: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool metadata for MCP server
 */
export const setExtraHeadersTool = {
  name: 'playwright_set_extra_headers',
  description: 'Set extra HTTP headers for all requests in the browser context',
  inputSchema: setExtraHeadersSchema,
  handler: setExtraHeaders,
};
