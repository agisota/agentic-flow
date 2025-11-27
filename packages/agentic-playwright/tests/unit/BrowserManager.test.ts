/**
 * BrowserManager Unit Tests
 * Tests for browser pool management, singleton pattern, and health monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserManager } from '../../src/components/BrowserManager.js';
import type { Browser, BrowserContext, Page } from 'playwright';

// Mock Playwright
vi.mock('playwright', () => {
  // Create mock page
  const createMockPage = () => {
    const mockContext = {
      close: vi.fn().mockResolvedValue(undefined),
      pages: vi.fn().mockReturnValue([]),
    };

    return {
      url: vi.fn().mockReturnValue('about:blank'),
      title: vi.fn().mockResolvedValue('Test Page'),
      close: vi.fn().mockResolvedValue(undefined),
      context: vi.fn().mockReturnValue(mockContext),
    };
  };

  // Create mock context
  const createMockContext = () => ({
    newPage: vi.fn().mockResolvedValue(createMockPage()),
    close: vi.fn().mockResolvedValue(undefined),
    pages: vi.fn().mockReturnValue([createMockPage()]),
  });

  // Create mock browser
  const createMockBrowser = () => {
    const mockContext = createMockContext();
    return {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      contexts: vi.fn().mockReturnValue([mockContext]),
      process: vi.fn().mockReturnValue({ pid: 12345 }),
    };
  };

  const mockChromium = {
    launch: vi.fn().mockImplementation(() => Promise.resolve(createMockBrowser())),
  };

  return {
    chromium: mockChromium,
    firefox: { launch: vi.fn().mockImplementation(() => Promise.resolve(createMockBrowser())) },
    webkit: { launch: vi.fn().mockImplementation(() => Promise.resolve(createMockBrowser())) },
  };
});

describe('BrowserManager', () => {
  let manager: BrowserManager;

  beforeEach(() => {
    // Reset singleton instance before each test
    BrowserManager.resetInstance();
    manager = BrowserManager.getInstance();
  });

  afterEach(async () => {
    // Cleanup after each test
    if (manager) {
      await manager.shutdown();
    }
    BrowserManager.resetInstance();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = BrowserManager.getInstance();
      const instance2 = BrowserManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = BrowserManager.getInstance();
      BrowserManager.resetInstance();
      const instance2 = BrowserManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should accept configuration on first getInstance call', () => {
      BrowserManager.resetInstance();
      const instance = BrowserManager.getInstance({
        pool: { minInstances: 2, maxInstances: 10 },
      });

      expect(instance).toBeDefined();
      expect(instance.getStatus().totalBrowsers).toBe(0);
    });
  });

  describe('Browser Launch', () => {
    it('should launch a browser with default options', async () => {
      const browser = await manager.launch();

      expect(browser).toBeDefined();
      expect(browser.isConnected()).toBe(true);
    });

    it('should launch browser with custom options', async () => {
      const browser = await manager.launch({
        type: 'firefox',
        headless: false,
        timeout: 60000,
      });

      expect(browser).toBeDefined();
    });

    it('should emit browser-launched event', async () => {
      const eventSpy = vi.fn();
      manager.on('browser-launched', eventSpy);

      await manager.launch();

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chromium',
          timestamp: expect.any(Date),
        })
      );
    });
  });

  describe('Browser Pool Management', () => {
    it('should acquire a browser from the pool', async () => {
      await manager.initialize();
      const instance = await manager.acquireBrowser();

      expect(instance).toBeDefined();
      expect(instance.id).toBeDefined();
      expect(instance.browser).toBeDefined();
      expect(instance.type).toBe('chromium');
    });

    it('should release browser back to pool', async () => {
      await manager.initialize();
      const instance = await manager.acquireBrowser();
      const statusBefore = manager.getStatus();

      await manager.releaseBrowser(instance.id);
      const statusAfter = manager.getStatus();

      expect(statusBefore.activeBrowsers).toBe(1);
      expect(statusAfter.activeBrowsers).toBe(0);
      expect(statusAfter.availableBrowsers).toBeGreaterThanOrEqual(1);
    });

    it('should reuse available browsers', async () => {
      await manager.initialize();

      const instance1 = await manager.acquireBrowser();
      await manager.releaseBrowser(instance1.id);

      const instance2 = await manager.acquireBrowser();

      // Should reuse the same browser
      expect(instance2.id).toBe(instance1.id);
    });

    it('should throw error when releasing non-existent browser', async () => {
      await expect(
        manager.releaseBrowser('non-existent-id')
      ).rejects.toThrow('Browser non-existent-id not found in active pool');
    });

    it('should respect max pool size', async () => {
      BrowserManager.resetInstance();
      manager = BrowserManager.getInstance({
        pool: { minInstances: 1, maxInstances: 2 },
      });

      await manager.initialize();

      const instance1 = await manager.acquireBrowser();
      const instance2 = await manager.acquireBrowser();

      // Third acquisition should throw when pool is exhausted
      await expect(manager.acquireBrowser()).rejects.toThrow('Browser pool exhausted');
    });
  });

  describe('Page Management', () => {
    it('should acquire a page with context', async () => {
      await manager.initialize();

      const { page, browserId, contextId } = await manager.acquirePage();

      expect(page).toBeDefined();
      expect(browserId).toBeDefined();
      expect(contextId).toBeDefined();
      expect(page.url()).toBe('about:blank');
    });

    it('should release page and close context', async () => {
      await manager.initialize();

      const { page, browserId } = await manager.acquirePage();
      const closeSpy = vi.spyOn(page, 'close');

      await manager.releasePage(page, browserId);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should emit page-acquired event', async () => {
      await manager.initialize();
      const eventSpy = vi.fn();
      manager.on('page-acquired', eventSpy);

      await manager.acquirePage();

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          browserId: expect.any(String),
          contextId: expect.any(String),
          timestamp: expect.any(Date),
        })
      );
    });
  });

  describe('Pool Status', () => {
    it('should return accurate pool status', async () => {
      await manager.initialize();

      const instance = await manager.acquireBrowser();
      const status = manager.getStatus();

      expect(status).toEqual({
        totalBrowsers: expect.any(Number),
        availableBrowsers: expect.any(Number),
        activeBrowsers: 1,
        unhealthyBrowsers: 0,
        utilization: expect.any(Number),
        instances: expect.arrayContaining([
          expect.objectContaining({
            id: instance.id,
            type: 'chromium',
            status: 'active',
          }),
        ]),
      });
    });

    it('should track multiple browsers in status', async () => {
      BrowserManager.resetInstance();
      manager = BrowserManager.getInstance({
        pool: { minInstances: 1, maxInstances: 3 },
      });
      await manager.initialize();

      const instance1 = await manager.acquireBrowser();
      const instance2 = await manager.acquireBrowser();

      const status = manager.getStatus();

      expect(status.totalBrowsers).toBeGreaterThanOrEqual(2);
      expect(status.activeBrowsers).toBe(2);
    });
  });

  describe('Shutdown', () => {
    it('should gracefully shutdown all browsers', async () => {
      await manager.initialize();

      const instance = await manager.acquireBrowser();
      const report = await manager.shutdown();

      expect(report).toEqual({
        startTime: expect.any(Date),
        endTime: expect.any(Date),
        duration: expect.any(Number),
        browsersAtStart: expect.any(Number),
        browsersClosed: expect.any(Number),
        contextsAtStart: expect.any(Number),
        contextsClosed: expect.any(Number),
        pagesAtStart: expect.any(Number),
        pagesClosed: expect.any(Number),
        forceClosed: 0,
        errors: [],
        success: true,
      });
    });

    it('should emit shutdown-complete event', async () => {
      await manager.initialize();
      const eventSpy = vi.fn();
      manager.on('shutdown-complete', eventSpy);

      await manager.shutdown();

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          duration: expect.any(Number),
        })
      );
    });

    it('should prevent operations during shutdown', async () => {
      await manager.initialize();
      const shutdownPromise = manager.shutdown();

      await expect(manager.acquireBrowser()).rejects.toThrow(
        'BrowserManager is shutting down'
      );

      await shutdownPromise;
    });
  });

  describe('Memory Reporting', () => {
    it('should generate memory report', async () => {
      await manager.initialize();
      await manager.acquireBrowser();

      const report = await manager.getMemoryReport();

      expect(report).toEqual({
        totalMemory: expect.any(Number),
        browserMemory: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            pid: expect.any(Number),
            memoryMB: expect.any(Number),
            contextCount: expect.any(Number),
            pageCount: expect.any(Number),
          }),
        ]),
        warnings: expect.any(Array),
        actions: expect.any(Array),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle launch failures', async () => {
      const { chromium } = await import('playwright');
      vi.mocked(chromium.launch).mockRejectedValueOnce(new Error('Launch failed'));

      await expect(manager.launch()).rejects.toThrow('Failed to launch chromium browser');
    });

    it('should emit error events on failures', async () => {
      const errorSpy = vi.fn();
      manager.on('error', errorSpy);

      const { chromium } = await import('playwright');
      vi.mocked(chromium.launch).mockRejectedValueOnce(new Error('Launch failed'));

      await expect(manager.launch()).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'launch',
          error: expect.any(Error),
        })
      );
    });
  });
});
