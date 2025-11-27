/**
 * Get browser cookies
 * Retrieves cookies from the current browser context
 */

import { Page, Cookie } from 'playwright';
import { z } from 'zod';

/**
 * Input schema for getCookies tool
 */
export const getCookiesSchema = z.object({
  urls: z.array(z.string().url()).optional().describe('Filter cookies by URLs'),
});

export type GetCookiesInput = z.infer<typeof getCookiesSchema>;

/**
 * Output schema for getCookies tool
 */
export interface GetCookiesOutput {
  cookies: Cookie[];
  count: number;
}

/**
 * Get cookies from browser context
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Cookies data
 */
export async function getCookies(
  page: Page,
  input: GetCookiesInput
): Promise<GetCookiesOutput> {
  try {
    const context = page.context();
    const cookies = input.urls
      ? await context.cookies(input.urls)
      : await context.cookies();

    return {
      cookies,
      count: cookies.length,
    };
  } catch (error) {
    throw new Error(
      `Failed to get cookies: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool metadata for MCP server
 */
export const getCookiesTool = {
  name: 'playwright_get_cookies',
  description: 'Get browser cookies, optionally filtered by URL',
  inputSchema: getCookiesSchema,
  handler: getCookies,
};
