/**
 * Custom error classes for Playwright MCP Server
 * @module utils/errors
 */

/**
 * Base error class for all Playwright MCP errors
 */
export class PlaywrightMCPError extends Error {
  constructor(message: string, public code?: string, public details?: unknown) {
    super(message);
    this.name = 'PlaywrightMCPError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Error thrown when an element cannot be found
 */
export class ElementNotFoundError extends PlaywrightMCPError {
  constructor(selector: string, details?: unknown) {
    super(`Element not found: ${selector}`, 'ELEMENT_NOT_FOUND', details);
    this.name = 'ElementNotFoundError';
  }
}

/**
 * Error thrown when navigation fails
 */
export class NavigationError extends PlaywrightMCPError {
  constructor(url: string, reason?: string, details?: unknown) {
    super(
      `Navigation failed to ${url}${reason ? `: ${reason}` : ''}`,
      'NAVIGATION_ERROR',
      details
    );
    this.name = 'NavigationError';
  }
}

/**
 * Error thrown when an operation times out
 */
export class TimeoutError extends PlaywrightMCPError {
  constructor(operation: string, timeout: number, details?: unknown) {
    super(
      `Operation timed out after ${timeout}ms: ${operation}`,
      'TIMEOUT_ERROR',
      details
    );
    this.name = 'TimeoutError';
  }
}

/**
 * Error thrown when a session operation fails
 */
export class SessionError extends PlaywrightMCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'SESSION_ERROR', details);
    this.name = 'SessionError';
  }
}

/**
 * Error thrown when browser context is not available
 */
export class ContextError extends PlaywrightMCPError {
  constructor(message: string = 'Browser context not available', details?: unknown) {
    super(message, 'CONTEXT_ERROR', details);
    this.name = 'ContextError';
  }
}

/**
 * Error thrown when page is not available
 */
export class PageError extends PlaywrightMCPError {
  constructor(message: string = 'Page not available', details?: unknown) {
    super(message, 'PAGE_ERROR', details);
    this.name = 'PageError';
  }
}
