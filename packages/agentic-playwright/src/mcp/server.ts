/**
 * Agentic Playwright MCP Server
 *
 * FastMCP server implementation providing browser automation tools via MCP protocol
 */

import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

/**
 * Browser session manager
 */
class BrowserSessionManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private sessions: Map<string, { context: BrowserContext; page: Page }> = new Map();

  async getOrCreatePage(): Promise<Page> {
    if (this.page && this.page.isClosed() === false) {
      return this.page;
    }

    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }

    if (!this.context) {
      this.context = await this.browser.newContext();
    }

    this.page = await this.context.newPage();
    return this.page;
  }

  async createSession(sessionId: string): Promise<Page> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }

    const context = await this.browser.newContext();
    const page = await context.newPage();

    this.sessions.set(sessionId, { context, page });
    return page;
  }

  getSession(sessionId: string): Page | null {
    return this.sessions.get(sessionId)?.page || null;
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.context.close();
      this.sessions.delete(sessionId);
    }
  }

  async closeAll(): Promise<void> {
    for (const [sessionId, _] of this.sessions) {
      await this.closeSession(sessionId);
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
      this.page = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

/**
 * Create and configure the Playwright MCP server
 */
export function createPlaywrightMCPServer(): FastMCP {
  const server = new FastMCP({
    name: 'agentic-playwright',
    version: '1.0.0'
  });

  const sessionManager = new BrowserSessionManager();

  // Tool: Navigate to URL
  server.addTool({
    name: 'playwright_navigate',
    description: 'Navigate to a URL in the browser',
    parameters: z.object({
      url: z.string().url().describe('The URL to navigate to'),
      sessionId: z.string().optional().describe('Optional session ID for managing multiple pages'),
      waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).optional().default('load').describe('When to consider navigation succeeded'),
      timeout: z.number().optional().default(30000).describe('Navigation timeout in milliseconds')
    }),
    execute: async ({ url, sessionId, waitUntil, timeout }) => {
      try {
        const page = sessionId
          ? await sessionManager.createSession(sessionId)
          : await sessionManager.getOrCreatePage();

        await page.goto(url, { waitUntil, timeout });

        const title = await page.title();
        const currentUrl = page.url();

        return JSON.stringify({
          success: true,
          url: currentUrl,
          title,
          sessionId,
          timestamp: new Date().toISOString()
        }, null, 2);
      } catch (error: any) {
        throw new Error(`Navigation failed: ${error.message}`);
      }
    }
  });

  // Tool: Take Screenshot
  server.addTool({
    name: 'playwright_screenshot',
    description: 'Take a screenshot of the current page or a specific URL',
    parameters: z.object({
      url: z.string().url().optional().describe('URL to screenshot (or use current page if omitted)'),
      sessionId: z.string().optional().describe('Session ID to use'),
      fullPage: z.boolean().optional().default(true).describe('Capture full scrollable page'),
      selector: z.string().optional().describe('Specific element selector to screenshot'),
      format: z.enum(['png', 'jpeg']).optional().default('png').describe('Image format'),
      quality: z.number().min(0).max(100).optional().describe('JPEG quality (0-100)')
    }),
    execute: async ({ url, sessionId, fullPage, selector, format, quality }) => {
      try {
        const page = sessionId
          ? sessionManager.getSession(sessionId) || await sessionManager.createSession(sessionId)
          : await sessionManager.getOrCreatePage();

        if (url) {
          await page.goto(url, { waitUntil: 'networkidle' });
        }

        const options: any = { type: format, fullPage };
        if (format === 'jpeg' && quality) {
          options.quality = quality;
        }

        const screenshot = selector
          ? await page.locator(selector).screenshot(options)
          : await page.screenshot(options);

        const base64 = screenshot.toString('base64');

        return JSON.stringify({
          success: true,
          format,
          size: screenshot.length,
          base64,
          fullPage,
          selector,
          url: page.url(),
          timestamp: new Date().toISOString()
        }, null, 2);
      } catch (error: any) {
        throw new Error(`Screenshot failed: ${error.message}`);
      }
    }
  });

  // Tool: Extract Text Content
  server.addTool({
    name: 'playwright_extract_text',
    description: 'Extract text content from the page or a specific selector',
    parameters: z.object({
      selector: z.string().optional().describe('CSS selector to extract text from (or entire page if omitted)'),
      sessionId: z.string().optional().describe('Session ID to use'),
      url: z.string().url().optional().describe('URL to navigate to before extraction')
    }),
    execute: async ({ selector, sessionId, url }) => {
      try {
        const page = sessionId
          ? sessionManager.getSession(sessionId) || await sessionManager.createSession(sessionId)
          : await sessionManager.getOrCreatePage();

        if (url) {
          await page.goto(url, { waitUntil: 'networkidle' });
        }

        const text = selector
          ? await page.locator(selector).textContent()
          : await page.textContent('body');

        return JSON.stringify({
          success: true,
          text: text?.trim() || '',
          selector,
          url: page.url(),
          length: text?.length || 0,
          timestamp: new Date().toISOString()
        }, null, 2);
      } catch (error: any) {
        throw new Error(`Text extraction failed: ${error.message}`);
      }
    }
  });

  // Tool: Click Element
  server.addTool({
    name: 'playwright_click',
    description: 'Click an element on the page',
    parameters: z.object({
      selector: z.string().describe('CSS selector of element to click'),
      sessionId: z.string().optional().describe('Session ID to use'),
      waitForNavigation: z.boolean().optional().default(false).describe('Wait for navigation after click'),
      timeout: z.number().optional().default(30000).describe('Timeout in milliseconds')
    }),
    execute: async ({ selector, sessionId, waitForNavigation, timeout }) => {
      try {
        const page = sessionId
          ? sessionManager.getSession(sessionId) || await sessionManager.createSession(sessionId)
          : await sessionManager.getOrCreatePage();

        if (waitForNavigation) {
          await Promise.all([
            page.waitForNavigation({ timeout }),
            page.click(selector, { timeout })
          ]);
        } else {
          await page.click(selector, { timeout });
        }

        return JSON.stringify({
          success: true,
          selector,
          url: page.url(),
          timestamp: new Date().toISOString()
        }, null, 2);
      } catch (error: any) {
        throw new Error(`Click failed: ${error.message}`);
      }
    }
  });

  // Tool: Fill Form Field
  server.addTool({
    name: 'playwright_fill',
    description: 'Fill a form field with text',
    parameters: z.object({
      selector: z.string().describe('CSS selector of input element'),
      value: z.string().describe('Value to fill'),
      sessionId: z.string().optional().describe('Session ID to use'),
      timeout: z.number().optional().default(30000).describe('Timeout in milliseconds')
    }),
    execute: async ({ selector, value, sessionId, timeout }) => {
      try {
        const page = sessionId
          ? sessionManager.getSession(sessionId) || await sessionManager.createSession(sessionId)
          : await sessionManager.getOrCreatePage();

        await page.fill(selector, value, { timeout });

        return JSON.stringify({
          success: true,
          selector,
          value,
          url: page.url(),
          timestamp: new Date().toISOString()
        }, null, 2);
      } catch (error: any) {
        throw new Error(`Fill failed: ${error.message}`);
      }
    }
  });

  // Tool: Query Elements
  server.addTool({
    name: 'playwright_query',
    description: 'Query elements on the page and get their properties',
    parameters: z.object({
      selector: z.string().describe('CSS selector to query'),
      sessionId: z.string().optional().describe('Session ID to use'),
      properties: z.array(z.string()).optional().default(['textContent', 'href']).describe('Properties to extract'),
      limit: z.number().optional().default(10).describe('Maximum number of elements to return')
    }),
    execute: async ({ selector, sessionId, properties, limit }) => {
      try {
        const page = sessionId
          ? sessionManager.getSession(sessionId) || await sessionManager.createSession(sessionId)
          : await sessionManager.getOrCreatePage();

        const elements = await page.locator(selector).all();
        const limited = elements.slice(0, limit);

        const results = await Promise.all(
          limited.map(async (element, index) => {
            const data: any = { index };
            for (const prop of properties) {
              try {
                if (prop === 'textContent') {
                  data[prop] = await element.textContent();
                } else {
                  data[prop] = await element.getAttribute(prop);
                }
              } catch {
                data[prop] = null;
              }
            }
            return data;
          })
        );

        return JSON.stringify({
          success: true,
          selector,
          count: elements.length,
          returned: results.length,
          elements: results,
          url: page.url(),
          timestamp: new Date().toISOString()
        }, null, 2);
      } catch (error: any) {
        throw new Error(`Query failed: ${error.message}`);
      }
    }
  });

  // Tool: Close Session
  server.addTool({
    name: 'playwright_close_session',
    description: 'Close a browser session',
    parameters: z.object({
      sessionId: z.string().describe('Session ID to close')
    }),
    execute: async ({ sessionId }) => {
      try {
        await sessionManager.closeSession(sessionId);

        return JSON.stringify({
          success: true,
          sessionId,
          timestamp: new Date().toISOString()
        }, null, 2);
      } catch (error: any) {
        throw new Error(`Failed to close session: ${error.message}`);
      }
    }
  });

  // Graceful shutdown handler
  const shutdown = async () => {
    console.error('🛑 Shutting down Playwright MCP Server...');
    try {
      await sessionManager.closeAll();
      console.error('✅ All browser sessions closed');
    } catch (error: any) {
      console.error('❌ Error during shutdown:', error.message);
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}

/**
 * Start the MCP server (for direct execution)
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createPlaywrightMCPServer();

  server.start({ transportType: 'stdio' })
    .then(() => {
      console.error('✅ Agentic Playwright MCP Server running on stdio');
      console.error('📋 Registered 7 tools:');
      console.error('   - playwright_navigate');
      console.error('   - playwright_screenshot');
      console.error('   - playwright_extract_text');
      console.error('   - playwright_click');
      console.error('   - playwright_fill');
      console.error('   - playwright_query');
      console.error('   - playwright_close_session');
    })
    .catch((error) => {
      console.error('❌ Failed to start MCP server:', error);
      process.exit(1);
    });
}
