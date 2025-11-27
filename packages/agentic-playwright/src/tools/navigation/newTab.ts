/**
 * New Tab Tool
 * Open a new tab
 */

import { z } from 'zod';
import { NavigationContextManager } from './context.js';

// Input schema validation
export const newTabInputSchema = z.object({
  sessionId: z.string(),
  url: z.string().url().optional(),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).default('load'),
  timeout: z.number().min(1000).max(120000).default(30000),
});

export type NewTabInput = z.infer<typeof newTabInputSchema>;

export interface NewTabOutput {
  success: boolean;
  tabId: string;
  url: string;
  title?: string;
  error?: string;
}

/**
 * Open a new tab
 */
export async function newTab(input: NewTabInput): Promise<NewTabOutput> {
  try {
    // Validate input
    const validated = newTabInputSchema.parse(input);
    const { sessionId, url, waitUntil, timeout } = validated;

    // Get navigation context
    const ctx = NavigationContextManager.get(sessionId);
    if (!ctx || !ctx.context) {
      throw new Error(`No active browser context found for session: ${sessionId}`);
    }

    const context = ctx.context;

    // Create new page
    const newPage = await context.newPage();

    // Register the new tab
    const tabId = NavigationContextManager.registerTab(sessionId, newPage);

    // Navigate to URL if provided
    if (url) {
      await newPage.goto(url, {
        waitUntil,
        timeout,
      });
    }

    // Get page information
    const pageUrl = newPage.url();
    const title = await newPage.title();

    // Set as active tab
    NavigationContextManager.setActiveTab(sessionId, tabId);
    NavigationContextManager.updateCurrentUrl(sessionId, pageUrl);
    NavigationContextManager.updateCurrentTitle(sessionId, title);

    return {
      success: true,
      tabId,
      url: pageUrl,
      title,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      tabId: '',
      url: '',
      error: errorMessage,
    };
  }
}

/**
 * Tool definition for MCP
 */
export const newTabTool = {
  name: 'new_tab',
  description: 'Open a new tab',
  inputSchema: newTabInputSchema,
  handler: newTab,
};
