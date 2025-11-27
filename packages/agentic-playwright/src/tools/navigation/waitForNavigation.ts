/**
 * Wait for Navigation Tool
 * Wait for navigation to complete
 */

import { z } from 'zod';
import { NavigationContextManager } from './context.js';

// Input schema validation
export const waitForNavigationInputSchema = z.object({
  sessionId: z.string(),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).default('load'),
  timeout: z.number().min(1000).max(120000).default(30000),
  url: z.string().optional(),
});

export type WaitForNavigationInput = z.infer<typeof waitForNavigationInputSchema>;

export interface WaitForNavigationOutput {
  success: boolean;
  url: string;
  title?: string;
  loadTime?: number;
  error?: string;
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(
  input: WaitForNavigationInput
): Promise<WaitForNavigationOutput> {
  const startTime = Date.now();

  try {
    // Validate input
    const validated = waitForNavigationInputSchema.parse(input);
    const { sessionId, waitUntil, timeout, url } = validated;

    // Get navigation context
    const ctx = NavigationContextManager.get(sessionId);
    if (!ctx || !ctx.page) {
      throw new Error(`No active page found for session: ${sessionId}`);
    }

    const page = ctx.page;

    // Wait for navigation with optional URL pattern
    const navigationPromise = page.waitForNavigation({
      waitUntil,
      timeout,
      url: url ? new RegExp(url) : undefined,
    });

    await navigationPromise;

    // Get updated page information
    const pageUrl = page.url();
    const title = await page.title();
    const loadTime = Date.now() - startTime;

    // Update context
    NavigationContextManager.updateCurrentUrl(sessionId, pageUrl);
    NavigationContextManager.updateCurrentTitle(sessionId, title);

    return {
      success: true,
      url: pageUrl,
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
export const waitForNavigationTool = {
  name: 'wait_for_navigation',
  description: 'Wait for navigation to complete',
  inputSchema: waitForNavigationInputSchema,
  handler: waitForNavigation,
};
