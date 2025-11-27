# Core Component Specifications

**Version:** 1.0.0
**Date:** 2025-11-27

---

## 1. BrowserManager

### 1.1 Responsibility

Manages the lifecycle of Playwright browser instances, including creation, pooling, health monitoring, and cleanup.

### 1.2 Interface

```typescript
interface BrowserManager {
  // Lifecycle Management
  launch(options?: LaunchOptions): Promise<Browser>;
  close(browserId: string): Promise<void>;
  closeAll(): Promise<void>;

  // Pool Management
  getBrowser(poolKey?: string): Promise<Browser>;
  releaseBrowser(browserId: string): Promise<void>;
  getPoolStats(): BrowserPoolStats;

  // Health & Monitoring
  healthCheck(browserId: string): Promise<HealthStatus>;
  isAvailable(browserId: string): boolean;
  getBrowserMetrics(browserId: string): BrowserMetrics;

  // Configuration
  setPoolSize(min: number, max: number): void;
  setBrowserType(type: 'chromium' | 'firefox' | 'webkit'): void;
}

interface LaunchOptions {
  browserType?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  proxy?: ProxySettings;
  args?: string[];
  timeout?: number;
}

interface BrowserPoolStats {
  total: number;
  active: number;
  idle: number;
  pending: number;
  failed: number;
}

interface BrowserMetrics {
  id: string;
  uptime: number;
  memoryUsage: number;
  pageCount: number;
  requestCount: number;
  errorCount: number;
}
```

### 1.3 Implementation Design

```typescript
class BrowserManagerImpl implements BrowserManager {
  private pool: Map<string, BrowserInstance> = new Map();
  private queue: PendingRequest[] = [];
  private config: BrowserConfig;

  constructor(config: BrowserConfig) {
    this.config = config;
    this.initializePool();
  }

  private async initializePool(): Promise<void> {
    // Pre-warm browser pool
    for (let i = 0; i < this.config.minBrowsers; i++) {
      await this.createBrowser();
    }

    // Start health check interval
    setInterval(() => this.runHealthChecks(), 30000);
  }

  private async createBrowser(): Promise<BrowserInstance> {
    const browser = await playwright[this.config.browserType].launch({
      headless: this.config.headless,
      args: this.config.args,
    });

    const instance: BrowserInstance = {
      id: generateId(),
      browser,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      status: 'idle',
      metrics: initMetrics(),
    };

    this.pool.set(instance.id, instance);
    return instance;
  }

  async getBrowser(poolKey?: string): Promise<Browser> {
    // Try to get idle browser
    const idle = Array.from(this.pool.values())
      .find(b => b.status === 'idle');

    if (idle) {
      idle.status = 'active';
      idle.lastUsed = Date.now();
      return idle.browser;
    }

    // Create new if under max limit
    if (this.pool.size < this.config.maxBrowsers) {
      const instance = await this.createBrowser();
      instance.status = 'active';
      return instance.browser;
    }

    // Wait for available browser
    return this.waitForAvailableBrowser();
  }

  private async runHealthChecks(): Promise<void> {
    for (const [id, instance] of this.pool.entries()) {
      try {
        // Check if browser is responsive
        const contexts = instance.browser.contexts();

        // Restart if unhealthy
        if (!instance.browser.isConnected()) {
          await this.restartBrowser(id);
        }
      } catch (error) {
        logger.error(`Health check failed for ${id}:`, error);
        await this.restartBrowser(id);
      }
    }
  }
}
```

### 1.4 Key Design Decisions

- **Pooling Strategy**: Object pool pattern to reduce launch overhead
- **Health Monitoring**: Periodic checks with auto-restart on failure
- **Resource Limits**: Configurable min/max browsers for scaling
- **Cleanup**: Automatic disposal of idle browsers after timeout

---

## 2. PageController

### 2.1 Responsibility

Controls page navigation, lifecycle events, and page-level operations.

