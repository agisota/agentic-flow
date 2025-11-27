/**
 * Get localStorage or sessionStorage data
 * Retrieves storage data from the browser
 */

import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Input schema for getStorage tool
 */
export const getStorageSchema = z.object({
  type: z.enum(['local', 'session']).default('local').describe('Storage type'),
  keys: z.array(z.string()).optional().describe('Specific keys to retrieve (all if empty)'),
});

export type GetStorageInput = z.infer<typeof getStorageSchema>;

/**
 * Output schema for getStorage tool
 */
export interface GetStorageOutput {
  storage: Record<string, string>;
  count: number;
  type: 'local' | 'session';
}

/**
 * Get storage data from browser
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Storage data
 */
export async function getStorage(
  page: Page,
  input: GetStorageInput
): Promise<GetStorageOutput> {
  try {
    const storageType = input.type === 'local' ? 'localStorage' : 'sessionStorage';

    const storageData = await page.evaluate(
      ({ storageType, keys }) => {
        const storage = window[storageType as 'localStorage' | 'sessionStorage'];
        const result: Record<string, string> = {};

        if (keys && keys.length > 0) {
          // Get specific keys
          for (const key of keys) {
            const value = storage.getItem(key);
            if (value !== null) {
              result[key] = value;
            }
          }
        } else {
          // Get all keys
          for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key) {
              const value = storage.getItem(key);
              if (value !== null) {
                result[key] = value;
              }
            }
          }
        }

        return result;
      },
      { storageType, keys: input.keys }
    );

    return {
      storage: storageData,
      count: Object.keys(storageData).length,
      type: input.type,
    };
  } catch (error) {
    throw new Error(
      `Failed to get ${input.type}Storage: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool metadata for MCP server
 */
export const getStorageTool = {
  name: 'playwright_get_storage',
  description: 'Get localStorage or sessionStorage data from the browser',
  inputSchema: getStorageSchema,
  handler: getStorage,
};
