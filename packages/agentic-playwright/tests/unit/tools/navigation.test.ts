/**
 * Navigation Tools Unit Tests
 * Tests for URL navigation, history, and tab management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { navigate } from '../../../src/tools/navigation/navigate.js';
import { back } from '../../../src/tools/navigation/back.js';
import { newTab } from '../../../src/tools/navigation/newTab.js';
import { NavigationContextManager } from '../../../src/tools/navigation/context.js';

// Mock Playwright Page
const createMockPage = () => ({
  url: vi.fn().mockReturnValue('https://example.com'),
  title: vi.fn().mockResolvedValue('Example Page'),
  goto: vi.fn().mockResolvedValue({
    status: () => 200,
    ok: () => true,
  }),
  goBack: vi.fn().mockResolvedValue(null),
  goForward: vi.fn().mockResolvedValue(null),
  close: vi.fn().mockResolvedValue(undefined),
});

const createMockContext = (mockPage: any) => ({
  newPage: vi.fn().mockResolvedValue(mockPage),
  close: vi.fn().mockResolvedValue(undefined),
});

describe('Navigation Tools', () => {
  let mockPage: any;
  let mockContext: any;
  const sessionId = 'test-session-123';

  beforeEach(() => {
    mockPage = createMockPage();
    mockContext = createMockContext(mockPage);

    // Setup navigation context using getOrCreate
    NavigationContextManager.getOrCreate(sessionId, mockContext, mockPage);
  });

  describe('navigate()', () => {
    it('should navigate to valid URL successfully', async () => {
      const result = await navigate({
        url: 'https://example.com',
        sessionId,
        waitUntil: 'load',
        timeout: 30000,
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com');
      expect(result.title).toBe('Example Page');
      expect(result.loadTime).toBeGreaterThanOrEqual(0);
      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          waitUntil: 'load',
          timeout: 30000,
        })
      );
    });

    it('should validate URL format', async () => {
      const result = await navigate({
        url: 'invalid-url',
        sessionId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle navigation with referer', async () => {
      await navigate({
        url: 'https://example.com',
        sessionId,
        referer: 'https://google.com',
      });

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          referer: 'https://google.com',
        })
      );
    });

    it('should handle different waitUntil options', async () => {
      await navigate({
        url: 'https://example.com',
        sessionId,
        waitUntil: 'networkidle',
      });

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          waitUntil: 'networkidle',
        })
      );
    });

    it('should throw error for missing sessionId', async () => {
      const result = await navigate({
        url: 'https://example.com',
        sessionId: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('sessionId is required');
    });

    it('should handle navigation timeout', async () => {
      mockPage.goto.mockRejectedValueOnce(new Error('Navigation timeout'));

      const result = await navigate({
        url: 'https://example.com',
        sessionId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Navigation timeout');
    });

    it('should update context after navigation', async () => {
      mockPage.url.mockReturnValue('https://example.com/page');
      mockPage.title.mockResolvedValue('New Page');

      await navigate({
        url: 'https://example.com/page',
        sessionId,
      });

      const ctx = NavigationContextManager.get(sessionId);
      expect(ctx?.currentUrl).toBe('https://example.com/page');
      expect(ctx?.currentTitle).toBe('New Page');
    });
  });

  describe('back()', () => {
    it('should navigate back successfully', async () => {
      mockPage.url.mockReturnValue('https://example.com/previous');

      const result = await back({
        sessionId,
        waitUntil: 'load',
        timeout: 30000,
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/previous');
      expect(mockPage.goBack).toHaveBeenCalledWith({
        waitUntil: 'load',
        timeout: 30000,
      });
    });

    it('should handle back navigation with different waitUntil', async () => {
      await back({
        sessionId,
        waitUntil: 'domcontentloaded',
      });

      expect(mockPage.goBack).toHaveBeenCalledWith(
        expect.objectContaining({
          waitUntil: 'domcontentloaded',
        })
      );
    });

    it('should handle back navigation failure', async () => {
      mockPage.goBack.mockRejectedValueOnce(new Error('Cannot go back'));

      const result = await back({ sessionId });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot go back');
    });

    it('should throw error for invalid session', async () => {
      const result = await back({ sessionId: 'invalid-session' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('newTab()', () => {
    it('should open new tab successfully', async () => {
      const newMockPage = createMockPage();
      mockContext.newPage.mockResolvedValueOnce(newMockPage);

      const result = await newTab({
        sessionId,
      });

      expect(result.success).toBe(true);
      expect(result.tabId).toBeDefined();
      expect(mockContext.newPage).toHaveBeenCalled();
    });

    it('should open new tab with URL', async () => {
      const newMockPage = createMockPage();
      mockContext.newPage.mockResolvedValueOnce(newMockPage);
      newMockPage.url.mockReturnValue('https://example.com');

      const result = await newTab({
        sessionId,
        url: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com');
      expect(newMockPage.goto).toHaveBeenCalledWith(
        'https://example.com',
        expect.any(Object)
      );
    });

    it('should validate URL format when provided', async () => {
      const result = await newTab({
        sessionId,
        url: 'invalid-url',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle tab creation failure', async () => {
      mockContext.newPage.mockRejectedValueOnce(new Error('Failed to create tab'));

      const result = await newTab({ sessionId });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create tab');
    });

    it('should throw error for missing context', async () => {
      const result = await newTab({ sessionId: 'invalid-session' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active browser context');
    });
  });
});
