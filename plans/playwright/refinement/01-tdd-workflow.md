# Playwright MCP - TDD Workflow & Testing Strategy

## Overview

This document defines the Test-Driven Development workflow for the Playwright MCP implementation, following the Red-Green-Refactor cycle with comprehensive coverage targets and testing patterns.

## Testing Philosophy

- **Test-First Development**: All features begin with failing tests
- **Behavior-Driven**: Tests describe what the system does, not how
- **Fast Feedback**: Unit tests run in <5s, integration in <30s
- **Isolation**: Each test is independent and can run in any order
- **Realistic**: Integration tests use real Playwright instances

## Coverage Targets

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 90,           // 90%+ line coverage
      branches: 85,        // 85%+ branch coverage
      functions: 90,       // 90%+ function coverage
      statements: 90,      // 90%+ statement coverage
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/types/**',
        'examples/**',
        'dist/**'
      ]
    },
    environment: 'node',
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
```

## Test File Structure

```
tests/
├── unit/                           # Unit tests (isolated components)
│   ├── browser/
│   │   ├── BrowserManager.test.ts
│   │   ├── BrowserPool.test.ts
│   │   └── SessionManager.test.ts
│   ├── page/
│   │   ├── PageController.test.ts
│   │   ├── NavigationHandler.test.ts
│   │   └── FrameManager.test.ts
│   ├── elements/
│   │   ├── ElementLocator.test.ts
│   │   ├── ElementWaiter.test.ts
│   │   └── SelectorBuilder.test.ts
│   ├── actions/
│   │   ├── ActionExecutor.test.ts
│   │   ├── ClickHandler.test.ts
│   │   ├── TypeHandler.test.ts
│   │   └── UploadHandler.test.ts
│   ├── extraction/
│   │   ├── ContentExtractor.test.ts
│   │   ├── ScreenshotCapture.test.ts
│   │   └── PDFGenerator.test.ts
│   └── mcp/
│       ├── MCPServer.test.ts
│       ├── ToolRegistry.test.ts
│       └── ToolHandler.test.ts
├── integration/                    # Integration tests (multiple components)
│   ├── browser-lifecycle.test.ts
│   ├── navigation-flow.test.ts
│   ├── interaction-flow.test.ts
│   ├── extraction-pipeline.test.ts
│   └── session-management.test.ts
├── e2e/                           # End-to-end tests (full scenarios)
│   ├── simple-automation.test.ts
│   ├── form-submission.test.ts
│   ├── multi-page-workflow.test.ts
│   ├── agent-coordination.test.ts
│   └── error-recovery.test.ts
├── fixtures/                       # Shared test fixtures
│   ├── mock-pages/
│   │   ├── simple.html
│   │   ├── form.html
│   │   └── dynamic.html
│   ├── mock-responses.ts
│   └── test-helpers.ts
└── helpers/                        # Test utilities
    ├── playwright-mock.ts
    ├── mcp-test-client.ts
    └── assertion-helpers.ts
```

## Red-Green-Refactor Cycle

### Phase 1: RED - Write Failing Test

```typescript
// tests/unit/browser/BrowserManager.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserManager } from '../../../src/browser/BrowserManager';
import type { Browser, BrowserContext } from 'playwright';

describe('BrowserManager', () => {
  let browserManager: BrowserManager;
  let mockBrowser: Browser;
  let mockContext: BrowserContext;

  beforeEach(() => {
    // This test will fail initially - driving implementation
    browserManager = new BrowserManager({
      headless: true,
      browserType: 'chromium'
    });
  });

  afterEach(async () => {
    await browserManager.closeAll();
  });

  describe('launch', () => {
    it('should launch chromium browser by default', async () => {
      // RED: Test fails - BrowserManager doesn't exist yet
      const browser = await browserManager.launch();

      expect(browser).toBeDefined();
      expect(browser.browserType().name()).toBe('chromium');
      expect(browser.isConnected()).toBe(true);
    });

    it('should launch firefox when specified', async () => {
      const manager = new BrowserManager({
        headless: true,
        browserType: 'firefox'
      });

      const browser = await manager.launch();

      expect(browser.browserType().name()).toBe('firefox');
      await manager.closeAll();
    });

    it('should launch webkit when specified', async () => {
      const manager = new BrowserManager({
        headless: true,
        browserType: 'webkit'
      });

      const browser = await manager.launch();

      expect(browser.browserType().name()).toBe('webkit');
      await manager.closeAll();
    });

    it('should throw error for invalid browser type', async () => {
      const manager = new BrowserManager({
        headless: true,
        browserType: 'invalid' as any
      });

      await expect(manager.launch()).rejects.toThrow('Unsupported browser type');
    });

    it('should reuse existing browser instance', async () => {
      const browser1 = await browserManager.launch();
      const browser2 = await browserManager.launch();

      expect(browser1).toBe(browser2);
    });

    it('should apply launch options correctly', async () => {
      const manager = new BrowserManager({
        headless: true,
        browserType: 'chromium',
        launchOptions: {
          args: ['--no-sandbox', '--disable-dev-shm-usage'],
          timeout: 30000
        }
      });

      const browser = await manager.launch();
      expect(browser).toBeDefined();

      await manager.closeAll();
    });
  });

  describe('createContext', () => {
    it('should create new browser context', async () => {
      // RED: Test fails - createContext doesn't exist
      const browser = await browserManager.launch();
      const context = await browserManager.createContext();

      expect(context).toBeDefined();
      expect(context.pages()).toHaveLength(0);
    });

    it('should create context with viewport options', async () => {
      await browserManager.launch();
      const context = await browserManager.createContext({
        viewport: { width: 1920, height: 1080 }
      });

      const page = await context.newPage();
      const viewport = page.viewportSize();

      expect(viewport).toEqual({ width: 1920, height: 1080 });
    });

    it('should create context with user agent', async () => {
      await browserManager.launch();
      const customUA = 'Mozilla/5.0 Custom Agent';
      const context = await browserManager.createContext({
        userAgent: customUA
      });

      const page = await context.newPage();
      await page.goto('about:blank');
      const ua = await page.evaluate(() => navigator.userAgent);

      expect(ua).toBe(customUA);
    });

    it('should isolate contexts from each other', async () => {
      await browserManager.launch();
      const context1 = await browserManager.createContext();
      const context2 = await browserManager.createContext();

      // Set cookie in context1
      await context1.addCookies([{
        name: 'test',
        value: 'value1',
        domain: 'localhost',
        path: '/'
      }]);

      // context2 should not have the cookie
      const cookies2 = await context2.cookies();
      expect(cookies2).toHaveLength(0);
    });

    it('should track all created contexts', async () => {
      await browserManager.launch();
      await browserManager.createContext();
      await browserManager.createContext();
      await browserManager.createContext();

      const contexts = browserManager.getActiveContexts();
      expect(contexts).toHaveLength(3);
    });
  });

  describe('closeAll', () => {
    it('should close all contexts and browser', async () => {
      // RED: Test fails - closeAll doesn't exist
      const browser = await browserManager.launch();
      await browserManager.createContext();
      await browserManager.createContext();

      await browserManager.closeAll();

      expect(browser.isConnected()).toBe(false);
      expect(browserManager.getActiveContexts()).toHaveLength(0);
    });

    it('should handle close when nothing is open', async () => {
      await expect(browserManager.closeAll()).resolves.not.toThrow();
    });

    it('should emit close event', async () => {
      const closeSpy = vi.fn();
      browserManager.on('close', closeSpy);

      await browserManager.launch();
      await browserManager.closeAll();

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Phase 2: GREEN - Implement Minimum Code

```typescript
// src/browser/BrowserManager.ts
import { chromium, firefox, webkit, Browser, BrowserContext } from 'playwright';
import { EventEmitter } from 'events';
import type { BrowserType } from './types';

export interface BrowserManagerConfig {
  headless: boolean;
  browserType: BrowserType;
  launchOptions?: any;
}

export class BrowserManager extends EventEmitter {
  private browser: Browser | null = null;
  private contexts: Set<BrowserContext> = new Set();

  constructor(private config: BrowserManagerConfig) {
    super();
  }

  async launch(): Promise<Browser> {
    if (this.browser?.isConnected()) {
      return this.browser;
    }

    const launcher = this.getBrowserLauncher();
    this.browser = await launcher.launch({
      headless: this.config.headless,
      ...this.config.launchOptions
    });

    return this.browser;
  }

  async createContext(options?: any): Promise<BrowserContext> {
    if (!this.browser) {
      await this.launch();
    }

    const context = await this.browser!.newContext(options);
    this.contexts.add(context);

    context.on('close', () => {
      this.contexts.delete(context);
    });

    return context;
  }

  getActiveContexts(): BrowserContext[] {
    return Array.from(this.contexts);
  }

  async closeAll(): Promise<void> {
    for (const context of this.contexts) {
      await context.close();
    }
    this.contexts.clear();

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.emit('close');
    }
  }

  private getBrowserLauncher() {
    switch (this.config.browserType) {
      case 'chromium':
        return chromium;
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      default:
        throw new Error(`Unsupported browser type: ${this.config.browserType}`);
    }
  }
}
```

### Phase 3: REFACTOR - Improve Code Quality

```typescript
// src/browser/BrowserManager.ts (Refactored)
import { chromium, firefox, webkit, Browser, BrowserContext, BrowserType as PWBrowserType } from 'playwright';
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { BrowserError } from '../errors/BrowserError';
import type { BrowserType, BrowserManagerConfig, ContextOptions } from './types';

/**
 * Manages Playwright browser lifecycle and context creation.
 * Provides singleton browser instances and isolated contexts.
 */