### 2.2 Interface

```typescript
interface PageController {
  // Navigation
  navigate(url: string, options?: NavigationOptions): Promise<NavigationResult>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
  reload(options?: ReloadOptions): Promise<void>;

  // Page State
  waitForLoad(state?: LoadState): Promise<void>;
  waitForSelector(selector: string, options?: WaitOptions): Promise<void>;
  waitForNavigation(options?: WaitOptions): Promise<void>;

  // Page Operations
  setViewport(viewport: Viewport): Promise<void>;
  emulateDevice(device: string): Promise<void>;
  setExtraHTTPHeaders(headers: Record<string, string>): Promise<void>;

  // Content Access
  getContent(): Promise<string>;
  getTitle(): Promise<string>;
  getUrl(): Promise<string>;

  // Event Handling
  onLoad(handler: () => void): void;
  onRequest(handler: (request: Request) => void): void;
  onResponse(handler: (response: Response) => void): void;
  onConsole(handler: (message: ConsoleMessage) => void): void;
}

interface NavigationOptions {
  timeout?: number;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  referer?: string;
}

interface NavigationResult {
  url: string;
  status: number;
  redirected: boolean;
  finalUrl: string;
  timing: NavigationTiming;
}

interface NavigationTiming {
  startTime: number;
  domContentLoaded: number;
  loadComplete: number;
  duration: number;
}
```

### 2.3 Implementation Design

```typescript
class PageControllerImpl implements PageController {
  private page: Page;
  private navigationHistory: NavigationEntry[] = [];
  private eventBus: EventEmitter;

  constructor(page: Page, eventBus: EventEmitter) {
    this.page = page;
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  async navigate(
    url: string,
    options: NavigationOptions = {}
  ): Promise<NavigationResult> {
    const startTime = Date.now();

    try {
      const response = await this.page.goto(url, {
        timeout: options.timeout || 30000,
        waitUntil: options.waitUntil || 'load',
        referer: options.referer,
      });

      const timing = await this.captureNavigationTiming(startTime);

      const result: NavigationResult = {
        url: url,
        status: response?.status() || 0,
        redirected: url !== this.page.url(),
        finalUrl: this.page.url(),
        timing,
      };

      this.navigationHistory.push({
        url,
        timestamp: Date.now(),
        result,
      });

      this.eventBus.emit('navigation:complete', result);
      return result;

    } catch (error) {
      this.eventBus.emit('navigation:error', { url, error });
      throw new NavigationError(`Failed to navigate to ${url}`, error);
    }
  }

  private setupEventListeners(): void {
    this.page.on('load', () => {
      this.eventBus.emit('page:load', { url: this.page.url() });
    });

    this.page.on('request', (request) => {
      this.eventBus.emit('page:request', {
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
      });
    });

    this.page.on('response', (response) => {
      this.eventBus.emit('page:response', {
        url: response.url(),
        status: response.status(),
      });
    });

    this.page.on('console', (message) => {
      this.eventBus.emit('page:console', {
        type: message.type(),
        text: message.text(),
      });
    });
  }
}
```

### 2.4 Key Design Decisions

- **Event-Driven**: Emit events for all page lifecycle changes
- **History Tracking**: Maintain navigation history for debugging
- **Error Handling**: Wrap all errors with context
- **Timing Metrics**: Capture detailed performance data

---

## 3. ElementLocator

### 3.1 Responsibility

Provides intelligent element finding with multiple fallback strategies, retry logic, and smart waiting.

### 3.2 Interface

