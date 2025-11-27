/**
 * Set a browser cookie
 * Adds a new cookie to the browser context
 */

import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Input schema for setCookie tool
 */
export const setCookieSchema = z.object({
  name: z.string().min(1).describe('Cookie name'),
  value: z.string().describe('Cookie value'),
  domain: z.string().optional().describe('Cookie domain'),
  path: z.string().default('/').describe('Cookie path'),
  expires: z.number().optional().describe('Unix timestamp in seconds'),
  httpOnly: z.boolean().default(false).describe('HTTP only flag'),
  secure: z.boolean().default(false).describe('Secure flag'),
  sameSite: z.enum(['Strict', 'Lax', 'None']).default('Lax').describe('SameSite attribute'),
});

export type SetCookieInput = z.infer<typeof setCookieSchema>;

/**
 * Output schema for setCookie tool
 */
export interface SetCookieOutput {
  success: boolean;
  cookie: {
    name: string;
    value: string;
    domain?: string;
    path: string;
  };
}

/**
 * Set a cookie in browser context
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Success status
 */
export async function setCookie(
  page: Page,
  input: SetCookieInput
): Promise<SetCookieOutput> {
  try {
    const context = page.context();

    // If no domain specified, use current page's domain
    let domain = input.domain;
    if (!domain) {
      const url = new URL(page.url());
      domain = url.hostname;
    }

    await context.addCookies([{
      name: input.name,
      value: input.value,
      domain,
      path: input.path,
      expires: input.expires,
      httpOnly: input.httpOnly,
      secure: input.secure,
      sameSite: input.sameSite,
    }]);

    return {
      success: true,
      cookie: {
        name: input.name,
        value: input.value,
        domain,
        path: input.path,
      },
    };
  } catch (error) {
    throw new Error(
      `Failed to set cookie: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool metadata for MCP server
 */
export const setCookieTool = {
  name: 'playwright_set_cookie',
  description: 'Set a browser cookie with specified attributes',
  inputSchema: setCookieSchema,
  handler: setCookie,
};
