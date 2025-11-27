/**
 * Intercept and modify network requests
 * Allows interception and modification of network requests
 */

import { Page, Route } from 'playwright';
import { z } from 'zod';

/**
 * Input schema for intercept tool
 */
export const interceptSchema = z.object({
  urlPattern: z.string().describe('URL pattern to intercept (glob or regex)'),
  response: z.object({
    status: z.number().min(100).max(599).optional().describe('HTTP status code'),
    headers: z.record(z.string()).optional().describe('Response headers'),
    body: z.string().optional().describe('Response body'),
    contentType: z.string().optional().describe('Content-Type header'),
  }).optional().describe('Response to return'),
  abort: z.boolean().default(false).describe('Abort matching requests'),
});

export type InterceptInput = z.infer<typeof interceptSchema>;

/**
 * Output schema for intercept tool
 */
export interface InterceptOutput {
  success: boolean;
  pattern: string;
  interceptId: string;
}

/**
 * Store active intercepts for cleanup
 */
const activeIntercepts = new Map<string, { page: Page; pattern: string }>();

/**
 * Intercept network requests
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Intercept configuration
 */
export async function intercept(
  page: Page,
  input: InterceptInput
): Promise<InterceptOutput> {
  try {
    const interceptId = `intercept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await page.route(input.urlPattern, async (route: Route) => {
      if (input.abort) {
        await route.abort();
      } else if (input.response) {
        const headers = input.response.headers || {};
        if (input.response.contentType && !headers['content-type']) {
          headers['content-type'] = input.response.contentType;
        }

        await route.fulfill({
          status: input.response.status || 200,
          headers,
          body: input.response.body,
        });
      } else {
        await route.continue();
      }
    });

    // Store for cleanup
    activeIntercepts.set(interceptId, {
      page,
      pattern: input.urlPattern,
    });

    return {
      success: true,
      pattern: input.urlPattern,
      interceptId,
    };
  } catch (error) {
    throw new Error(
      `Failed to intercept requests: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Cleanup all intercepts for a page
 */
export async function cleanupIntercepts(page: Page): Promise<void> {
  for (const [interceptId, config] of activeIntercepts.entries()) {
    if (config.page === page) {
      try {
        await page.unroute(config.pattern);
        activeIntercepts.delete(interceptId);
      } catch (error) {
        // Ignore cleanup errors
        console.error(`Failed to cleanup intercept ${interceptId}:`, error);
      }
    }
  }
}

/**
 * Tool metadata for MCP server
 */
export const interceptTool = {
  name: 'playwright_intercept_request',
  description: 'Intercept and modify network requests matching a URL pattern',
  inputSchema: interceptSchema,
  handler: intercept,
};