export class BrowserManager extends EventEmitter {
  private browser: Browser | null = null;
  private contexts: Set<BrowserContext> = new Set();
  private readonly logger: Logger;
  private isClosing = false;

  constructor(private readonly config: BrowserManagerConfig) {
    super();
    this.logger = new Logger('BrowserManager');
    this.setupCleanup();
  }

  /**
   * Launches browser instance or returns existing one.
   * @returns Promise<Browser> Active browser instance
   * @throws {BrowserError} If browser fails to launch
   */
  async launch(): Promise<Browser> {
    if (this.browser?.isConnected()) {
      this.logger.debug('Reusing existing browser instance');
      return this.browser;
    }

    try {
      this.logger.info(`Launching ${this.config.browserType} browser`, {
        headless: this.config.headless
      });

      const launcher = this.getBrowserLauncher();
      this.browser = await launcher.launch({
        headless: this.config.headless,
        ...this.config.launchOptions
      });

      this.logger.info('Browser launched successfully');
      this.emit('browser:launched', this.browser);

      return this.browser;
    } catch (error) {
      this.logger.error('Failed to launch browser', { error });
      throw new BrowserError('Failed to launch browser', { cause: error });
    }
  }

  /**
   * Creates new isolated browser context.
   * @param options Context configuration options
   * @returns Promise<BrowserContext> New browser context
   * @throws {BrowserError} If context creation fails
   */
  async createContext(options?: ContextOptions): Promise<BrowserContext> {
    if (!this.browser) {
      await this.launch();
    }

    try {
      this.logger.debug('Creating new browser context', { options });

      const context = await this.browser!.newContext(options);
      this.contexts.add(context);

      context.on('close', () => {
        this.logger.debug('Context closed');
        this.contexts.delete(context);
        this.emit('context:closed', context);
      });

      this.logger.info('Browser context created', {
        totalContexts: this.contexts.size
      });

      this.emit('context:created', context);
      return context;
    } catch (error) {
      this.logger.error('Failed to create context', { error });
      throw new BrowserError('Failed to create browser context', { cause: error });
    }
  }

