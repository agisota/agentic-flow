/**
 * Set browser offline mode
 * Enable or disable offline mode for testing
 */

import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Input schema for setOffline tool
 */
export const setOfflineSchema = z.object({
  offline: z.boolean().describe('Enable or disable offline mode'),
});

export type SetOfflineInput = z.infer<typeof setOfflineSchema>;

/**
 * Output schema for setOffline tool
 */
export interface SetOfflineOutput {
  success: boolean;
  offline: boolean;
}

/**
 * Set browser offline mode
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Success status
 */
export async function setOffline(
  page: Page,
  input: SetOfflineInput
): Promise<SetOfflineOutput> {
  try {
    const context = page.context();
    await context.setOffline(input.offline);

    return {
      success: true,
      offline: input.offline,
    };
  } catch (error) {
    throw new Error(
      `Failed to set offline mode: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool metadata for MCP server
 */
export const setOfflineTool = {
  name: 'playwright_set_offline',
  description: 'Enable or disable browser offline mode for testing',
  inputSchema: setOfflineSchema,
  handler: setOffline,
};
