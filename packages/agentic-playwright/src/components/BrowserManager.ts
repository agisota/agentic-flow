/**
 * BrowserManager - Singleton browser pool manager for Playwright
 *
 * Features:
 * - Browser pool with configurable min/max instances
 * - Automatic health monitoring and recovery
 * - Memory monitoring and cleanup
 * - Context isolation
 * - Support for Chromium, Firefox, and WebKit
 * - Graceful shutdown
 *
 * Based on SPARC specification from plans/playwright/
 */

import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from 'playwright';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import type {
  BrowserType,
  BrowserOptions,
  BrowserInstance,
  BrowserManagerConfig,
  PoolConfig,
  HealthConfig,
  HealthStatus,
  BrowserMetrics,
  BrowserStatus,
  PageOptions,
  BrowserContextOptions,
  ShutdownReport,
  MemoryReport,
} from '../types/browser.js';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: BrowserManagerConfig = {
  pool: {
    minInstances: 1,
    maxInstances: 5,
    idleTimeout: 300000, // 5 minutes
    warmupOnStart: true,
    maxContextsPerInstance: 10,
    recycleAfter: 0, // Never recycle by default
  },
  health: {
    checkInterval: 30000, // 30 seconds
    maxFailures: 3,
    recoveryStrategy: 'restart',
    timeout: 5000,
  },
  browserOptions: {
    type: 'chromium',
    headless: true,
    timeout: 30000,
    args: [
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-sandbox',
    ],
  },
  memory: {
    warningThreshold: 512,
    criticalThreshold: 1024,
    autoGC: true,
  },
};

/**
 * BrowserManager singleton class
 * Manages a pool of browser instances with health monitoring and automatic recovery
 */
export class BrowserManager extends EventEmitter {
  private static instance: BrowserManager | null = null;
  private config: BrowserManagerConfig;
  private availableBrowsers: Map<string, BrowserInstance> = new Map();
  private activeBrowsers: Map<string, BrowserInstance> = new Map();
  private healthMonitorTimer: NodeJS.Timeout | null = null;
  private isShuttingDown: boolean = false;
  private initialized: boolean = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor(config?: Partial<BrowserManagerConfig>) {
    super();
    this.config = this.mergeConfig(config);
  }

