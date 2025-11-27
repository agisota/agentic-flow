/**
 * Go Back Tool
 * Navigate back in browser history
 */

import { z } from 'zod';
import { NavigationContextManager } from './context.js';

// Input schema validation
export const backInputSchema = z.object({
  sessionId: z.string(),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).default('load'),
  timeout: z.number().min(1000).max(120000).default(30000),
});

export type BackInput = z.infer<typeof backInputSchema>;

export interface BackOutput {
  success: boolean;
  url: string;
  title: string;
  previousUrl?: string;
  error?: string;
}

/**
 * Navigate back in browser history
 */
export async function back(input: BackInput): Promise<BackOutput> {
  try {
    // Validate input
    const validated = backInputSchema.parse(input);
    const { sessionId, waitUntil, timeout } = validated;

    // Get navigation context
    const ctx = NavigationContextManager.get(sessionId);
    if (!ctx || !ctx.page) {
      throw new Error(`No active page found for session: ${sessionId}`);
    }

    const page = ctx.page;
    const previousUrl = ctx.currentUrl || page.url();

    // Navigate back
    await page.goBack({
      waitUntil,
      timeout,
    });

    // Get updated page information
    const url = page.url();
    const title = await page.title();

    // Update context
    NavigationContextManager.updateCurrentUrl(sessionId, url);
    NavigationContextManager.updateCurrentTitle(sessionId, title);

    return {
      success: true,
      url,
      title,
      previousUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      url: '',
      title: '',
      error: errorMessage,
    };
  }
}

/**
 * Tool definition for MCP
 */
export const backTool = {
  name: 'go_back',
  description: 'Navigate back in browser history',
  inputSchema: backInputSchema,
  handler: back,
};
