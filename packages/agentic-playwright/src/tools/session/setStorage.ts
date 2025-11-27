/**
 * Set localStorage or sessionStorage data
 * Updates storage data in the browser
 */

import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Input schema for setStorage tool
 */
export const setStorageSchema = z.object({
  type: z.enum(['local', 'session']).default('local').describe('Storage type'),
  data: z.record(z.string()).describe('Key-value pairs to set'),
});

export type SetStorageInput = z.infer<typeof setStorageSchema>;

/**
 * Output schema for setStorage tool
 */
export interface SetStorageOutput {
  success: boolean;
  keysSet: string[];
  count: number;
}

/**
 * Set storage data in browser
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Success status
 */
export async function setStorage(
  page: Page,
  input: SetStorageInput
): Promise<SetStorageOutput> {
  try {
    const storageType = input.type === 'local' ? 'localStorage' : 'sessionStorage';

    const keysSet = await page.evaluate(
      ({ storageType, data }) => {
        const storage = window[storageType as 'localStorage' | 'sessionStorage'];
        const keys: string[] = [];

        for (const [key, value] of Object.entries(data)) {
          storage.setItem(key, value);
          keys.push(key);
        }

        return keys;
      },
      { storageType, data: input.data }
    );

    return {
      success: true,
      keysSet,
      count: keysSet.length,
    };
  } catch (error) {
    throw new Error(
      `Failed to set ${input.type}Storage: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool metadata for MCP server
 */
export const setStorageTool = {
  name: 'playwright_set_storage',
  description: 'Set localStorage or sessionStorage data in the browser',
  inputSchema: setStorageSchema,
  handler: setStorage,
};