  /**
   * Get or create BrowserManager instance
   */
  public static getInstance(config?: Partial<BrowserManagerConfig>): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager(config);
    }
    return BrowserManager.instance;
  }

  /**
   * Reset singleton instance (mainly for testing)
   */
  public static resetInstance(): void {
    BrowserManager.instance = null;
  }

  /**
   * Initialize the browser manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Start health monitoring
      this.startHealthMonitoring();

      // Warm up the pool if configured
      if (this.config.pool.warmupOnStart) {
        await this.warmPool(this.config.pool.minInstances);
      }

      this.initialized = true;
      this.emit('initialized', { timestamp: new Date() });
    } catch (error) {
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }

  /**
   * Launch a browser instance
   */
  public async launch(options?: Partial<BrowserOptions>): Promise<Browser> {
    const mergedOptions = { ...this.config.browserOptions, ...options };
    const browserType = mergedOptions.type || 'chromium';

    try {
      const playwright = this.getPlaywrightBrowser(browserType);
      const browser = await playwright.launch({
        headless: mergedOptions.headless,
        timeout: mergedOptions.timeout,
        slowMo: mergedOptions.slowMo,
        args: mergedOptions.args,
        executablePath: mergedOptions.executablePath,
        downloadsPath: mergedOptions.downloadsPath,
        proxy: mergedOptions.proxy,
      });

      this.emit('browser-launched', {
        browserId: randomUUID(),
        type: browserType,
        timestamp: new Date(),
      });

      return browser;
    } catch (error) {
      this.emit('error', { type: 'launch', browserType, error });
      throw new Error(`Failed to launch ${browserType} browser: ${(error as Error).message}`);
    }
  }

  /**
   * Acquire a browser from the pool
   */
  public async acquireBrowser(
    type?: BrowserType,
    options?: { wait?: boolean; waitTimeout?: number }
  ): Promise<BrowserInstance> {
    if (this.isShuttingDown) {
      throw new Error('BrowserManager is shutting down');
    }

    const browserType = type || this.config.browserOptions.type || 'chromium';

    // Check for available browser of the requested type
    for (const [id, instance] of this.availableBrowsers.entries()) {
      if (instance.type === browserType && instance.health.status === 'healthy') {
        // Verify health before reusing
        const isHealthy = await this.verifyBrowserHealth(instance.browser);
        if (isHealthy) {
          this.availableBrowsers.delete(id);
          instance.lastUsedAt = new Date();
          this.activeBrowsers.set(id, instance);
          return instance;
        } else {
          // Remove unhealthy browser
          await this.removeBrowser(id);
        }
      }
    }

    // Check if pool is at capacity
    const totalBrowsers = this.availableBrowsers.size + this.activeBrowsers.size;
    if (totalBrowsers >= this.config.pool.maxInstances) {
      // Try to evict least recently used available browser
      if (this.availableBrowsers.size > 0) {
        const oldestId = this.findLRUBrowser(this.availableBrowsers);
        if (oldestId) {
          await this.removeBrowser(oldestId);
        }
      } else if (options?.wait) {
        // Wait for a browser to become available
        return this.waitForAvailableBrowser(browserType, options.waitTimeout);
      } else {
        throw new Error('Browser pool exhausted');
      }
    }

    // Create new browser instance
    const instance = await this.createBrowserInstance(browserType);
    this.activeBrowsers.set(instance.id, instance);
    return instance;
  }

  /**
   * Release a browser back to the pool
   */
  public async releaseBrowser(browserId: string): Promise<void> {
    const instance = this.activeBrowsers.get(browserId);
    if (!instance) {
      throw new Error(`Browser ${browserId} not found in active pool`);
    }

    try {
      // Close all contexts and pages
      const contexts = instance.browser.contexts();
      for (const context of contexts) {
        try {
          await context.close();
        } catch (error) {
          console.warn(`Failed to close context: ${(error as Error).message}`);
        }
      }

      // Update metadata
      instance.lastUsedAt = new Date();
      instance.contexts = [];

      // Check if browser should be recycled
      const shouldRecycle = this.shouldRecycleBrowser(instance);
      if (shouldRecycle) {
        await this.removeBrowser(browserId);
        return;
      }

      // Health check before returning to pool
      const isHealthy = await this.verifyBrowserHealth(instance.browser);
      if (isHealthy) {
        // Check TTL
        const age = Date.now() - instance.createdAt.getTime();
        if (age > this.config.pool.idleTimeout) {
          await this.removeBrowser(browserId);
          return;
        }

        // Return to available pool
        this.activeBrowsers.delete(browserId);
        this.availableBrowsers.set(browserId, instance);
      } else {
        // Remove unhealthy browser
        await this.removeBrowser(browserId);
      }
    } catch (error) {
      this.emit('error', { type: 'release', browserId, error });
      throw error;
    }
  }

  /**
   * Acquire a page with isolated context
   */
  public async acquirePage(options?: PageOptions): Promise<{ page: Page; browserId: string; contextId: string }> {
    const browserInstance = await this.acquireBrowser(
      options?.browserType,
      { wait: options?.wait, waitTimeout: options?.waitTimeout }
    );

    try {
      const context = await browserInstance.browser.newContext(
        this.buildContextOptions(options?.contextOptions)
      );
      const page = await context.newPage();

      // Track context
      browserInstance.contexts.push(context);
      browserInstance.metrics.totalContexts++;
      browserInstance.metrics.totalPages++;

      const contextId = randomUUID();

      this.emit('page-acquired', {
        browserId: browserInstance.id,
        contextId,
        timestamp: new Date(),
      });

      return {
        page,
        browserId: browserInstance.id,
        contextId,
      };
    } catch (error) {
      // Release browser if page acquisition fails
      await this.releaseBrowser(browserInstance.id);
      throw error;
    }
  }

  /**
   * Release a page and its context
   */
  public async releasePage(page: Page, browserId: string): Promise<void> {
    try {
      const context = page.context();
      await page.close();
      await context.close();

      // Update browser instance
      const instance = this.activeBrowsers.get(browserId) || this.availableBrowsers.get(browserId);
      if (instance) {
        const contextIndex = instance.contexts.indexOf(context);
        if (contextIndex > -1) {
          instance.contexts.splice(contextIndex, 1);
        }
      }

      this.emit('page-released', {
        browserId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.emit('error', { type: 'page-release', browserId, error });
      throw error;
    }
  }

  /**
   * Get pool status
   */
  public getStatus(): BrowserStatus {
    const allBrowsers = [...this.availableBrowsers.values(), ...this.activeBrowsers.values()];
    const unhealthy = allBrowsers.filter(b => b.health.status === 'unhealthy').length;

    return {
      totalBrowsers: allBrowsers.length,
      availableBrowsers: this.availableBrowsers.size,
      activeBrowsers: this.activeBrowsers.size,
      unhealthyBrowsers: unhealthy,
      utilization: allBrowsers.length / this.config.pool.maxInstances,
      instances: allBrowsers.map(instance => ({
        id: instance.id,
        type: instance.type,
        status: this.activeBrowsers.has(instance.id)
          ? 'active'
          : instance.health.status === 'unhealthy'
          ? 'unhealthy'
          : 'available',
        health: instance.health,
        metrics: instance.metrics,
      })),
    };
  }

  /**
   * Gracefully shutdown all browsers
   */
  public async shutdown(timeout: number = 30000): Promise<ShutdownReport> {
    this.isShuttingDown = true;
    const startTime = new Date();

    const report: ShutdownReport = {
      startTime,
      browsersAtStart: 0,
      browsersClosed: 0,
      contextsAtStart: 0,
      contextsClosed: 0,
      pagesAtStart: 0,
      pagesClosed: 0,
      forceClosed: 0,
      errors: [],
      success: false,
    };

    try {
      // Stop health monitoring
      if (this.healthMonitorTimer) {
        clearInterval(this.healthMonitorTimer);
        this.healthMonitorTimer = null;
      }

      // Count resources
      const allBrowsers = [...this.availableBrowsers.values(), ...this.activeBrowsers.values()];
      report.browsersAtStart = allBrowsers.length;

      for (const instance of allBrowsers) {
        const contexts = instance.browser.contexts();
        report.contextsAtStart += contexts.length;
        for (const context of contexts) {
          report.pagesAtStart += context.pages().length;
        }
      }

      // Close all browsers
      const shutdownPromises = allBrowsers.map(instance =>
        this.shutdownBrowser(instance, report)
      );

      await Promise.allSettled(shutdownPromises);

      // Clear pools
      this.availableBrowsers.clear();
      this.activeBrowsers.clear();

      report.endTime = new Date();
      report.duration = report.endTime.getTime() - startTime.getTime();
      report.success = report.errors.length === 0;

      this.emit('shutdown-complete', report);

      return report;
    } catch (error) {
      report.errors.push({
        type: 'BROWSER_CLOSE',
        message: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get memory report
   */
  public async getMemoryReport(): Promise<MemoryReport> {
    const report: MemoryReport = {
      totalMemory: 0,
      browserMemory: [],
      warnings: [],
      actions: [],
    };

    const allBrowsers = [...this.availableBrowsers.values(), ...this.activeBrowsers.values()];

    for (const instance of allBrowsers) {
      const memoryMB = instance.metrics.memoryUsage / (1024 * 1024);

      report.browserMemory.push({
        id: instance.id,
        pid: instance.pid || 0,
        memoryMB,
        contextCount: instance.contexts.length,
        pageCount: instance.contexts.reduce((sum, ctx) => sum + ctx.pages().length, 0),
      });

      report.totalMemory += memoryMB;

      // Check thresholds
      if (memoryMB >= this.config.memory!.criticalThreshold) {
        report.warnings.push({
          level: 'CRITICAL',
          browserId: instance.id,
          message: `Browser memory usage critical: ${memoryMB.toFixed(2)} MB`,
        });
        report.actions.push({
          action: 'RESTART_BROWSER',
          browserId: instance.id,
        });
      } else if (memoryMB >= this.config.memory!.warningThreshold) {
        report.warnings.push({
          level: 'WARNING',
          browserId: instance.id,
          message: `Browser memory usage elevated: ${memoryMB.toFixed(2)} MB`,
        });
        if (this.config.memory!.autoGC) {
          report.actions.push({
            action: 'TRIGGER_GC',
            browserId: instance.id,
          });
        }
      }
    }

    return report;
  }

  /**
   * Warm up the browser pool
   */
  private async warmPool(count: number): Promise<void> {
    const browserType = this.config.browserOptions.type || 'chromium';
    const promises = [];

    for (let i = 0; i < count; i++) {
      promises.push(this.createBrowserInstance(browserType));
    }

    const instances = await Promise.allSettled(promises);

    for (const result of instances) {
      if (result.status === 'fulfilled') {
        this.availableBrowsers.set(result.value.id, result.value);
      }
    }
  }

  /**
   * Create a new browser instance
   */
  private async createBrowserInstance(type: BrowserType): Promise<BrowserInstance> {
    const browser = await this.launch({ type });

    const instance: BrowserInstance = {
      id: randomUUID(),
      type,
      browser,
      contexts: [],
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        consecutiveFailures: 0,
        checks: {
          responsive: true,
          memoryUsage: 0,
          contextCount: 0,
          processRunning: true,
        },
      },
      metrics: {
        totalContexts: 0,
        totalPages: 0,
        totalRequests: 0,
        totalNavigations: 0,
        averageResponseTime: 0,
        errorRate: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        operationCount: 0,
      },
      createdAt: new Date(),
      lastUsedAt: new Date(),
      pid: this.getBrowserPid(browser),
    };

    return instance;
  }

  /**
   * Verify browser health
   */
  private async verifyBrowserHealth(browser: Browser): Promise<boolean> {
    try {
      // Check if browser process exists
      if (!browser.isConnected()) {
        return false;
      }

      // Try to create and close a context to test responsiveness
      const context = await browser.newContext();
      await context.close();

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthMonitorTimer) {
      return;
    }

    this.healthMonitorTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.health.checkInterval);
  }

  /**
   * Perform health checks on all browsers
   */
  private async performHealthChecks(): Promise<void> {
    const allBrowsers = [...this.availableBrowsers.values(), ...this.activeBrowsers.values()];

    for (const instance of allBrowsers) {
      const isHealthy = await this.verifyBrowserHealth(instance.browser);

      if (!isHealthy) {
        instance.health.consecutiveFailures++;
        instance.health.status = instance.health.consecutiveFailures >= this.config.health.maxFailures
          ? 'unhealthy'
          : 'degraded';

        if (instance.health.status === 'unhealthy') {
          this.emit('health-degraded', {
            browserId: instance.id,
            status: instance.health.status,
            action: this.config.health.recoveryStrategy,
            timestamp: new Date(),
          });

          // Auto-restart if not active
          if (!this.activeBrowsers.has(instance.id)) {
            await this.restartBrowser(instance.id);
          } else {
            instance.markedForRemoval = true;
          }
        }
      } else {
        instance.health.consecutiveFailures = 0;
        instance.health.status = 'healthy';
      }

      instance.health.lastCheck = new Date();
    }
  }

  /**
   * Restart a browser instance
   */
  private async restartBrowser(browserId: string): Promise<void> {
    const instance = this.availableBrowsers.get(browserId) || this.activeBrowsers.get(browserId);
    if (!instance) {
      return;
    }

    try {
      await this.removeBrowser(browserId);

      if (this.config.health.recoveryStrategy === 'restart') {
        const newInstance = await this.createBrowserInstance(instance.type);
        this.availableBrowsers.set(newInstance.id, newInstance);

        this.emit('browser-restarted', {
          oldBrowserId: browserId,
          newBrowserId: newInstance.id,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.emit('error', { type: 'restart', browserId, error });
    }
  }

  /**
   * Remove browser from pool
   */
  private async removeBrowser(browserId: string): Promise<void> {
    const instance = this.availableBrowsers.get(browserId) || this.activeBrowsers.get(browserId);
    if (!instance) {
      return;
    }

    try {
      await instance.browser.close();
    } catch (error) {
      console.warn(`Failed to close browser ${browserId}: ${(error as Error).message}`);
    }

    this.availableBrowsers.delete(browserId);
    this.activeBrowsers.delete(browserId);

    this.emit('browser-removed', {
      browserId,
      timestamp: new Date(),
    });
  }

  /**
   * Find least recently used browser
   */
  private findLRUBrowser(pool: Map<string, BrowserInstance>): string | null {
    let oldestId: string | null = null;
    let oldestTime = Date.now();

    for (const [id, instance] of pool.entries()) {
      if (instance.lastUsedAt.getTime() < oldestTime) {
        oldestTime = instance.lastUsedAt.getTime();
        oldestId = id;
      }
    }

    return oldestId;
  }

  /**
   * Check if browser should be recycled
   */
  private shouldRecycleBrowser(instance: BrowserInstance): boolean {
    if (!this.config.pool.recycleAfter || this.config.pool.recycleAfter === 0) {
      return false;
    }

    return instance.metrics.operationCount >= this.config.pool.recycleAfter;
  }

  /**
   * Wait for available browser
   */
  private async waitForAvailableBrowser(
    type: BrowserType,
    timeout: number = 30000
  ): Promise<BrowserInstance> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        // Check for available browser
        for (const [id, instance] of this.availableBrowsers.entries()) {
          if (instance.type === type && instance.health.status === 'healthy') {
            clearInterval(checkInterval);
            this.availableBrowsers.delete(id);
            instance.lastUsedAt = new Date();
            this.activeBrowsers.set(id, instance);
            resolve(instance);
            return;
          }
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Timeout waiting for available browser'));
        }
      }, 100);
    });
  }

  /**
   * Shutdown a single browser
   */
  private async shutdownBrowser(instance: BrowserInstance, report: ShutdownReport): Promise<void> {
    try {
      const contexts = instance.browser.contexts();

      for (const context of contexts) {
        try {
          const pages = context.pages();
          for (const page of pages) {
            try {
              await page.close();
              report.pagesClosed++;
            } catch (error) {
              report.errors.push({
                type: 'PAGE_CLOSE',
                message: (error as Error).message,
              });
            }
          }

          await context.close();
          report.contextsClosed++;
        } catch (error) {
          report.errors.push({
            type: 'CONTEXT_CLOSE',
            message: (error as Error).message,
          });
        }
      }

      await instance.browser.close();
      report.browsersClosed++;
    } catch (error) {
      report.errors.push({
        type: 'BROWSER_CLOSE',
        browserId: instance.id,
        message: (error as Error).message,
      });
      report.forceClosed++;
    }
  }

  /**
   * Get Playwright browser launcher
   */
  private getPlaywrightBrowser(type: BrowserType) {
    switch (type) {
      case 'chromium':
        return chromium;
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      default:
        throw new Error(`Unsupported browser type: ${type}`);
    }
  }

  /**
   * Get browser process ID
   */
  private getBrowserPid(browser: Browser): number | null {
    try {
      // Check if browser is connected (process running)
      if (!browser.isConnected()) {
        return null;
      }
      // Return a placeholder PID since direct process access is not recommended
      // The actual PID is managed internally by Playwright
      return 0; // 0 indicates browser is running but PID not directly accessible
    } catch {
      return null;
    }
  }

  /**
   * Build browser context options
   */
  private buildContextOptions(options?: BrowserContextOptions): any {
    return {
      viewport: options?.viewport || { width: 1920, height: 1080 },
      userAgent: options?.userAgent,
      locale: options?.locale || 'en-US',
      timezoneId: options?.timezoneId || 'America/New_York',
      geolocation: options?.geolocation,
      permissions: options?.permissions || [],
      colorScheme: options?.colorScheme || 'light',
      extraHTTPHeaders: options?.extraHTTPHeaders || {},
      acceptDownloads: options?.acceptDownloads !== undefined ? options.acceptDownloads : false,
      ignoreHTTPSErrors: options?.ignoreHTTPSErrors !== undefined ? options.ignoreHTTPSErrors : false,
      storageState: options?.storageState,
    };
  }

  /**
   * Merge user config with defaults
   */
  private mergeConfig(userConfig?: Partial<BrowserManagerConfig>): BrowserManagerConfig {
    // Ensure memory config has all required properties with defaults
    const defaultMemory = DEFAULT_CONFIG.memory || {
      warningThreshold: 512,
      criticalThreshold: 1024,
      autoGC: true,
    };

    const memoryConfig = {
      ...defaultMemory,
      ...(userConfig?.memory || {}),
    };

    return {
      pool: { ...DEFAULT_CONFIG.pool, ...userConfig?.pool },
      health: { ...DEFAULT_CONFIG.health, ...userConfig?.health },
      browserOptions: { ...DEFAULT_CONFIG.browserOptions, ...userConfig?.browserOptions },
      memory: {
        warningThreshold: memoryConfig.warningThreshold ?? defaultMemory.warningThreshold,
        criticalThreshold: memoryConfig.criticalThreshold ?? defaultMemory.criticalThreshold,
        autoGC: memoryConfig.autoGC ?? defaultMemory.autoGC,
      },
    };
  }
}

export default BrowserManager;
