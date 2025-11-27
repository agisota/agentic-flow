/**
 * Get Current URL Tool
 * Get the current page URL
 */

import { z } from 'zod';
import { NavigationContextManager } from './context.js';

// Input schema validation
export const getUrlInputSchema = z.object({
  sessionId: z.string(),
});

export type GetUrlInput = z.infer<typeof getUrlInputSchema>;

export interface GetUrlOutput {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * Get the current page URL
 */
export async function getUrl(input: GetUrlInput): Promise<GetUrlOutput> {
  try {
    // Validate input
    const validated = getUrlInputSchema.parse(input);
    const { sessionId } = validated;

    // Get navigation context
    const ctx = NavigationContextManager.get(sessionId);
    if (!ctx || !ctx.page) {
      throw new Error(`No active page found for session: ${sessionId}`);
    }

    const page = ctx.page;

    // Get current URL
    const url = page.url();

    // Update context
    NavigationContextManager.updateCurrentUrl(sessionId, url);

    return {
      success: true,
      url,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      url: '',
      error: errorMessage,
    };
  }
}

/**
 * Tool definition for MCP
 */
export const getUrlTool = {
  name: 'get_current_url',
  description: 'Get the current page URL',
  inputSchema: getUrlInputSchema,
  handler: getUrl,
};