```typescript
interface ElementLocator {
  // Primary Locators
  findElement(selector: string, options?: LocatorOptions): Promise<ElementHandle>;
  findElements(selector: string, options?: LocatorOptions): Promise<ElementHandle[]>;
  findByText(text: string, options?: TextOptions): Promise<ElementHandle>;
  findByRole(role: string, options?: RoleOptions): Promise<ElementHandle>;

  // Smart Locators
  findByLabel(label: string): Promise<ElementHandle>;
  findByPlaceholder(placeholder: string): Promise<ElementHandle>;
  findByTestId(testId: string): Promise<ElementHandle>;

  // Advanced Queries
  findWithRetry(selector: string, options?: RetryOptions): Promise<ElementHandle>;
  findVisible(selector: string): Promise<ElementHandle>;
  findInteractive(selector: string): Promise<ElementHandle>;

  // Validation
  exists(selector: string): Promise<boolean>;
  isVisible(selector: string): Promise<boolean>;
  isEnabled(selector: string): Promise<boolean>;

  // Strategy Management
  registerStrategy(name: string, strategy: LocatorStrategy): void;
  setDefaultStrategy(strategy: LocatorStrategyType): void;
}

interface LocatorOptions {
  timeout?: number;
  visible?: boolean;
  enabled?: boolean;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
  strict?: boolean;
}

interface LocatorStrategy {
  name: string;
  priority: number;
  locate(page: Page, selector: string): Promise<ElementHandle | null>;
  canHandle(selector: string): boolean;
}

type LocatorStrategyType =
  | 'css'
  | 'xpath'
  | 'text'
  | 'role'
  | 'testId'
  | 'smart';
```

### 3.3 Implementation Design

```typescript
class ElementLocatorImpl implements ElementLocator {
  private page: Page;
  private strategies: Map<string, LocatorStrategy> = new Map();
  private defaultStrategy: LocatorStrategyType = 'smart';

  constructor(page: Page) {
    this.page = page;
    this.registerBuiltInStrategies();
  }

  private registerBuiltInStrategies(): void {
    // CSS Selector Strategy
    this.registerStrategy('css', {
      name: 'css',
      priority: 1,
      canHandle: (selector) => !selector.startsWith('//') && !selector.includes('text='),
      locate: async (page, selector) => {
        return page.$(selector);
      },
    });

    // XPath Strategy
    this.registerStrategy('xpath', {
      name: 'xpath',
      priority: 2,
      canHandle: (selector) => selector.startsWith('//') || selector.startsWith('xpath='),
      locate: async (page, selector) => {
        const xpath = selector.replace('xpath=', '');
        return page.$(`xpath=${xpath}`);
      },
    });

    // Smart Strategy (tries multiple approaches)
    this.registerStrategy('smart', {
      name: 'smart',
      priority: 10,
      canHandle: () => true,
      locate: async (page, selector) => {
        return this.smartLocate(page, selector);
      },
    });
  }

  private async smartLocate(
    page: Page,
    selector: string
  ): Promise<ElementHandle | null> {
    const strategies = [
      // Try as CSS first
      () => page.$(selector),

      // Try as test ID
      () => page.$(`[data-testid="${selector}"]`),

      // Try as text content
      () => page.locator(`text=${selector}`).elementHandle(),

      // Try as accessible role
      () => page.getByRole(selector as any).elementHandle(),

      // Try as label
      () => page.getByLabel(selector).elementHandle(),

      // Try as placeholder
      () => page.getByPlaceholder(selector).elementHandle(),
    ];

    for (const strategy of strategies) {
      try {
        const element = await strategy();
        if (element) return element;
      } catch {
        // Try next strategy
      }
    }

    return null;
  }

  async findWithRetry(
    selector: string,
    options: RetryOptions = {}
  ): Promise<ElementHandle> {
    const maxRetries = options.maxRetries || 3;
    const delay = options.delay || 1000;
    const backoff = options.backoff || 1.5;

    let lastError: Error;
    let currentDelay = delay;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const element = await this.findElement(selector, {
          timeout: options.timeout || 5000,
        });
        return element;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay *= backoff;
        }
      }
    }

    throw new ElementNotFoundError(
      `Failed to find element "${selector}" after ${maxRetries} attempts`,
      { selector, lastError }
    );
  }
}
```

