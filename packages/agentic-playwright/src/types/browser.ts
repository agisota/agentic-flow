/**
 * Browser type definitions for agentic-playwright
 * Based on SPARC specification and Playwright API
 */

import type { Browser, BrowserContext, Page, LaunchOptions } from 'playwright';

/**
 * Supported browser types
 */
export type BrowserType = 'chromium' | 'firefox' | 'webkit';

/**
 * Browser pool configuration
 */
export interface PoolConfig {
  /** Minimum number of browser instances to maintain */
  minInstances: number;
  /** Maximum number of browser instances allowed */
  maxInstances: number;
  /** Idle timeout in milliseconds before closing unused browser */
  idleTimeout: number;
  /** Whether to pre-warm browser instances on startup */
  warmupOnStart: boolean;
  /** Maximum number of contexts per browser instance */
  maxContextsPerInstance?: number;
  /** Recycle browser after N operations (0 = never) */
  recycleAfter?: number;
}

/**
 * Browser launch options
 */
export interface BrowserOptions extends Partial<LaunchOptions> {
  /** Browser type to launch */
  type?: BrowserType;
  /** Run in headless mode */
  headless?: boolean;
  /** Browser launch timeout in milliseconds */
  timeout?: number;
  /** Slow down operations by specified milliseconds */
  slowMo?: number;
  /** Additional browser arguments */
  args?: string[];
  /** Path to browser executable */
  executablePath?: string;
  /** Path for downloads */
  downloadsPath?: string;
  /** Proxy configuration */
  proxy?: ProxySettings;
  /** Whether to ignore HTTPS errors */
  ignoreHTTPSErrors?: boolean;
  /** Whether to bypass CSP */
  bypassCSP?: boolean;
}

/**
 * Proxy settings
 */
export interface ProxySettings {
  /** Proxy server URL (e.g., "http://proxy.example.com:8080") */
  server: string;
  /** Comma-separated domains to bypass proxy */
  bypass?: string;
  /** Proxy authentication username */
  username?: string;
  /** Proxy authentication password */
  password?: string;
}

/**
 * Health check configuration
 */
export interface HealthConfig {
  /** Health check interval in milliseconds */
  checkInterval: number;
  /** Maximum consecutive failures before marking unhealthy */
  maxFailures: number;
  /** Recovery strategy when browser becomes unhealthy */
  recoveryStrategy: 'restart' | 'replace' | 'ignore';
  /** Health check timeout in milliseconds */
  timeout?: number;
}

/**
 * Browser instance metadata
 */
export interface BrowserInstance {
  /** Unique browser instance ID */
  id: string;
  /** Browser type */
  type: BrowserType;
  /** Playwright Browser object */
  browser: Browser;
  /** Active browser contexts */
  contexts: BrowserContext[];
  /** Health status */
  health: HealthStatus;
  /** Performance metrics */
  metrics: BrowserMetrics;
  /** Creation timestamp */
  createdAt: Date;
  /** Last used timestamp */
  lastUsedAt: Date;
  /** Process ID */
  pid: number | null;
  /** Whether browser is marked for removal */
  markedForRemoval?: boolean;
}

/**
 * Browser health status
 */
export interface HealthStatus {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Last health check timestamp */
  lastCheck: Date;
  /** Consecutive failure count */
  consecutiveFailures: number;
  /** Detailed health checks */
  checks: {
    /** Whether browser is responsive */
    responsive: boolean;
    /** Memory usage in bytes */
    memoryUsage: number;
    /** Number of active contexts */
    contextCount: number;
    /** Whether process is running */
    processRunning: boolean;
  };
}

/**
 * Browser performance metrics
 */
export interface BrowserMetrics {
  /** Total number of contexts created */
  totalContexts: number;
  /** Total number of pages created */
  totalPages: number;
  /** Total number of network requests */
  totalRequests: number;
  /** Total number of navigations */
  totalNavigations: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** CPU usage percentage (0-100) */
  cpuUsage: number;
  /** Operations performed */
  operationCount: number;
}

/**
 * Browser pool status
 */