  /**
   * Returns all active browser contexts.
   */
  getActiveContexts(): BrowserContext[] {
    return Array.from(this.contexts);
  }

  /**
   * Closes all contexts and browser instance.
   * @throws {BrowserError} If cleanup fails
   */
  async closeAll(): Promise<void> {
    if (this.isClosing) {
      this.logger.warn('Close already in progress');
      return;
    }

    this.isClosing = true;

    try {
      this.logger.info('Closing all contexts and browser', {
        contextCount: this.contexts.size
      });

      // Close all contexts
      await Promise.all(
        Array.from(this.contexts).map(ctx =>
          ctx.close().catch(err =>
            this.logger.error('Failed to close context', { error: err })
          )
        )
      );
      this.contexts.clear();

      // Close browser
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.logger.info('Browser closed successfully');
        this.emit('close');
      }
    } catch (error) {
      this.logger.error('Error during cleanup', { error });
      throw new BrowserError('Failed to close browser', { cause: error });
    } finally {
      this.isClosing = false;
    }
  }

  /**
   * Gets appropriate browser launcher for configured type.
   */
  private getBrowserLauncher(): PWBrowserType {
    switch (this.config.browserType) {
      case 'chromium':
        return chromium;
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      default:
        throw new BrowserError(`Unsupported browser type: ${this.config.browserType}`);
    }
  }

  /**
   * Sets up cleanup handlers for graceful shutdown.
   */
  private setupCleanup(): void {
    const cleanup = async () => {
      await this.closeAll();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }
}
```

## Unit Test Patterns

### PageController Tests

```typescript
// tests/unit/page/PageController.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PageController } from '../../../src/page/PageController';
import { createMockPage, createMockContext } from '../../helpers/playwright-mock';

