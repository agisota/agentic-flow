/**
 * Switch Tab Tool
 * Switch to a specific tab
 */

import { z } from 'zod';
import { NavigationContextManager } from './context.js';

// Input schema validation
export const switchTabInputSchema = z.object({
  sessionId: z.string(),
  tabId: z.string(),
});

export type SwitchTabInput = z.infer<typeof switchTabInputSchema>;

export interface SwitchTabOutput {
  success: boolean;
  tabId?: string;
  url?: string;
  title?: string;
  error?: string;
}

/**
 * Switch to a specific tab
 */
export async function switchTab(input: SwitchTabInput): Promise<SwitchTabOutput> {
  try {
    // Validate input
    const validated = switchTabInputSchema.parse(input);
    const { sessionId, tabId } = validated;

    // Get navigation context
    const ctx = NavigationContextManager.get(sessionId);
    if (!ctx) {
      throw new Error(`No navigation context found for session: ${sessionId}`);
    }

    // Get the page to switch to
    const tabs = NavigationContextManager.getTabs(sessionId);
    const targetPage = tabs.get(tabId);

    if (!targetPage) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    // Bring the page to front
    await targetPage.bringToFront();

    // Set as active tab in context
    NavigationContextManager.setActiveTab(sessionId, tabId);

    // Get page information
    const url = targetPage.url();
    const title = await targetPage.title();

    // Update context
    NavigationContextManager.updateCurrentUrl(sessionId, url);
    NavigationContextManager.updateCurrentTitle(sessionId, title);

    return {
      success: true,
      tabId,
      url,
      title,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Tool definition for MCP
 */
export const switchTabTool = {
  name: 'switch_tab',
  description: 'Switch to a specific tab',
  inputSchema: switchTabInputSchema,
  handler: switchTab,
};