export interface BrowserStatus {
  /** Total browsers in pool */
  totalBrowsers: number;
  /** Available (idle) browsers */
  availableBrowsers: number;
  /** Active (in-use) browsers */
  activeBrowsers: number;
  /** Unhealthy browsers */
  unhealthyBrowsers: number;
  /** Pool capacity utilization (0-1) */
  utilization: number;
  /** Individual browser instances */
  instances: Array<{
    id: string;
    type: BrowserType;
    status: 'available' | 'active' | 'unhealthy';
    health: HealthStatus;
    metrics: BrowserMetrics;
  }>;
}

/**
 * Page acquisition options
 */
export interface PageOptions {
  /** Browser context options */
  contextOptions?: BrowserContextOptions;
  /** Whether to wait if pool is full */
  wait?: boolean;
  /** Wait timeout in milliseconds */
  waitTimeout?: number;
  /** Preferred browser type */
  browserType?: BrowserType;
}

/**
 * Browser context options
 */
export interface BrowserContextOptions {
  /** Viewport configuration */
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
    hasTouch?: boolean;
  };
  /** User agent string */
  userAgent?: string;
  /** Locale */
  locale?: string;
  /** Timezone ID */
  timezoneId?: string;
  /** Geolocation */
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  /** Permissions to grant */
  permissions?: string[];
  /** Color scheme preference */
  colorScheme?: 'light' | 'dark' | 'no-preference';
  /** Extra HTTP headers */
  extraHTTPHeaders?: Record<string, string>;
  /** Whether to accept downloads */
  acceptDownloads?: boolean;
  /** Whether to ignore HTTPS errors */
  ignoreHTTPSErrors?: boolean;
  /** Storage state to initialize with */
  storageState?: string | {
    cookies: Array<{
      name: string;
      value: string;
      domain: string;
      path: string;
      expires: number;
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'Strict' | 'Lax' | 'None';
    }>;
    origins: Array<{
      origin: string;
      localStorage: Array<{ name: string; value: string }>;
    }>;
  };
  /** Default navigation timeout */
  navigationTimeout?: number;
  /** Default action timeout */
  actionTimeout?: number;
}

/**
 * Browser manager configuration
 */
export interface BrowserManagerConfig {
  /** Pool configuration */
  pool: PoolConfig;
  /** Health monitoring configuration */
  health: HealthConfig;
  /** Default browser options */
  browserOptions: BrowserOptions;
  /** Memory monitoring configuration */
  memory?: {
    /** Warning threshold in MB */
    warningThreshold: number;
    /** Critical threshold in MB */
    criticalThreshold: number;
    /** Whether to enable automatic garbage collection */
    autoGC: boolean;
  };
}

/**
 * Shutdown report
 */
export interface ShutdownReport {
  /** Shutdown start time */
  startTime: Date;
  /** Shutdown end time */
  endTime?: Date;
  /** Total duration in milliseconds */
  duration?: number;
  /** Number of browsers at start */
  browsersAtStart: number;
  /** Number of browsers successfully closed */
  browsersClosed: number;
  /** Number of contexts at start */
  contextsAtStart: number;
  /** Number of contexts closed */
  contextsClosed: number;
  /** Number of pages at start */
  pagesAtStart: number;
  /** Number of pages closed */
  pagesClosed: number;
  /** Number of force-closed browsers */
  forceClosed: number;
  /** Errors encountered during shutdown */
  errors: Array<{
    type: 'BROWSER_CLOSE' | 'CONTEXT_CLOSE' | 'PAGE_CLOSE';
    browserId?: string;
    message: string;
  }>;
  /** Whether shutdown was successful */
  success: boolean;
}

/**
 * Memory report
 */
export interface MemoryReport {
  /** Total memory usage across all browsers in MB */
  totalMemory: number;
  /** Individual browser memory usage */
  browserMemory: Array<{
    id: string;
    pid: number;
    memoryMB: number;
    contextCount: number;
    pageCount: number;
  }>;
  /** Memory warnings */
  warnings: Array<{
    level: 'WARNING' | 'HIGH' | 'CRITICAL';
    browserId: string;
    message: string;
  }>;
  /** Recommended actions */
  actions: Array<{
    action: 'RESTART_BROWSER' | 'TRIGGER_GC' | 'CLOSE_CONTEXTS';
    browserId: string;
  }>;
}
