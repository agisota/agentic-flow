/**
 * Get Page Title Tool
 * Get the current page title
 */

import { z } from 'zod';
import { NavigationContextManager } from './context.js';

// Input schema validation
export const getTitleInputSchema = z.object({
  sessionId: z.string(),
});

export type GetTitleInput = z.infer<typeof getTitleInputSchema>;

export interface GetTitleOutput {
  success: boolean;
  title: string;
  error?: string;
}

/**
 * Get the current page title
 */
export async function getTitle(input: GetTitleInput): Promise<GetTitleOutput> {
  try {
    // Validate input
    const validated = getTitleInputSchema.parse(input);
    const { sessionId } = validated;

    // Get navigation context
    const ctx = NavigationContextManager.get(sessionId);
    if (!ctx || !ctx.page) {
      throw new Error(`No active page found for session: ${sessionId}`);
    }

    const page = ctx.page;

    // Get current title
    const title = await page.title();

    // Update context
    NavigationContextManager.updateCurrentTitle(sessionId, title);

    return {
      success: true,
      title,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      title: '',
      error: errorMessage,
    };
  }
}

/**
 * Tool definition for MCP
 */
export const getTitleTool = {
  name: 'get_page_title',
  description: 'Get the current page title',
  inputSchema: getTitleInputSchema,
  handler: getTitle,
};