### 3.4 Key Design Decisions

- **Strategy Pattern**: Pluggable locator strategies
- **Smart Fallback**: Try multiple approaches automatically
- **Retry Logic**: Exponential backoff for flaky elements
- **Playwright Modern Locators**: Prefer role/label over CSS

---

## 4. ActionExecutor

### 4.1 Responsibility

Executes user interactions (click, type, scroll) with proper waiting, validation, and error handling.

### 4.2 Interface

```typescript
interface ActionExecutor {
  // Basic Actions
  click(selector: string, options?: ClickOptions): Promise<void>;
  doubleClick(selector: string, options?: ClickOptions): Promise<void>;
  rightClick(selector: string, options?: ClickOptions): Promise<void>;

  // Input Actions
  type(selector: string, text: string, options?: TypeOptions): Promise<void>;
  fill(selector: string, text: string): Promise<void>;
  clear(selector: string): Promise<void>;

  // Selection Actions
  select(selector: string, value: string | string[]): Promise<void>;
  check(selector: string): Promise<void>;
  uncheck(selector: string): Promise<void>;

  // Navigation Actions
  scroll(options: ScrollOptions): Promise<void>;
  scrollIntoView(selector: string): Promise<void>;
  hover(selector: string): Promise<void>;

  // Advanced Actions
  dragAndDrop(source: string, target: string): Promise<void>;
  uploadFile(selector: string, files: string[]): Promise<void>;
  press(key: string, options?: PressOptions): Promise<void>;

  // Action Chains
  chain(): ActionChain;
}

interface ClickOptions {
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
  position?: { x: number; y: number };
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
  force?: boolean;
  timeout?: number;
}

interface TypeOptions {
  delay?: number; // Delay between keystrokes (human-like)
  clear?: boolean; // Clear existing text first
  timeout?: number;
}

interface ActionChain {
  click(selector: string, options?: ClickOptions): ActionChain;
  type(selector: string, text: string, options?: TypeOptions): ActionChain;
  wait(ms: number): ActionChain;
  waitForSelector(selector: string): ActionChain;
  execute(): Promise<void>;
}
```

### 3.3 Implementation Design

```typescript
class ActionExecutorImpl implements ActionExecutor {
  private page: Page;
  private locator: ElementLocator;
  private eventBus: EventEmitter;

  constructor(page: Page, locator: ElementLocator, eventBus: EventEmitter) {
    this.page = page;
    this.locator = locator;
    this.eventBus = eventBus;
  }

  async click(selector: string, options: ClickOptions = {}): Promise<void> {
    this.eventBus.emit('action:start', { type: 'click', selector });

    try {
      // Wait for element to be available and clickable
      const element = await this.locator.findInteractive(selector);

      // Scroll into view if needed
      await element.scrollIntoViewIfNeeded();

      // Perform click
      await element.click({
        button: options.button || 'left',
        clickCount: options.clickCount || 1,
        delay: options.delay || 0,
        position: options.position,
        modifiers: options.modifiers,
        force: options.force || false,
        timeout: options.timeout || 30000,
      });

      this.eventBus.emit('action:complete', {
        type: 'click',
        selector,
        success: true,
      });

    } catch (error) {
      this.eventBus.emit('action:error', {
        type: 'click',
        selector,
        error,
      });
      throw new ActionError(`Failed to click "${selector}"`, error);
    }
  }

  async type(
    selector: string,
    text: string,
    options: TypeOptions = {}
  ): Promise<void> {
    this.eventBus.emit('action:start', { type: 'type', selector, text });

    try {
      const element = await this.locator.findInteractive(selector);

      // Clear existing text if requested
      if (options.clear) {
        await element.clear();
      }

      // Type with optional delay for human-like behavior
      await element.type(text, {
        delay: options.delay || 0,
        timeout: options.timeout || 30000,
      });

      this.eventBus.emit('action:complete', {
        type: 'type',
        selector,
        success: true,
      });

    } catch (error) {
      this.eventBus.emit('action:error', {
        type: 'type',
        selector,
        error,
      });
      throw new ActionError(`Failed to type in "${selector}"`, error);
    }
  }

  chain(): ActionChain {
    return new ActionChainImpl(this.page, this.locator, this);
  }
}

class ActionChainImpl implements ActionChain {
  private actions: (() => Promise<void>)[] = [];

  constructor(
    private page: Page,
    private locator: ElementLocator,
    private executor: ActionExecutor
  ) {}

  click(selector: string, options?: ClickOptions): ActionChain {
    this.actions.push(() => this.executor.click(selector, options));
    return this;
  }

  type(selector: string, text: string, options?: TypeOptions): ActionChain {
    this.actions.push(() => this.executor.type(selector, text, options));
    return this;
  }

  wait(ms: number): ActionChain {
    this.actions.push(() => new Promise(resolve => setTimeout(resolve, ms)));
    return this;
  }

  async execute(): Promise<void> {
    for (const action of this.actions) {
      await action();
    }
  }
}
```