describe('PageController', () => {
  let controller: PageController;
  let mockPage: any;
  let mockContext: any;

  beforeEach(() => {
    mockContext = createMockContext();
    mockPage = createMockPage();
    controller = new PageController(mockContext);
  });

  describe('navigate', () => {
    it('should navigate to URL successfully', async () => {
      mockContext.newPage.mockResolvedValue(mockPage);
      mockPage.goto.mockResolvedValue({
        status: () => 200,
        ok: () => true
      });

      const result = await controller.navigate('https://example.com');

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com');
      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          waitUntil: 'domcontentloaded',
          timeout: 30000
        })
      );
    });

    it('should handle navigation timeout', async () => {
      mockContext.newPage.mockResolvedValue(mockPage);
      mockPage.goto.mockRejectedValue(new Error('Navigation timeout'));

      await expect(controller.navigate('https://slow-site.com'))
        .rejects.toThrow('Navigation timeout');
    });

    it('should handle 404 errors', async () => {
      mockContext.newPage.mockResolvedValue(mockPage);
      mockPage.goto.mockResolvedValue({
        status: () => 404,
        ok: () => false
      });

      const result = await controller.navigate('https://example.com/404');

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });

    it('should wait for network idle when specified', async () => {
      mockContext.newPage.mockResolvedValue(mockPage);
      mockPage.goto.mockResolvedValue({ status: () => 200, ok: () => true });

      await controller.navigate('https://example.com', {
        waitUntil: 'networkidle'
      });

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          waitUntil: 'networkidle'
        })
      );
    });
  });

  describe('getContent', () => {
    it('should extract page HTML content', async () => {
      const html = '<html><body><h1>Test</h1></body></html>';
      mockPage.content.mockResolvedValue(html);

      const result = await controller.getContent(mockPage);

      expect(result).toBe(html);
      expect(mockPage.content).toHaveBeenCalled();
    });

    it('should extract inner text', async () => {
      mockPage.evaluate.mockResolvedValue('Test Content');

      const result = await controller.getContent(mockPage, { type: 'text' });

      expect(result).toBe('Test Content');
      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });
});
```

### ElementLocator Tests

```typescript
// tests/unit/elements/ElementLocator.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ElementLocator } from '../../../src/elements/ElementLocator';
import { createMockPage } from '../../helpers/playwright-mock';

