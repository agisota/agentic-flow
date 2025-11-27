/**
 * Navigation Tools - MCP tools for browser navigation
 *
 * This module provides comprehensive navigation capabilities:
 * - URL navigation and redirects
 * - Browser history (back/forward)
 * - Page reloading
 * - Tab management (create, close, switch)
 * - Navigation waiting and URL/title tracking
 */

import { z } from 'zod';

// Import all navigation functions and input schemas
import { navigate, navigateInputSchema } from './navigate.js';
import { back, backInputSchema } from './back.js';
import { forward, forwardInputSchema } from './forward.js';
import { reload, reloadInputSchema } from './reload.js';
import { getUrl, getUrlInputSchema } from './getUrl.js';
import { getTitle, getTitleInputSchema } from './getTitle.js';
import { newTab, newTabInputSchema } from './newTab.js';
import { closeTab, closeTabInputSchema } from './closeTab.js';
import { switchTab, switchTabInputSchema } from './switchTab.js';
import { waitForNavigation, waitForNavigationInputSchema } from './waitForNavigation.js';

// Re-export context manager and all types
export { NavigationContextManager } from './context.js';
export type { NavigationContext } from './context.js';

// Re-export all functions and types
export * from './navigate.js';
export * from './back.js';
export * from './forward.js';
export * from './reload.js';
export * from './getUrl.js';
export * from './getTitle.js';
export * from './newTab.js';
export * from './closeTab.js';
export * from './switchTab.js';
export * from './waitForNavigation.js';

/**
 * Tool definition for MCP server registration
 */
export interface NavigationToolDefinition {
  name: string;
  description: string;
  inputSchema: unknown;
  outputSchema: unknown;
  handler: (...args: unknown[]) => Promise<unknown>;
}

/**
 * Navigate tool definition
 */
export const navigateTool: NavigationToolDefinition = {
  name: 'playwright_navigate',
  description: 'Navigate to a URL and wait for page load',
  inputSchema: navigateInputSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether navigation was successful'),
    url: z.string().describe('Final URL after navigation'),
    title: z.string().describe('Page title after navigation'),
    loadTime: z.number().describe('Time taken to load page in milliseconds'),
    finalUrl: z.string().optional().describe('Final URL (same as url)'),
    status: z.number().optional().describe('HTTP response status code'),
    error: z.string().optional().describe('Error message if navigation failed'),
  }),
  handler: navigate as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Go back tool definition
 */
export const backTool: NavigationToolDefinition = {
  name: 'playwright_go_back',
  description: 'Navigate back in browser history',
  inputSchema: backInputSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether navigation was successful'),
    url: z.string().describe('Current URL after navigating back'),
    title: z.string().describe('Page title after navigating back'),
    previousUrl: z.string().optional().describe('The URL we navigated back from'),
    error: z.string().optional().describe('Error message if operation failed'),
  }),
  handler: back as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Go forward tool definition
 */
export const forwardTool: NavigationToolDefinition = {
  name: 'playwright_go_forward',
  description: 'Navigate forward in browser history',
  inputSchema: forwardInputSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether navigation was successful'),
    url: z.string().describe('Current URL after navigating forward'),
    title: z.string().describe('Page title after navigating forward'),
    previousUrl: z.string().optional().describe('The URL we navigated forward from'),
    error: z.string().optional().describe('Error message if operation failed'),
  }),
  handler: forward as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Reload page tool definition
 */
export const reloadTool: NavigationToolDefinition = {
  name: 'playwright_reload_page',
  description: 'Reload the current page',
  inputSchema: reloadInputSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether reload was successful'),
    url: z.string().describe('Current page URL after reload'),
    title: z.string().optional().describe('Page title after reload'),
    loadTime: z.number().optional().describe('Time taken to reload in milliseconds'),
    error: z.string().optional().describe('Error message if reload failed'),
  }),
  handler: reload as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Get current URL tool definition
 */