### 4.4 Key Design Decisions

- **Pre-Action Validation**: Check element is interactive before acting
- **Auto-Scrolling**: Scroll element into view automatically
- **Human-Like Behavior**: Optional delays for typing
- **Action Chains**: Fluent API for multiple actions
- **Event Emission**: Emit events for all actions for observability

---

## 5. DataExtractor

### 5.1 Responsibility

Extract data from pages including text, attributes, screenshots, and structured content.

### 5.2 Interface

```typescript
interface DataExtractor {
  // Text Extraction
  getText(selector: string): Promise<string>;
  getAllText(selector: string): Promise<string[]>;
  getInnerText(selector: string): Promise<string>;
  getTextContent(selector: string): Promise<string>;

  // Attribute Extraction
  getAttribute(selector: string, attribute: string): Promise<string | null>;
  getAttributes(selector: string): Promise<Record<string, string>>;

  // Property Extraction
  getProperty(selector: string, property: string): Promise<any>;
  getValue(selector: string): Promise<string>;

  // Visual Extraction
  screenshot(options?: ScreenshotOptions): Promise<Buffer>;
  screenshotElement(selector: string, options?: ScreenshotOptions): Promise<Buffer>;

  // Structured Extraction
  extractTable(selector: string): Promise<TableData>;
  extractList(selector: string): Promise<string[]>;
  extractLinks(selector?: string): Promise<LinkData[]>;

  // Custom Extraction
  evaluate<T>(fn: (element: Element) => T, selector?: string): Promise<T>;
  evaluateAll<T>(fn: (elements: Element[]) => T, selector: string): Promise<T>;

  // Content Analysis
  getPageMetadata(): Promise<PageMetadata>;
  getFormData(formSelector: string): Promise<FormData>;
}

interface ScreenshotOptions {
  path?: string;
  type?: 'png' | 'jpeg';
  quality?: number; // 0-100 for jpeg
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
}

interface TableData {
  headers: string[];
  rows: string[][];
  metadata: {
    rowCount: number;
    columnCount: number;
  };
}

interface LinkData {
  text: string;
  href: string;
  title?: string;
}

interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  language?: string;
}
```

### 5.3 Implementation Design

