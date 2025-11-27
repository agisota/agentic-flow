/**
 * Save browser session state to file
 * Exports cookies, localStorage, and sessionStorage
 */

import { Page } from 'playwright';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Input schema for saveSession tool
 */
export const saveSessionSchema = z.object({
  path: z.string().describe('File path to save session state'),
});

export type SaveSessionInput = z.infer<typeof saveSessionSchema>;

/**
 * Output schema for saveSession tool
 */
export interface SaveSessionOutput {
  success: boolean;
  path: string;
  size: number;
  items: {
    cookies: number;
    localStorage: number;
    sessionStorage: number;
  };
}

/**
 * Session state structure
 */
interface SessionState {
  url: string;
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  timestamp: string;
}

/**
 * Save session state to file
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Save result
 */
export async function saveSession(
  page: Page,
  input: SaveSessionInput
): Promise<SaveSessionOutput> {
  try {
    const context = page.context();

    // Get cookies
    const cookies = await context.cookies();

    // Get storage data
    const storageData = await page.evaluate(() => {
      const local: Record<string, string> = {};
      const session: Record<string, string> = {};

      // Get localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            local[key] = value;
          }
        }
      }

      // Get sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          if (value !== null) {
            session[key] = value;
          }
        }
      }

      return { local, session };
    });

    const sessionState: SessionState = {
      url: page.url(),
      cookies,
      localStorage: storageData.local,
      sessionStorage: storageData.session,
      timestamp: new Date().toISOString(),
    };

    // Ensure directory exists
    const dir = path.dirname(input.path);
    await fs.mkdir(dir, { recursive: true });

    // Write to file
    const content = JSON.stringify(sessionState, null, 2);
    await fs.writeFile(input.path, content, 'utf-8');

    const stats = await fs.stat(input.path);

    return {
      success: true,
      path: input.path,
      size: stats.size,
      items: {
        cookies: cookies.length,
        localStorage: Object.keys(storageData.local).length,
        sessionStorage: Object.keys(storageData.session).length,
      },
    };
  } catch (error) {
    throw new Error(
      `Failed to save session: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool metadata for MCP server
 */
export const saveSessionTool = {
  name: 'playwright_save_session',
  description: 'Save browser session state (cookies, localStorage, sessionStorage) to a file',
  inputSchema: saveSessionSchema,
  handler: saveSession,
};