describe('ElementLocator', () => {
  let locator: ElementLocator;
  let mockPage: any;

  beforeEach(() => {
    mockPage = createMockPage();
    locator = new ElementLocator(mockPage);
  });

  describe('findElement', () => {
    it('should find element by CSS selector', async () => {
      const mockElement = { isVisible: vi.fn().mockResolvedValue(true) };
      mockPage.locator.mockReturnValue(mockElement);

      const element = await locator.findElement('.my-class');

      expect(element).toBeDefined();
      expect(mockPage.locator).toHaveBeenCalledWith('.my-class');
    });

    it('should find element by text content', async () => {
      const mockElement = { isVisible: vi.fn().mockResolvedValue(true) };
      mockPage.getByText.mockReturnValue(mockElement);

      const element = await locator.findElement({ text: 'Click me' });

      expect(mockPage.getByText).toHaveBeenCalledWith('Click me');
    });

    it('should find element by role', async () => {
      const mockElement = { isVisible: vi.fn().mockResolvedValue(true) };
      mockPage.getByRole.mockReturnValue(mockElement);

      const element = await locator.findElement({
        role: 'button',
        name: 'Submit'
      });

      expect(mockPage.getByRole).toHaveBeenCalledWith('button', { name: 'Submit' });
    });

    it('should find element by test ID', async () => {
      const mockElement = { isVisible: vi.fn().mockResolvedValue(true) };
      mockPage.getByTestId.mockReturnValue(mockElement);

      const element = await locator.findElement({ testId: 'submit-btn' });

      expect(mockPage.getByTestId).toHaveBeenCalledWith('submit-btn');
    });

    it('should throw error if element not found', async () => {
      mockPage.locator.mockReturnValue({
        isVisible: vi.fn().mockResolvedValue(false),
        count: vi.fn().mockResolvedValue(0)
      });

      await expect(locator.findElement('.non-existent'))
        .rejects.toThrow('Element not found');
    });

    it('should wait for element with custom timeout', async () => {
      const mockElement = {
        isVisible: vi.fn()
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(false)
          .mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockElement);

      const element = await locator.findElement('.delayed', {
        timeout: 5000
      });

      expect(element).toBeDefined();
    });
  });

  describe('findElements', () => {
    it('should find multiple elements', async () => {
      const mockElements = [
        { textContent: vi.fn().mockResolvedValue('Item 1') },
        { textContent: vi.fn().mockResolvedValue('Item 2') },
        { textContent: vi.fn().mockResolvedValue('Item 3') }
      ];
      mockPage.locator.mockReturnValue({
        count: vi.fn().mockResolvedValue(3),
        nth: vi.fn((i) => mockElements[i])
      });

      const elements = await locator.findElements('.list-item');

      expect(elements).toHaveLength(3);
    });

    it('should return empty array if no elements found', async () => {
      mockPage.locator.mockReturnValue({
        count: vi.fn().mockResolvedValue(0)
      });

      const elements = await locator.findElements('.non-existent');

      expect(elements).toHaveLength(0);
    });
  });
});
```

### ActionExecutor Tests

```typescript
// tests/unit/actions/ActionExecutor.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionExecutor } from '../../../src/actions/ActionExecutor';
import { createMockPage } from '../../helpers/playwright-mock';