export const getUrlTool: NavigationToolDefinition = {
  name: 'playwright_get_current_url',
  description: 'Get the current page URL',
  inputSchema: getUrlInputSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether operation was successful'),
    url: z.string().describe('The current page URL'),
    error: z.string().optional().describe('Error message if operation failed'),
  }),
  handler: getUrl as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Get page title tool definition
 */
export const getTitleTool: NavigationToolDefinition = {
  name: 'playwright_get_page_title',
  description: 'Get the current page title',
  inputSchema: getTitleInputSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether operation was successful'),
    title: z.string().describe('The current page title'),
    error: z.string().optional().describe('Error message if operation failed'),
  }),
  handler: getTitle as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * New tab tool definition
 */
export const newTabTool: NavigationToolDefinition = {
  name: 'playwright_new_tab',
  description: 'Open a new tab',
  inputSchema: newTabInputSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether tab creation was successful'),
    tabId: z.string().describe('ID of the newly created tab'),
    url: z.string().describe('URL of the new tab'),
    title: z.string().optional().describe('Title of the new tab'),
    error: z.string().optional().describe('Error message if operation failed'),
  }),
  handler: newTab as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Close tab tool definition
 */
export const closeTabTool: NavigationToolDefinition = {
  name: 'playwright_close_tab',
  description: 'Close a specific tab',
  inputSchema: closeTabInputSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether tab was closed successfully'),
    closedTabId: z.string().optional().describe('ID of the closed tab'),
    activeTabId: z.string().optional().describe('ID of the newly active tab'),
    error: z.string().optional().describe('Error message if operation failed'),
  }),
  handler: closeTab as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Switch tab tool definition
 */
export const switchTabTool: NavigationToolDefinition = {
  name: 'playwright_switch_tab',
  description: 'Switch to a specific tab',
  inputSchema: switchTabInputSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether tab switch was successful'),
    tabId: z.string().optional().describe('ID of the active tab'),
    url: z.string().optional().describe('URL of the active tab'),
    title: z.string().optional().describe('Title of the active tab'),
    error: z.string().optional().describe('Error message if operation failed'),
  }),
  handler: switchTab as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Wait for navigation tool definition
 */
export const waitForNavigationTool: NavigationToolDefinition = {
  name: 'playwright_wait_for_navigation',
  description: 'Wait for navigation to complete',
  inputSchema: waitForNavigationInputSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether navigation was completed successfully'),
    url: z.string().describe('The URL after navigation completed'),
    title: z.string().optional().describe('Page title after navigation'),
    loadTime: z.number().optional().describe('Time spent waiting in milliseconds'),
    error: z.string().optional().describe('Error message if operation failed'),
  }),
  handler: waitForNavigation as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Array of all navigation tool definitions for easy registration
 */
export const navigationTools: NavigationToolDefinition[] = [
  navigateTool,
  backTool,
  forwardTool,
  reloadTool,
  getUrlTool,
  getTitleTool,
  newTabTool,
  closeTabTool,
  switchTabTool,
  waitForNavigationTool,
];

/**
 * Navigation tool names for type-safe reference
 */
export const NAVIGATION_TOOL_NAMES = {
  NAVIGATE: 'playwright_navigate',
  GO_BACK: 'playwright_go_back',
  GO_FORWARD: 'playwright_go_forward',
  RELOAD_PAGE: 'playwright_reload_page',
  GET_CURRENT_URL: 'playwright_get_current_url',
  GET_PAGE_TITLE: 'playwright_get_page_title',
  NEW_TAB: 'playwright_new_tab',
  CLOSE_TAB: 'playwright_close_tab',
  SWITCH_TAB: 'playwright_switch_tab',
  WAIT_FOR_NAVIGATION: 'playwright_wait_for_navigation',
} as const;

export type NavigationToolName = typeof NAVIGATION_TOOL_NAMES[keyof typeof NAVIGATION_TOOL_NAMES];
