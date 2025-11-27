/**
 * Network Management Tools
 * Tools for intercepting, mocking, and managing network requests
 */

export * from './intercept';
export * from './mock';
export * from './waitForRequest';
export * from './waitForResponse';
export * from './setOffline';
export * from './setExtraHeaders';

import { interceptTool, cleanupIntercepts } from './intercept';
import { mockTool, cleanupMocks } from './mock';
import { waitForRequestTool } from './waitForRequest';
import { waitForResponseTool } from './waitForResponse';
import { setOfflineTool } from './setOffline';
import { setExtraHeadersTool } from './setExtraHeaders';
import { Page } from 'playwright';

/**
 * All network tools exported as array for MCP server registration
 */
export const networkTools = [
  interceptTool,
  mockTool,
  waitForRequestTool,
  waitForResponseTool,
  setOfflineTool,
  setExtraHeadersTool,
];

/**
 * Cleanup all network intercepts and mocks for a page
 * Should be called when closing a page or session
 *
 * @param page - Playwright page instance
 */
export async function cleanupNetworkTools(page: Page): Promise<void> {
  await Promise.all([
    cleanupIntercepts(page),
    cleanupMocks(page),
  ]);
}