describe('ActionExecutor', () => {
  let executor: ActionExecutor;
  let mockPage: any;

  beforeEach(() => {
    mockPage = createMockPage();
    executor = new ActionExecutor(mockPage);
  });

  describe('click', () => {
    it('should click element by selector', async () => {
      const mockLocator = {
        click: vi.fn().mockResolvedValue(undefined),
        isVisible: vi.fn().mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await executor.click('#submit-btn');

      expect(mockLocator.click).toHaveBeenCalled();
    });

    it('should support double click', async () => {
      const mockLocator = {
        dblclick: vi.fn().mockResolvedValue(undefined),
        isVisible: vi.fn().mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await executor.click('#element', { clickCount: 2 });

      expect(mockLocator.dblclick).toHaveBeenCalled();
    });

    it('should support right click', async () => {
      const mockLocator = {
        click: vi.fn().mockResolvedValue(undefined),
        isVisible: vi.fn().mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await executor.click('#element', { button: 'right' });

      expect(mockLocator.click).toHaveBeenCalledWith({ button: 'right' });
    });

    it('should wait for element before clicking', async () => {
      const mockLocator = {
        click: vi.fn().mockResolvedValue(undefined),
        isVisible: vi.fn()
          .mockResolvedValueOnce(false)
          .mockResolvedValue(true),
        waitFor: vi.fn().mockResolvedValue(undefined)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await executor.click('#delayed-btn', { timeout: 5000 });

      expect(mockLocator.waitFor).toHaveBeenCalledWith({
        state: 'visible',
        timeout: 5000
      });
      expect(mockLocator.click).toHaveBeenCalled();
    });
  });

  describe('type', () => {
    it('should type text into input', async () => {
      const mockLocator = {
        fill: vi.fn().mockResolvedValue(undefined),
        isVisible: vi.fn().mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await executor.type('#username', 'testuser');

      expect(mockLocator.fill).toHaveBeenCalledWith('testuser');
    });

    it('should clear input before typing', async () => {
      const mockLocator = {
        clear: vi.fn().mockResolvedValue(undefined),
        fill: vi.fn().mockResolvedValue(undefined),
        isVisible: vi.fn().mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await executor.type('#username', 'newtext', { clear: true });

      expect(mockLocator.clear).toHaveBeenCalled();
      expect(mockLocator.fill).toHaveBeenCalledWith('newtext');
    });

    it('should simulate keypresses with delay', async () => {
      const mockLocator = {
        pressSequentially: vi.fn().mockResolvedValue(undefined),
        isVisible: vi.fn().mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await executor.type('#username', 'slow', { delay: 100 });

      expect(mockLocator.pressSequentially).toHaveBeenCalledWith('slow', {
        delay: 100
      });
    });
  });

  describe('select', () => {
    it('should select option by value', async () => {
      const mockLocator = {
        selectOption: vi.fn().mockResolvedValue(['option1']),
        isVisible: vi.fn().mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await executor.select('#country', { value: 'us' });

      expect(mockLocator.selectOption).toHaveBeenCalledWith({ value: 'us' });
    });

    it('should select option by label', async () => {
      const mockLocator = {
        selectOption: vi.fn().mockResolvedValue(['option1']),
        isVisible: vi.fn().mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await executor.select('#country', { label: 'United States' });

      expect(mockLocator.selectOption).toHaveBeenCalledWith({
        label: 'United States'
      });
    });

    it('should select multiple options', async () => {
      const mockLocator = {
        selectOption: vi.fn().mockResolvedValue(['opt1', 'opt2']),
        isVisible: vi.fn().mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await executor.select('#tags', [
        { value: 'tag1' },
        { value: 'tag2' }
      ]);

      expect(mockLocator.selectOption).toHaveBeenCalledWith([
        { value: 'tag1' },
        { value: 'tag2' }
      ]);
    });
  });

  describe('upload', () => {
    it('should upload single file', async () => {
      const mockLocator = {
        setInputFiles: vi.fn().mockResolvedValue(undefined),
        isVisible: vi.fn().mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      await executor.upload('#file-input', '/path/to/file.txt');

      expect(mockLocator.setInputFiles).toHaveBeenCalledWith('/path/to/file.txt');
    });

    it('should upload multiple files', async () => {
      const mockLocator = {
        setInputFiles: vi.fn().mockResolvedValue(undefined),
        isVisible: vi.fn().mockResolvedValue(true)
      };
      mockPage.locator.mockReturnValue(mockLocator);

      const files = ['/path/file1.txt', '/path/file2.txt'];
      await executor.upload('#file-input', files);

      expect(mockLocator.setInputFiles).toHaveBeenCalledWith(files);
    });
  });
});
```

### MCP Tool Tests

```typescript
// tests/unit/mcp/MCPServer.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPServer } from '../../../src/mcp/MCPServer';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

describe('MCPServer', () => {
  let mcpServer: MCPServer;

  beforeEach(() => {
    mcpServer = new MCPServer({
      name: 'playwright-mcp',
      version: '1.0.0'
    });
  });

  afterEach(async () => {
    await mcpServer.stop();
  });

  describe('initialization', () => {
    it('should initialize with correct server info', () => {
      const info = mcpServer.getServerInfo();

      expect(info.name).toBe('playwright-mcp');
      expect(info.version).toBe('1.0.0');
    });

    it('should register default tools on initialization', () => {
      const tools = mcpServer.listTools();

      expect(tools).toContain('playwright_navigate');
      expect(tools).toContain('playwright_click');
      expect(tools).toContain('playwright_extract');
      expect(tools.length).toBeGreaterThan(10);
    });
  });

  describe('tool registration', () => {
    it('should register custom tool', () => {
      mcpServer.registerTool({
        name: 'custom_tool',
        description: 'A custom test tool',
        inputSchema: {
          type: 'object',
          properties: {
            param: { type: 'string' }
          }
        },
        handler: async (args) => ({ result: 'success' })
      });

      const tools = mcpServer.listTools();
      expect(tools).toContain('custom_tool');
    });

    it('should throw error for duplicate tool name', () => {
      mcpServer.registerTool({
        name: 'test_tool',
        description: 'Test',
        inputSchema: { type: 'object', properties: {} },
        handler: async () => ({})
      });

      expect(() => {
        mcpServer.registerTool({
          name: 'test_tool',
          description: 'Duplicate',
          inputSchema: { type: 'object', properties: {} },
          handler: async () => ({})
        });
      }).toThrow('Tool already registered');
    });
  });

  describe('tool execution', () => {
    it('should execute navigate tool successfully', async () => {
      const result = await mcpServer.executeTool('playwright_navigate', {
        url: 'https://example.com'
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('url', 'https://example.com');
    });

    it('should validate tool input schema', async () => {
      await expect(
        mcpServer.executeTool('playwright_navigate', {
          invalidParam: 'value'
        })
      ).rejects.toThrow('Invalid input schema');
    });

    it('should handle tool execution errors', async () => {
      const result = await mcpServer.executeTool('playwright_navigate', {
        url: 'invalid-url'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should throw error for unknown tool', async () => {
      await expect(
        mcpServer.executeTool('unknown_tool', {})
      ).rejects.toThrow('Tool not found');
    });
  });

  describe('lifecycle', () => {
    it('should start server successfully', async () => {
      await expect(mcpServer.start()).resolves.not.toThrow();
      expect(mcpServer.isRunning()).toBe(true);
    });

    it('should stop server gracefully', async () => {
      await mcpServer.start();
      await mcpServer.stop();

      expect(mcpServer.isRunning()).toBe(false);
    });

    it('should cleanup resources on stop', async () => {
      await mcpServer.start();

      const cleanupSpy = vi.spyOn(mcpServer as any, 'cleanup');
      await mcpServer.stop();

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
});
```

## Integration Test Patterns

```typescript
// tests/integration/browser-lifecycle.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/BrowserManager';
import { PageController } from '../../src/page/PageController';

describe('Browser Lifecycle Integration', () => {
  let browserManager: BrowserManager;
  let pageController: PageController;

  beforeAll(async () => {
    browserManager = new BrowserManager({
      headless: true,
      browserType: 'chromium'
    });
  });

  afterAll(async () => {
    await browserManager.closeAll();
  });

  it('should complete full lifecycle: launch -> navigate -> extract -> close', async () => {
    // Launch browser
    const browser = await browserManager.launch();
    expect(browser.isConnected()).toBe(true);

    // Create context
    const context = await browserManager.createContext();
    pageController = new PageController(context);

    // Navigate to page
    const navResult = await pageController.navigate('https://example.com');
    expect(navResult.success).toBe(true);

    // Extract content
    const page = context.pages()[0];
    const content = await page.content();
    expect(content).toContain('Example Domain');

    // Cleanup
    await browserManager.closeAll();
    expect(browser.isConnected()).toBe(false);
  });

  it('should handle multiple concurrent contexts', async () => {
    await browserManager.launch();

    const [ctx1, ctx2, ctx3] = await Promise.all([
      browserManager.createContext(),
      browserManager.createContext(),
      browserManager.createContext()
    ]);

    const [page1, page2, page3] = await Promise.all([
      ctx1.newPage(),
      ctx2.newPage(),
      ctx3.newPage()
    ]);

    await Promise.all([
      page1.goto('https://example.com'),
      page2.goto('https://example.org'),
      page3.goto('https://example.net')
    ]);

    expect(browserManager.getActiveContexts()).toHaveLength(3);
  });
});
```

## E2E Test Scenarios

```typescript
// tests/e2e/form-submission.test.ts
import { describe, it, expect } from 'vitest';
import { PlaywrightMCP } from '../../src/index';
import { createTestServer } from '../helpers/test-server';

describe('E2E: Form Submission Workflow', () => {
  let mcp: PlaywrightMCP;
  let server: any;

  beforeAll(async () => {
    server = await createTestServer();
    mcp = new PlaywrightMCP({ headless: true });
    await mcp.start();
  });

  afterAll(async () => {
    await mcp.stop();
    await server.close();
  });

  it('should complete multi-step form submission', async () => {
    // Step 1: Navigate
    await mcp.navigate(server.url('/form'));

    // Step 2: Fill text inputs
    await mcp.type('#firstName', 'John');
    await mcp.type('#lastName', 'Doe');
    await mcp.type('#email', 'john@example.com');

    // Step 3: Select dropdown
    await mcp.select('#country', { value: 'us' });

    // Step 4: Check checkbox
    await mcp.click('#terms');

    // Step 5: Submit form
    await mcp.click('button[type="submit"]');

    // Step 6: Wait for confirmation
    await mcp.waitForSelector('.success-message');

    // Step 7: Verify success
    const message = await mcp.extract({
      selector: '.success-message',
      type: 'text'
    });

    expect(message).toContain('Form submitted successfully');
  });
});
```

## Mock Strategies

```typescript
// tests/helpers/playwright-mock.ts
import { vi } from 'vitest';

export function createMockBrowser() {
  return {
    isConnected: vi.fn().mockReturnValue(true),
    newContext: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
    browserType: vi.fn().mockReturnValue({
      name: vi.fn().mockReturnValue('chromium')
    })
  };
}

export function createMockContext() {
  return {
    newPage: vi.fn(),
    pages: vi.fn().mockReturnValue([]),
    close: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    addCookies: vi.fn().mockResolvedValue(undefined),
    cookies: vi.fn().mockResolvedValue([])
  };
}

export function createMockPage() {
  return {
    goto: vi.fn().mockResolvedValue({ status: () => 200, ok: () => true }),
    content: vi.fn().mockResolvedValue('<html></html>'),
    title: vi.fn().mockResolvedValue('Test Page'),
    locator: vi.fn(),
    getByText: vi.fn(),
    getByRole: vi.fn(),
    getByTestId: vi.fn(),
    evaluate: vi.fn(),
    waitForSelector: vi.fn(),
    screenshot: vi.fn().mockResolvedValue(Buffer.from('')),
    pdf: vi.fn().mockResolvedValue(Buffer.from('')),
    viewportSize: vi.fn().mockReturnValue({ width: 1280, height: 720 })
  };
}

export function createMockLocator() {
  return {
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    selectOption: vi.fn().mockResolvedValue([]),
    isVisible: vi.fn().mockResolvedValue(true),
    isEnabled: vi.fn().mockResolvedValue(true),
    textContent: vi.fn().mockResolvedValue(''),
    getAttribute: vi.fn().mockResolvedValue(''),
    count: vi.fn().mockResolvedValue(1),
    nth: vi.fn(),
    waitFor: vi.fn().mockResolvedValue(undefined)
  };
}
```

## Test Execution Commands

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "vitest run tests/e2e",
    "test:debug": "vitest --inspect-brk --no-file-parallelism"
  }
}
```

## Continuous Testing Workflow

1. **Pre-commit**: Run unit tests
2. **Pre-push**: Run unit + integration tests
3. **CI Pipeline**: Run all tests with coverage
4. **Nightly**: Run E2E tests with multiple browsers

## Success Criteria

- ✅ All tests pass (Red → Green → Refactor)
- ✅ 90%+ line coverage achieved
- ✅ 85%+ branch coverage achieved
- ✅ No skipped or pending tests
- ✅ All edge cases covered
- ✅ Integration tests validate component interactions
- ✅ E2E tests validate user workflows
- ✅ Performance tests validate speed requirements