```typescript
class DataExtractorImpl implements DataExtractor {
  private page: Page;
  private locator: ElementLocator;

  constructor(page: Page, locator: ElementLocator) {
    this.page = page;
    this.locator = locator;
  }

  async getText(selector: string): Promise<string> {
    const element = await this.locator.findElement(selector);
    const text = await element.textContent();
    return text?.trim() || '';
  }

  async screenshot(options: ScreenshotOptions = {}): Promise<Buffer> {
    return this.page.screenshot({
      type: options.type || 'png',
      quality: options.quality,
      fullPage: options.fullPage || false,
      clip: options.clip,
      omitBackground: options.omitBackground || false,
    });
  }

  async screenshotElement(
    selector: string,
    options: ScreenshotOptions = {}
  ): Promise<Buffer> {
    const element = await this.locator.findElement(selector);
    return element.screenshot({
      type: options.type || 'png',
      quality: options.quality,
      omitBackground: options.omitBackground || false,
    });
  }

  async extractTable(selector: string): Promise<TableData> {
    return this.page.evaluate((sel) => {
      const table = document.querySelector(sel) as HTMLTableElement;
      if (!table) throw new Error(`Table not found: ${sel}`);

      const headers = Array.from(
        table.querySelectorAll('thead th, thead td')
      ).map(th => th.textContent?.trim() || '');

      const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr =>
        Array.from(tr.querySelectorAll('td, th')).map(
          td => td.textContent?.trim() || ''
        )
      );

      return {
        headers,
        rows,
        metadata: {
          rowCount: rows.length,
          columnCount: headers.length || rows[0]?.length || 0,
        },
      };
    }, selector);
  }

  async extractLinks(selector?: string): Promise<LinkData[]> {
    return this.page.evaluate((sel) => {
      const links = sel
        ? document.querySelectorAll(`${sel} a`)
        : document.querySelectorAll('a');

      return Array.from(links).map(link => ({
        text: link.textContent?.trim() || '',
        href: link.getAttribute('href') || '',
        title: link.getAttribute('title') || undefined,
      }));
    }, selector);
  }

  async getPageMetadata(): Promise<PageMetadata> {
    return this.page.evaluate(() => {
      const getMeta = (name: string) => {
        const element = document.querySelector(
          `meta[name="${name}"], meta[property="${name}"]`
        );
        return element?.getAttribute('content') || undefined;
      };

      return {
        title: document.title,
        description: getMeta('description') || getMeta('og:description'),
        keywords: getMeta('keywords')?.split(',').map(k => k.trim()),
        ogImage: getMeta('og:image'),
        canonicalUrl: document.querySelector('link[rel="canonical"]')
          ?.getAttribute('href') || undefined,
        language: document.documentElement.lang || undefined,
      };
    });
  }
}
```

### 5.4 Key Design Decisions

- **Buffer Return**: Screenshots as Buffer for flexibility
- **Structured Data**: Parse tables/lists into usable formats
- **Metadata Extraction**: Common SEO/meta tag parsing
- **Evaluate API**: Direct access to browser context for custom extraction

---

## 6. SessionManager

### 6.1 Responsibility

Manage browser contexts, session isolation, state persistence, and cleanup.

### 6.2 Interface

```typescript
interface SessionManager {
  // Session Lifecycle
  createSession(options?: SessionOptions): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  closeSession(sessionId: string): Promise<void>;
  listSessions(): Promise<SessionInfo[]>;

  // Context Management
  createContext(sessionId: string, options?: ContextOptions): Promise<BrowserContext>;
  getContext(sessionId: string): Promise<BrowserContext>;

  // State Management
  saveState(sessionId: string): Promise<SessionState>;
  restoreState(sessionId: string, state: SessionState): Promise<void>;

  // Cookies & Storage
  getCookies(sessionId: string): Promise<Cookie[]>;
  setCookies(sessionId: string, cookies: Cookie[]): Promise<void>;
  getStorageState(sessionId: string): Promise<StorageState>;

  // Cleanup
  cleanupIdleSessions(maxIdleTime: number): Promise<number>;
  closeAllSessions(): Promise<void>;
}

interface Session {
  id: string;
  context: BrowserContext;
  createdAt: number;
  lastActivity: number;
  metadata: Record<string, any>;
}

interface SessionOptions {
  userAgent?: string;
  viewport?: { width: number; height: number };
  geolocation?: { latitude: number; longitude: number };
  permissions?: string[];
  storageState?: StorageState;
  persistent?: boolean;
}

interface SessionState {
  cookies: Cookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  url: string;
}
```

