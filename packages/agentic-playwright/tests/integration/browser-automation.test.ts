/**
 * Integration Tests for Browser Automation
 *
 * Tests real browser operations using Playwright
 * Note: These tests are skipped in CI as they require a browser
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

// Skip these tests in CI environment or when SKIP_BROWSER_TESTS is set
const skipTests = process.env.CI === 'true' || process.env.SKIP_BROWSER_TESTS === 'true';

const describeFn = skipTests ? describe.skip : describe;

describeFn('Browser Automation Integration', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await page?.close();
      await context?.close();
      await browser.close();
    }
  });

  describe('Navigation', () => {
    it('should navigate to a real page', async () => {
      const url = 'https://example.com';
      await page.goto(url, { waitUntil: 'networkidle' });

      const currentUrl = page.url();
      expect(currentUrl).toBe(url);
    }, 30000);

    it('should get page title', async () => {
      await page.goto('https://example.com');
      const title = await page.title();

      expect(title).toBeTruthy();
      expect(title).toContain('Example');
    }, 30000);

    it('should wait for navigation', async () => {
      await page.goto('https://example.com');
      const url = page.url();

      expect(url).toContain('example.com');
    }, 30000);
  });

  describe('Content Extraction', () => {
    it('should extract text content', async () => {
      await page.goto('https://example.com');
      const text = await page.textContent('body');

      expect(text).toBeTruthy();
      expect(text).toContain('Example Domain');
    }, 30000);

    it('should extract text from specific selector', async () => {
      await page.goto('https://example.com');
      const heading = await page.textContent('h1');

      expect(heading).toBeTruthy();
      expect(heading).toContain('Example Domain');
    }, 30000);

    it('should extract element attributes', async () => {
      await page.goto('https://example.com');
      const links = await page.locator('a').all();

      expect(links.length).toBeGreaterThan(0);

      if (links.length > 0) {
        const href = await links[0].getAttribute('href');
        expect(href).toBeTruthy();
      }
    }, 30000);

    it('should count elements', async () => {
      await page.goto('https://example.com');
      const paragraphs = await page.locator('p').count();

      expect(paragraphs).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Screenshots', () => {
    it('should take a full page screenshot', async () => {
      await page.goto('https://example.com');
      const screenshot = await page.screenshot({ fullPage: true });

      expect(screenshot).toBeInstanceOf(Buffer);
      expect(screenshot.length).toBeGreaterThan(0);
    }, 30000);

    it('should take a PNG screenshot', async () => {
      await page.goto('https://example.com');
      const screenshot = await page.screenshot({ type: 'png' });

      expect(screenshot).toBeInstanceOf(Buffer);
      // PNG files start with PNG signature
      expect(screenshot[0]).toBe(0x89);
      expect(screenshot[1]).toBe(0x50);
    }, 30000);

    it('should take a JPEG screenshot', async () => {
      await page.goto('https://example.com');
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 80 });

      expect(screenshot).toBeInstanceOf(Buffer);
      // JPEG files start with FFD8
      expect(screenshot[0]).toBe(0xFF);
      expect(screenshot[1]).toBe(0xD8);
    }, 30000);

    it('should take element screenshot', async () => {
      await page.goto('https://example.com');
      const element = page.locator('h1').first();
      const screenshot = await element.screenshot();

      expect(screenshot).toBeInstanceOf(Buffer);
      expect(screenshot.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Element Queries', () => {
    it('should find elements by CSS selector', async () => {
      await page.goto('https://example.com');
      const elements = await page.locator('p').all();

      expect(elements.length).toBeGreaterThan(0);
    }, 30000);

    it('should check element visibility', async () => {
      await page.goto('https://example.com');
      const heading = page.locator('h1').first();
      const isVisible = await heading.isVisible();

      expect(isVisible).toBe(true);
    }, 30000);

    it('should wait for selector', async () => {
      await page.goto('https://example.com');
      const element = await page.waitForSelector('h1', { state: 'visible' });

      expect(element).toBeTruthy();
    }, 30000);

    it('should get element properties', async () => {
      await page.goto('https://example.com');
      const heading = page.locator('h1').first();
      const text = await heading.textContent();
      const boundingBox = await heading.boundingBox();

      expect(text).toBeTruthy();
      expect(boundingBox).toBeTruthy();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle navigation timeout', async () => {
      try {
        await page.goto('https://httpstat.us/200?sleep=60000', {
          timeout: 1000,
          waitUntil: 'networkidle'
        });
        expect.fail('Should have thrown timeout error');
      } catch (error: any) {
        expect(error.message).toContain('Timeout');
      }
    }, 35000);

    it('should handle invalid selector', async () => {
      await page.goto('https://example.com');

      try {
        await page.locator('invalid>>>selector').textContent({ timeout: 1000 });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    }, 30000);

    it('should handle missing elements', async () => {
      await page.goto('https://example.com');
      const element = await page.locator('non-existent-element').first();
      const text = await element.textContent({ timeout: 1000 }).catch(() => null);

      expect(text).toBeNull();
    }, 30000);

    it('should handle network errors', async () => {
      try {
        await page.goto('https://invalid-domain-that-does-not-exist-12345.com', {
          timeout: 5000
        });
        expect.fail('Should have thrown network error');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('Session Management', () => {
    it('should create multiple contexts', async () => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      await page1.goto('https://example.com');
      await page2.goto('https://example.com');

      expect(page1.url()).toBe('https://example.com/');
      expect(page2.url()).toBe('https://example.com/');

      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
    }, 30000);

    it('should isolate cookies between contexts', async () => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      await page1.goto('https://example.com');
      await context1.addCookies([{
        name: 'test',
        value: 'value1',
        domain: 'example.com',
        path: '/'
      }]);

      const cookies1 = await context1.cookies();
      const cookies2 = await context2.cookies();

      expect(cookies1.length).toBeGreaterThan(0);
      expect(cookies2.length).toBe(0);

      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
    }, 30000);
  });

  describe('Performance', () => {
    it('should load page within reasonable time', async () => {
      const startTime = Date.now();
      await page.goto('https://example.com', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    }, 30000);

    it('should handle concurrent operations', async () => {
      const urls = [
        'https://example.com',
        'https://example.com',
        'https://example.com'
      ];

      const contexts = await Promise.all(
        urls.map(() => browser.newContext())
      );

      const pages = await Promise.all(
        contexts.map(ctx => ctx.newPage())
      );

      await Promise.all(
        pages.map(p => p.goto('https://example.com'))
      );

      expect(pages.length).toBe(3);

      // Cleanup
      await Promise.all(pages.map(p => p.close()));
      await Promise.all(contexts.map(ctx => ctx.close()));
    }, 60000);
  });
});
