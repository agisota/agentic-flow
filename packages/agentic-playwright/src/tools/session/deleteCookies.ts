/**
 * Delete browser cookies
 * Removes cookies from the browser context
 */

import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Input schema for deleteCookies tool
 */
export const deleteCookiesSchema = z.object({
  names: z.array(z.string()).optional().describe('Cookie names to delete (all if empty)'),
});

export type DeleteCookiesInput = z.infer<typeof deleteCookiesSchema>;

/**
 * Output schema for deleteCookies tool
 */
export interface DeleteCookiesOutput {
  success: boolean;
  deletedCount: number;
  deletedNames: string[];
}

/**
 * Delete cookies from browser context
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Deletion result
 */
export async function deleteCookies(
  page: Page,
  input: DeleteCookiesInput
): Promise<DeleteCookiesOutput> {
  try {
    const context = page.context();
    const allCookies = await context.cookies();

    if (!input.names || input.names.length === 0) {
      // Delete all cookies
      await context.clearCookies();
      return {
        success: true,
        deletedCount: allCookies.length,
        deletedNames: allCookies.map(c => c.name),
      };
    }

    // Delete specific cookies
    const cookiesToDelete = allCookies.filter(c => input.names!.includes(c.name));

    // Playwright doesn't have a direct delete by name, so we clear all and re-add the ones we want to keep
    const cookiesToKeep = allCookies.filter(c => !input.names!.includes(c.name));

    await context.clearCookies();
    if (cookiesToKeep.length > 0) {
      await context.addCookies(cookiesToKeep);
    }

    return {
      success: true,
      deletedCount: cookiesToDelete.length,
      deletedNames: cookiesToDelete.map(c => c.name),
    };
  } catch (error) {
    throw new Error(
      `Failed to delete cookies: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool metadata for MCP server
 */
export const deleteCookiesTool = {
  name: 'playwright_delete_cookies',
  description: 'Delete browser cookies by name, or all cookies if no names specified',
  inputSchema: deleteCookiesSchema,
  handler: deleteCookies,
};