### 6.3 Implementation Design

```typescript
class SessionManagerImpl implements SessionManager {
  private sessions: Map<string, Session> = new Map();
  private browserManager: BrowserManager;
  private cleanupInterval: NodeJS.Timeout;

  constructor(browserManager: BrowserManager) {
    this.browserManager = browserManager;
    this.startCleanupTask();
  }

  async createSession(options: SessionOptions = {}): Promise<Session> {
    const browser = await this.browserManager.getBrowser();

    const context = await browser.newContext({
      userAgent: options.userAgent,
      viewport: options.viewport,
      geolocation: options.geolocation,
      permissions: options.permissions,
      storageState: options.storageState,
    });

    const session: Session = {
      id: generateSessionId(),
      context,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      metadata: {
        persistent: options.persistent || false,
      },
    };

    this.sessions.set(session.id, session);

    // Track activity
    context.on('page', () => {
      session.lastActivity = Date.now();
    });

    return session;
  }

  async saveState(sessionId: string): Promise<SessionState> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const pages = session.context.pages();
    const currentUrl = pages[0]?.url() || '';

    const cookies = await session.context.cookies();

    // Extract storage from page
    const localStorage = await pages[0]?.evaluate(() =>
      JSON.parse(JSON.stringify(window.localStorage))
    ) || {};

    const sessionStorage = await pages[0]?.evaluate(() =>
      JSON.parse(JSON.stringify(window.sessionStorage))
    ) || {};

    return {
      cookies,
      localStorage,
      sessionStorage,
      url: currentUrl,
    };
  }

  async restoreState(
    sessionId: string,
    state: SessionState
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    // Restore cookies
    await session.context.addCookies(state.cookies);

    // Navigate to saved URL
    const page = await session.context.newPage();
    await page.goto(state.url);

    // Restore storage
    await page.evaluate((storage) => {
      for (const [key, value] of Object.entries(storage.local)) {
        localStorage.setItem(key, value);
      }
      for (const [key, value] of Object.entries(storage.session)) {
        sessionStorage.setItem(key, value);
      }
    }, {
      local: state.localStorage,
      session: state.sessionStorage,
    });
  }

  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(async () => {
      // Clean up sessions idle for > 30 minutes
      await this.cleanupIdleSessions(30 * 60 * 1000);
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  async cleanupIdleSessions(maxIdleTime: number): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const idleTime = now - session.lastActivity;

      if (idleTime > maxIdleTime && !session.metadata.persistent) {
        await this.closeSession(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }
}
```

### 6.4 Key Design Decisions

- **Context Isolation**: Each session gets its own browser context
- **State Persistence**: Full state save/restore including cookies and storage
- **Automatic Cleanup**: Remove idle sessions to free resources
- **Activity Tracking**: Update last activity on page creation

---

## 7. NetworkInterceptor

### 7.1 Responsibility

Intercept, modify, and monitor network requests and responses.

### 7.2 Interface

```typescript
interface NetworkInterceptor {
  // Request Interception
  onRequest(handler: RequestHandler): void;
  abortRequest(urlPattern: string | RegExp): void;
  blockResourceType(resourceType: ResourceType): void;

  // Response Interception
  onResponse(handler: ResponseHandler): void;
  mockResponse(urlPattern: string | RegExp, response: MockResponse): void;

  // Monitoring
  getRequestLog(): RequestLog[];
  getResponseLog(): ResponseLog[];
  clearLogs(): void;

  // Network Conditions
  setOffline(offline: boolean): Promise<void>;
  setThrottling(profile: ThrottlingProfile): Promise<void>;

  // Request Manipulation
  setExtraHeaders(headers: Record<string, string>): Promise<void>;
  setUserAgent(userAgent: string): Promise<void>;
}

type RequestHandler = (request: InterceptedRequest) => Promise<void> | void;
type ResponseHandler = (response: InterceptedResponse) => Promise<void> | void;

interface InterceptedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  resourceType: ResourceType;

  continue(overrides?: RequestOverrides): Promise<void>;
  abort(errorCode?: string): Promise<void>;
  respond(response: MockResponse): Promise<void>;
}

interface MockResponse {
  status: number;
  headers?: Record<string, string>;
  body: string | Buffer;
  contentType?: string;
}

type ResourceType =
  | 'document'
  | 'stylesheet'
  | 'image'
  | 'media'
  | 'font'
  | 'script'
  | 'texttrack'
  | 'xhr'
  | 'fetch'
  | 'eventsource'
  | 'websocket'
  | 'manifest'
  | 'other';
```

