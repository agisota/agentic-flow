/**
 * Type definitions index for agentic-playwright
 * Exports all types used throughout the package
 *
 * @module types
 */

// Browser types - core configuration and management
export type {
  // Basic browser types
  BrowserType,
  BrowserOptions,
  BrowserInstance,
  BrowserStatus,

  // Pool configuration
  PoolConfig,

  // Health monitoring
  HealthConfig,
  HealthStatus,

  // Performance metrics
  BrowserMetrics,

  // Page and context options
  PageOptions,
  BrowserContextOptions,

  // Proxy settings
  ProxySettings,

  // Manager configuration
  BrowserManagerConfig,

  // Reports
  ShutdownReport,
  MemoryReport,
} from './browser.js';

// Navigation types
export type {
  NavigationContext,
} from '../tools/navigation/context.js';

export type {
  NavigateInput,
  NavigateOutput,
} from '../tools/navigation/navigate.js';

export type {
  BackInput,
  BackOutput,
} from '../tools/navigation/back.js';

export type {
  ForwardInput,
  ForwardOutput,
} from '../tools/navigation/forward.js';

export type {
  ReloadInput,
  ReloadOutput,
} from '../tools/navigation/reload.js';

export type {
  GetUrlInput,
  GetUrlOutput,
} from '../tools/navigation/getUrl.js';

export type {
  GetTitleInput,
  GetTitleOutput,
} from '../tools/navigation/getTitle.js';

export type {
  NewTabInput,
  NewTabOutput,
} from '../tools/navigation/newTab.js';

export type {
  CloseTabInput,
  CloseTabOutput,
} from '../tools/navigation/closeTab.js';

export type {
  SwitchTabInput,
  SwitchTabOutput,
} from '../tools/navigation/switchTab.js';

export type {
  WaitForNavigationInput,
  WaitForNavigationOutput,
} from '../tools/navigation/waitForNavigation.js';

// Interaction types
export type {
  ClickOptions as ClickInput,
  ClickResult as ClickOutput,
} from '../tools/interaction/click.js';

// Error types
export {
  PlaywrightMCPError,
  ElementNotFoundError,
  NavigationError,
  TimeoutError,
  SessionError,
  ContextError,
  PageError,
} from '../utils/errors.js';

// Tool name constants
export { NAVIGATION_TOOL_NAMES } from '../tools/navigation/index.js';
export { EXTRACTION_TOOL_NAMES, type ExtractionToolName } from '../tools/extraction/index.js';

// Utility types
export { SelectorType } from '../utils/selectors.js';
export type { ParsedSelector } from '../utils/selectors.js';
export type { SessionInfo } from '../utils/context.js';
