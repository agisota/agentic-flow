/**
 * Agentic Playwright - Main Entry Point
 *
 * AI-powered browser automation with Playwright and MCP protocol support.
 *
 * This package provides:
 * - Comprehensive browser automation tools via MCP
 * - Smart browser pool management with health monitoring
 * - Type-safe tool definitions and schemas
 * - Navigation, interaction, extraction, session, and network tools
 * - CLI interface for quick testing
 *
 * @module agentic-playwright
 * @see {@link https://github.com/ruvnet/agentic-flow}
 */

// ============================================================================
// Core Components - Browser management and pooling
// ============================================================================
export { BrowserManager } from './components/index.js';
export { default as BrowserManagerDefault } from './components/index.js';

// ============================================================================
// All Tools - Complete tool suite for browser automation
// ============================================================================
export {
  // Tool arrays by category
  navigationTools,
  extractionTools,
  sessionTools,
  networkTools,

  // Combined tool array
  allTools,
  toolCategories,
  TOTAL_TOOL_COUNT,

  // Navigation tools
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
  NavigationContextManager,

  // Interaction tools
  click,
  doubleClick,
  typeText,
  fill,
  clear,
  press,
  select,
  check,
  uncheck,
  hover,
  focus,
  dragDrop,
  upload,
  scroll,

  // Extraction tools
  getText,
  getAttribute,
  getValue,
  getInnerHtml,
  getOuterHtml,
  screenshot,
  pdf,
  getTable,
  evaluate,
  getElements,

  // Session tools
  getCookies,
  setCookie,
  deleteCookies,
  getStorage,
  setStorage,
  saveSession,
  restoreSession,

  // Network tools
  intercept,
  mock,
  waitForRequest,
  waitForResponse,
  setOffline,
  setExtraHeaders,
  cleanupNetworkTools,

  // Tool name constants
  NAVIGATION_TOOL_NAMES,
  EXTRACTION_TOOL_NAMES,
} from './tools/index.js';

// ============================================================================
// Type Definitions - Comprehensive type exports
// ============================================================================
export type {
  // Browser types
  BrowserType,
  BrowserOptions,
  BrowserInstance,
  BrowserStatus,
  PoolConfig,
  HealthConfig,
  HealthStatus,
  BrowserMetrics,
  PageOptions,
  BrowserContextOptions,
  ProxySettings,
  BrowserManagerConfig,
  ShutdownReport,
  MemoryReport,

  // Navigation types
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

  // Interaction types
  ClickInput,
  ClickOutput,

  // Tool name types
  ExtractionToolName,
} from './types/index.js';

// ============================================================================
// Error Classes - Custom error types
// ============================================================================
export {
  PlaywrightMCPError,
  ElementNotFoundError,
  NavigationError,
  TimeoutError,
  SessionError,
  ContextError,
  PageError,
} from './types/index.js';

// ============================================================================
// Utilities - Helper functions and shared utilities
// ============================================================================
export {
  // Context management
  getCurrentPage,
  getCurrentContext,
  getCurrentBrowser,
  getContextManager,

  // Logging
  logger,
  createLogger,

  // Selectors
  parseSelector,
  buildSelector,
  normalizeSelector,
  isValidSelector,
  isXPath,
  hasEngine,
  escapeCSSSelector,
  testIdSelector,
  textSelector,
  roleSelector,
  SelectorType,
} from './utils/index.js';

export type {
  SessionInfo,
  ParsedSelector,
} from './utils/index.js';

// ============================================================================
// MCP Server - FastMCP server implementation
// ============================================================================
export { createPlaywrightMCPServer } from './mcp/index.js';

// ============================================================================
// Package Metadata
// ============================================================================

/**
 * Package version
 */
export const VERSION = '1.0.0';

/**
 * Package name
 */
export const PACKAGE_NAME = 'agentic-playwright';

/**
 * Package description
 */
export const PACKAGE_DESCRIPTION = 'AI-powered browser automation with Playwright and MCP';

/**
 * Default configuration values
 */
export const DEFAULTS = {
  BROWSER_TYPE: 'chromium' as const,
  HEADLESS: true,
  TIMEOUT: 30000,
  POOL_MIN: 1,
  POOL_MAX: 5,
  IDLE_TIMEOUT: 300000, // 5 minutes
} as const;
