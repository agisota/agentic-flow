/**
 * Restore browser session state from file
 * Imports cookies, localStorage, and sessionStorage
 */

import { Page } from 'playwright';
import { z } from 'zod';
import * as fs from 'fs/promises';

/**
 * Input schema for restoreSession tool
 */
export const restoreSessionSchema = z.object({
  path: z.string().describe('File path to restore session from'),
});

export type RestoreSessionInput = z.infer<typeof restoreSessionSchema>;

/**
 * Output schema for restoreSession tool
 */
export interface RestoreSessionOutput {
  success: boolean;
  url: string;
  restored: {
    cookies: number;
    localStorage: number;
    sessionStorage: number;
  };
  timestamp: string;
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
 * Restore session state from file
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Restore result
 */
export async function restoreSession(
  page: Page,
  input: RestoreSessionInput
): Promise<RestoreSessionOutput> {
  try {
    // Read session file
    const content = await fs.readFile(input.path, 'utf-8');
    const sessionState: SessionState = JSON.parse(content);

    const context = page.context();

    // Restore cookies
    if (sessionState.cookies && sessionState.cookies.length > 0) {
      await context.addCookies(sessionState.cookies);
    }

    // Navigate to saved URL
    await page.goto(sessionState.url);

    // Restore storage data
    await page.evaluate(
      ({ local, session }) => {
        // Restore localStorage
        for (const [key, value] of Object.entries(local)) {
          localStorage.setItem(key, value);
        }

        // Restore sessionStorage
        for (const [key, value] of Object.entries(session)) {
          sessionStorage.setItem(key, value);
        }
      },
      {
        local: sessionState.localStorage || {},
        session: sessionState.sessionStorage || {},
      }
    );

    return {
      success: true,
      url: sessionState.url,
      restored: {
        cookies: sessionState.cookies?.length || 0,
        localStorage: Object.keys(sessionState.localStorage || {}).length,
        sessionStorage: Object.keys(sessionState.sessionStorage || {}).length,
      },
      timestamp: sessionState.timestamp,
    };
  } catch (error) {
    throw new Error(
      `Failed to restore session: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Tool metadata for MCP server
 */
export const restoreSessionTool = {
  name: 'playwright_restore_session',
  description: 'Restore browser session state from a saved file',
  inputSchema: restoreSessionSchema,
  handler: restoreSession,
};
