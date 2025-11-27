/**
 * MCP Server Exports
 *
 * Public API for the Agentic Playwright MCP server
 */

export { createPlaywrightMCPServer } from './server.js';

/**
 * MCP server metadata
 */
export const MCP_SERVER_INFO = {
  name: 'agentic-playwright',
  version: '1.0.0',
  description: 'AI-powered browser automation with Playwright and MCP',
  tools: [
    {
      name: 'playwright_navigate',
      description: 'Navigate to a URL in the browser'
    },
    {
      name: 'playwright_screenshot',
      description: 'Take a screenshot of the current page or a specific URL'
    },
    {
      name: 'playwright_extract_text',
      description: 'Extract text content from the page or a specific selector'
    },
    {
      name: 'playwright_click',
      description: 'Click an element on the page'
    },
    {
      name: 'playwright_fill',
      description: 'Fill a form field with text'
    },
    {
      name: 'playwright_query',
      description: 'Query elements on the page and get their properties'
    },
    {
      name: 'playwright_close_session',
      description: 'Close a browser session'
    }
  ],
  resources: [
    {
      uri: 'playwright://session/{sessionId}',
      name: 'Browser Session',
      description: 'Persistent browser session for multi-step automation'
    },
    {
      uri: 'playwright://page/{sessionId}',
      name: 'Browser Page',
      description: 'Current page state in a browser session'
    }
  ]
} as const;

/**
 * Tool names exported as constants for type safety
 */
export const TOOL_NAMES = {
  NAVIGATE: 'playwright_navigate',
  SCREENSHOT: 'playwright_screenshot',
  EXTRACT_TEXT: 'playwright_extract_text',
  CLICK: 'playwright_click',
  FILL: 'playwright_fill',
  QUERY: 'playwright_query',
  CLOSE_SESSION: 'playwright_close_session'
} as const;

/**
 * Resource URIs exported as constants
 */
export const RESOURCE_URIS = {
  SESSION: 'playwright://session',
  PAGE: 'playwright://page'
} as const;
