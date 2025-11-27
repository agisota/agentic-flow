/**
 * Reload Page Tool
 * Reload the current page
 */

import { z } from 'zod';
import { NavigationContextManager } from './context.js';

// Input schema validation
export const reloadInputSchema = z.object({
  sessionId: z.string(),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).default('load'),
  ignoreCache: z.boolean().default(false),
  timeout: z.number().min(1000).max(120000).default(30000),
});

export type ReloadInput = z.infer<typeof reloadInputSchema>;

export interface ReloadOutput {
  success: boolean;
  url: string;
  title?: string;
  loadTime?: number;
  error?: string;
}

/**
 * Reload the current page
 */
export async function reload(input: ReloadInput): Promise<ReloadOutput> {
  const startTime = Date.now();

  try {
    // Validate input
    const validated = reloadInputSchema.parse(input);
    const { sessionId, waitUntil, ignoreCache, timeout } = validated;

    // Get navigation context
    const ctx = NavigationContextManager.get(sessionId);
    if (!ctx || !ctx.page) {
      throw new Error(`No active page found for session: ${sessionId}`);
    }

    const page = ctx.page;

    // Reload with options
    await page.reload({
      waitUntil,
      timeout,
    });

    // If ignoreCache is true, we need to use CDP to hard reload
    if (ignoreCache) {
      const client = await page.context().newCDPSession(page);
      await client.send('Page.reload', { ignoreCache: true });
    }

    // Get updated page information
    const url = page.url();
    const title = await page.title();
    const loadTime = Date.now() - startTime;

    // Update context
    NavigationContextManager.updateCurrentUrl(sessionId, url);
    NavigationContextManager.updateCurrentTitle(sessionId, title);

    return {
      success: true,
      url,
      title,
      loadTime,
    };
  } catch (error) {
    const loadTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      url: '',
      loadTime,
      error: errorMessage,
    };
  }
}

/**
 * Tool definition for MCP
 */
export const reloadTool = {
  name: 'reload_page',
  description: 'Reload the current page',
  inputSchema: reloadInputSchema,
  handler: reload,
};
