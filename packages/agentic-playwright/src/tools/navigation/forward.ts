/**
 * Go Forward Tool
 * Navigate forward in browser history
 */

import { z } from 'zod';
import { NavigationContextManager } from './context.js';

// Input schema validation
export const forwardInputSchema = z.object({
  sessionId: z.string(),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).default('load'),
  timeout: z.number().min(1000).max(120000).default(30000),
});

export type ForwardInput = z.infer<typeof forwardInputSchema>;

export interface ForwardOutput {
  success: boolean;
  url: string;
  title: string;
  previousUrl?: string;
  error?: string;
}

/**
 * Navigate forward in browser history
 */
export async function forward(input: ForwardInput): Promise<ForwardOutput> {
  try {
    // Validate input
    const validated = forwardInputSchema.parse(input);
    const { sessionId, waitUntil, timeout } = validated;

    // Get navigation context
    const ctx = NavigationContextManager.get(sessionId);
    if (!ctx || !ctx.page) {
      throw new Error(`No active page found for session: ${sessionId}`);
    }

    const page = ctx.page;
    const previousUrl = ctx.currentUrl || page.url();

    // Navigate forward
    await page.goForward({
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
export const forwardTool = {
  name: 'go_forward',
  description: 'Navigate forward in browser history',
  inputSchema: forwardInputSchema,
  handler: forward,
};
