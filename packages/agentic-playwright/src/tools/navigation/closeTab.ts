/**
 * Close Tab Tool
 * Close a specific tab
 */

import { z } from 'zod';
import { NavigationContextManager } from './context.js';

// Input schema validation
export const closeTabInputSchema = z.object({
  sessionId: z.string(),
  tabId: z.string(),
});

export type CloseTabInput = z.infer<typeof closeTabInputSchema>;

export interface CloseTabOutput {
  success: boolean;
  closedTabId?: string;
  activeTabId?: string;
  error?: string;
}

/**
 * Close a specific tab
 */
export async function closeTab(input: CloseTabInput): Promise<CloseTabOutput> {
  try {
    // Validate input
    const validated = closeTabInputSchema.parse(input);
    const { sessionId, tabId } = validated;

    // Get navigation context
    const ctx = NavigationContextManager.get(sessionId);
    if (!ctx) {
      throw new Error(`No navigation context found for session: ${sessionId}`);
    }

    // Get the page to close
    const tabs = NavigationContextManager.getTabs(sessionId);
    const pageToClose = tabs.get(tabId);

    if (!pageToClose) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    // Close the page
    await pageToClose.close();

    // Unregister the tab (this will also handle switching active tab)
    NavigationContextManager.unregisterTab(sessionId, tabId);

    // Get the new active tab ID
    const activeTabId = NavigationContextManager.getActiveTabId(sessionId);

    // Update context with new active tab's URL and title
    if (activeTabId) {
      const activePage = tabs.get(activeTabId);
      if (activePage) {
        const url = activePage.url();
        const title = await activePage.title();
        NavigationContextManager.updateCurrentUrl(sessionId, url);
        NavigationContextManager.updateCurrentTitle(sessionId, title);
      }
    }

    return {
      success: true,
      closedTabId: tabId,
      activeTabId: activeTabId || undefined,
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
export const closeTabTool = {
  name: 'close_tab',
  description: 'Close a specific tab',
  inputSchema: closeTabInputSchema,
  handler: closeTab,
};
