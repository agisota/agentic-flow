/**
 * Tools Index - Central export for all Playwright MCP tools
 *
 * This module provides a unified interface to all browser automation tools
 * organized by category. Each tool is designed to work with the MCP protocol
 * and provides type-safe inputs and outputs.
 *
 * @module tools
 */

// ============================================================================
// Navigation Tools - Page navigation and tab management
// ============================================================================
export {
  // Tool implementations
  navigate,
  back,
  forward,
  reload,
  getUrl,
  getTitle,
  newTab,
  closeTab,
  switchTab,
  waitForNavigation,

  // Tool definitions for MCP
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

  // Input schemas
  navigateInputSchema,
  backInputSchema,
  forwardInputSchema,
  reloadInputSchema,
  getUrlInputSchema,
  getTitleInputSchema,
  newTabInputSchema,
  closeTabInputSchema,
  switchTabInputSchema,
  waitForNavigationInputSchema,

  // Aggregated array
  navigationTools,
  NAVIGATION_TOOL_NAMES,

  // Context manager
  NavigationContextManager,
} from './navigation/index.js';

export type {
  NavigationContext,
  NavigateInput,
  NavigateOutput,
  BackInput,
  BackOutput,
  ForwardInput,
  ForwardOutput,
  ReloadInput,
  ReloadOutput,
  GetUrlInput,
  GetUrlOutput,
  GetTitleInput,
  GetTitleOutput,
  NewTabInput,
  NewTabOutput,
  CloseTabInput,
  CloseTabOutput,
  SwitchTabInput,
  SwitchTabOutput,
  WaitForNavigationInput,
  WaitForNavigationOutput,
} from './navigation/index.js';

// ============================================================================
// Interaction Tools - User interaction simulation
// ============================================================================
export {
  // Click interactions
  click,
  doubleClick,

  // Text input
  type as typeText,
  fill,
  clear,

  // Keyboard
  press,

  // Selection
  select,

  // Checkbox
  check,
  uncheck,

  // Mouse
  hover,
  focus,
  dragDrop,

  // File
  upload,

  // Scroll
  scroll,
} from './interaction/index.js';

export type {
  ClickOptions,
  ClickResult,
} from './interaction/click.js';

// ============================================================================
// Extraction Tools - Data extraction from pages
// ============================================================================
export {
  // Tool implementations
  getText,
  getAttribute,
  getValue,
  getInnerHtml,
  getOuterHtml,
  screenshot,
  generatePdf as pdf,
  getTable,
  evaluate,
  getElements,

  // Tool definitions for MCP
  getTextTool,
  getAttributeTool,
  getValueTool,
  getInnerHtmlTool,
  getOuterHtmlTool,
  screenshotTool,
  pdfTool,
  getTableTool,
  evaluateTool,
  getElementsTool,

  // Aggregated array
  extractionTools,
  EXTRACTION_TOOL_NAMES,
} from './extraction/index.js';

export type {
  ExtractionToolName,
} from './extraction/index.js';

// ============================================================================
// Session Tools - Cookie, storage, and session management
// ============================================================================
export {
  // Tool implementations
  getCookies,
  setCookie,
  deleteCookies,
  getStorage,
  setStorage,
  saveSession,
  restoreSession,

  // Tool definitions for MCP
  getCookiesTool,
  setCookieTool,
  deleteCookiesTool,
  getStorageTool,
  setStorageTool,
  saveSessionTool,
  restoreSessionTool,

  // Aggregated array
  sessionTools,
} from './session/index.js';

// ============================================================================
// Network Tools - Request/response interception and mocking
// ============================================================================
export {
  // Tool implementations
  intercept,
  mock,
  waitForRequest,
  waitForResponse,
  setOffline,
  setExtraHeaders,

  // Tool definitions for MCP
  interceptTool,
  mockTool,
  waitForRequestTool,
  waitForResponseTool,
  setOfflineTool,
  setExtraHeadersTool,

  // Aggregated array and utilities
  networkTools,
  cleanupIntercepts,
  cleanupMocks,
  cleanupNetworkTools,
} from './network/index.js';

// ============================================================================
// Combined Tool Arrays - All tools aggregated for easy MCP registration
// ============================================================================

import { navigationTools } from './navigation/index.js';
import { extractionTools } from './extraction/index.js';
import { sessionTools } from './session/index.js';
import { networkTools } from './network/index.js';

/**
 * All MCP tools combined into a single array for easy registration
 * with an MCP server. This includes all navigation, extraction, session,
 * and network tools.
 *
 * @example
 * ```typescript
 * import { allTools } from 'agentic-playwright/tools';
 *
 * // Register all tools with MCP server
 * allTools.forEach(tool => server.registerTool(tool));
 * ```
 */
export const allTools = [
  ...navigationTools,
  ...extractionTools,
  ...sessionTools,
  ...networkTools,
] as const;

/**
 * Tool categories for selective registration
 */
export const toolCategories = {
  navigation: navigationTools,
  extraction: extractionTools,
  session: sessionTools,
  network: networkTools,
} as const;

/**
 * Total count of available tools
 */
export const TOTAL_TOOL_COUNT = allTools.length;