### 7.3 Implementation Design

```typescript
class NetworkInterceptorImpl implements NetworkInterceptor {
  private page: Page;
  private requestLog: RequestLog[] = [];
  private responseLog: ResponseLog[] = [];
  private handlers: {
    request: RequestHandler[];
    response: ResponseHandler[];
  } = { request: [], response: [] };

  constructor(page: Page) {
    this.page = page;
    this.setupInterception();
  }

  private async setupInterception(): Promise<void> {
    await this.page.route('**/*', async (route) => {
      const request = route.request();

      // Log request
      this.requestLog.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now(),
      });

      // Create intercepted request wrapper
      const intercepted: InterceptedRequest = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData() || undefined,
        resourceType: request.resourceType() as ResourceType,

        continue: async (overrides) => {
          await route.continue(overrides);
        },
        abort: async (errorCode) => {
          await route.abort(errorCode || 'failed');
        },
        respond: async (response) => {
          await route.fulfill({
            status: response.status,
            headers: response.headers,
            body: response.body,
          });
        },
      };

      // Execute handlers
      let handled = false;
      for (const handler of this.handlers.request) {
        try {
          await handler(intercepted);
          if (handled) break;
        } catch (error) {
          logger.error('Request handler error:', error);
        }
      }

      // Continue if not handled
      if (!handled) {
        await route.continue();
      }
    });

    // Response logging
    this.page.on('response', async (response) => {
      this.responseLog.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        timing: response.timing(),
        timestamp: Date.now(),
      });

      // Execute response handlers
      for (const handler of this.handlers.response) {
        try {
          await handler({
            url: response.url(),
            status: response.status(),
            headers: response.headers(),
            body: async () => response.body(),
          });
        } catch (error) {
          logger.error('Response handler error:', error);
        }
      }
    });
  }

  onRequest(handler: RequestHandler): void {
    this.handlers.request.push(handler);
  }

  blockResourceType(resourceType: ResourceType): void {
    this.onRequest((request) => {
      if (request.resourceType === resourceType) {
        request.abort('blockedbyclient');
      } else {
        request.continue();
      }
    });
  }

  mockResponse(
    urlPattern: string | RegExp,
    response: MockResponse
  ): void {
    this.onRequest((request) => {
      const matches = typeof urlPattern === 'string'
        ? request.url.includes(urlPattern)
        : urlPattern.test(request.url);

      if (matches) {
        request.respond(response);
      } else {
        request.continue();
      }
    });
  }

  async setThrottling(profile: ThrottlingProfile): Promise<void> {
    const cdpSession = await this.page.context().newCDPSession(this.page);
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: profile.downloadThroughput,
      uploadThroughput: profile.uploadThroughput,
      latency: profile.latency,
    });
  }
}
```

### 7.4 Key Design Decisions

- **Route-Based Interception**: Use Playwright's route API
- **Handler Chain**: Support multiple handlers per request
- **Logging**: Automatic logging of all requests/responses
- **CDP Access**: Use Chrome DevTools Protocol for advanced features

---

**Next**: [03-mcp-server-design.md](./03-mcp-server-design.md)
