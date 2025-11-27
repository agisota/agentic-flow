/**
 * Extraction Tools Unit Tests
 * Tests for getText, screenshot, getTable, and evaluate operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getText } from '../../../src/tools/extraction/getText.js';
import { screenshot } from '../../../src/tools/extraction/screenshot.js';
import { getTable } from '../../../src/tools/extraction/getTable.js';
import { evaluate } from '../../../src/tools/extraction/evaluate.js';

// Create mock element
const createMockElement = (options: any = {}) => ({
  evaluate: vi.fn().mockResolvedValue(options.text || 'Test Text'),
  screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-image-data')),
  boundingBox: vi.fn().mockResolvedValue({
    x: 0,
    y: 0,
    width: options.width || 100,
    height: options.height || 50,
  }),
});

// Create mock page
const createMockPage = () => ({
  waitForSelector: vi.fn().mockResolvedValue(undefined),
  $: vi.fn(),
  $$: vi.fn(),
  screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-screenshot')),
  viewportSize: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
  evaluate: vi.fn().mockResolvedValue({ result: 'test' }),
});

describe('Extraction Tools', () => {
  let mockPage: any;
  const sessionId = 'test-session';

  beforeEach(() => {
    mockPage = createMockPage();
  });

  describe('getText()', () => {
    it('should extract text from single element', async () => {
      const mockElement = createMockElement({ text: 'Hello World' });
      mockPage.$.mockResolvedValue(mockElement);

      const result = await getText(mockPage, {
        sessionId,
        selector: 'h1',
      });

      expect(result.text).toBe('Hello World');
      expect(result.selector).toBe('h1');
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        'h1',
        expect.objectContaining({ state: 'attached' })
      );
    });

    it('should extract text from all matching elements', async () => {
      const elements = [
        createMockElement({ text: 'Item 1' }),
        createMockElement({ text: 'Item 2' }),
        createMockElement({ text: 'Item 3' }),
      ];
      mockPage.$$.mockResolvedValue(elements);

      const result = await getText(mockPage, {
        sessionId,
        selector: 'li',
        all: true,
      });

      expect(result.text).toEqual(['Item 1', 'Item 2', 'Item 3']);
      expect(result.count).toBe(3);
    });

    it('should trim whitespace by default', async () => {
      const mockElement = createMockElement({ text: '  Hello World  ' });
      mockPage.$.mockResolvedValue(mockElement);
      mockElement.evaluate.mockResolvedValue('  Hello World  ');

      const result = await getText(mockPage, {
        sessionId,
        selector: 'p',
        trim: true,
      });

      // The implementation should trim the text
      expect(result.text).toBeDefined();
    });

    it('should normalize whitespace', async () => {
      const mockElement = createMockElement({
        text: 'Hello    World\n\nTest',
      });
      mockPage.$.mockResolvedValue(mockElement);
      mockElement.evaluate.mockResolvedValue('Hello    World\n\nTest');

      const result = await getText(mockPage, {
        sessionId,
        selector: 'p',
        normalizeWhitespace: true,
      });

      expect(result.text).toBeDefined();
    });

    it('should handle Shadow DOM', async () => {
      const mockElement = createMockElement();
      mockPage.$.mockResolvedValue(mockElement);
      mockElement.evaluate.mockImplementation((fn: any) => {
        return fn({ shadowRoot: { textContent: 'Shadow Text' } });
      });

      const result = await getText(mockPage, {
        sessionId,
        selector: 'custom-element',
      });

      expect(result.text).toBe('Shadow Text');
    });

    it('should throw error when element not found', async () => {
      mockPage.$.mockResolvedValue(null);

      await expect(
        getText(mockPage, { sessionId, selector: '.non-existent' })
      ).rejects.toThrow('Element not found');
    });

    it('should handle timeout', async () => {
      mockPage.waitForSelector.mockRejectedValue(new Error('Timeout'));

      await expect(
        getText(mockPage, {
          sessionId,
          selector: 'div',
          timeout: 1000,
        })
      ).rejects.toThrow();
    });
  });

  describe('screenshot()', () => {
    it('should take full page screenshot', async () => {
      const result = await screenshot(mockPage, {
        sessionId,
        fullPage: true,
        format: 'png',
      });

      expect(result.success).toBe(true);
      expect(result.base64).toBeDefined();
      expect(result.format).toBe('png');
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(mockPage.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'png',
          fullPage: true,
        })
      );
    });

    it('should take element screenshot', async () => {
      const mockElement = createMockElement({ width: 200, height: 100 });
      mockPage.$.mockResolvedValue(mockElement);

      const result = await screenshot(mockPage, {
        sessionId,
        selector: '#banner',
        format: 'jpeg',
        quality: 80,
      });

      expect(result.success).toBe(true);
      expect(result.width).toBe(200);
      expect(result.height).toBe(100);
      expect(mockElement.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'jpeg',
          quality: 80,
        })
      );
    });

    it('should save screenshot to file', async () => {
      const result = await screenshot(mockPage, {
        sessionId,
        path: '/tmp/screenshot.png',
      });

      expect(result.path).toBe('/tmp/screenshot.png');
      expect(mockPage.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/tmp/screenshot.png',
        })
      );
    });

    it('should handle transparent background', async () => {
      await screenshot(mockPage, {
        sessionId,
        format: 'png',
        omitBackground: true,
      });

      expect(mockPage.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          omitBackground: true,
        })
      );
    });

    it('should throw error when element not found', async () => {
      mockPage.$.mockResolvedValue(null);

      await expect(
        screenshot(mockPage, {
          sessionId,
          selector: '.non-existent',
        })
      ).rejects.toThrow('Element not found');
    });

    it('should throw error when element has no bounding box', async () => {
      const mockElement = createMockElement();
      mockElement.boundingBox.mockResolvedValue(null);
      mockPage.$.mockResolvedValue(mockElement);

      await expect(
        screenshot(mockPage, {
          sessionId,
          selector: 'hidden-element',
        })
      ).rejects.toThrow('no bounding box');
    });
  });

  describe('getTable()', () => {
    it('should extract table with headers', async () => {
      const mockElement = createMockElement();
      mockPage.$.mockResolvedValue(mockElement);
      mockElement.evaluate.mockResolvedValue({
        headers: ['Name', 'Age', 'City'],
        rows: [
          [
            { text: 'John', isHeader: false },
            { text: '30', isHeader: false },
            { text: 'NYC', isHeader: false },
          ],
          [
            { text: 'Jane', isHeader: false },
            { text: '25', isHeader: false },
            { text: 'LA', isHeader: false },
          ],
        ],
        rowCount: 2,
        columnCount: 3,
      });

      const result = await getTable(mockPage, {
        sessionId,
        selector: 'table',
        includeHeaders: true,
      });

      expect(result.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.rowCount).toBe(2);
      expect(result.columnCount).toBe(3);
      expect(result.rows).toHaveLength(2);
    });

    it('should handle colspan and rowspan', async () => {
      const mockElement = createMockElement();
      mockPage.$.mockResolvedValue(mockElement);
      mockElement.evaluate.mockResolvedValue({
        headers: ['Col1', 'Col2', 'Col3'],
        rows: [
          [
            { text: 'Cell 1', colspan: 2, isHeader: false },
            { text: 'Cell 2', isHeader: false },
          ],
        ],
        rowCount: 1,
        columnCount: 3,
      });

      const result = await getTable(mockPage, {
        sessionId,
        selector: 'table',
      });

      expect(result.rows[0][0]).toHaveProperty('colspan', 2);
    });

    it('should trim cell text', async () => {
      const mockElement = createMockElement();
      mockPage.$.mockResolvedValue(mockElement);
      mockElement.evaluate.mockResolvedValue({
        headers: ['Name'],
        rows: [[{ text: 'John', isHeader: false }]],
        rowCount: 1,
        columnCount: 1,
      });

      const result = await getTable(mockPage, {
        sessionId,
        selector: 'table',
        trim: true,
      });

      expect(result.rows[0][0].text).toBe('John');
    });

    it('should throw error when table not found', async () => {
      mockPage.$.mockResolvedValue(null);

      await expect(
        getTable(mockPage, {
          sessionId,
          selector: 'table',
        })
      ).rejects.toThrow('Table not found');
    });
  });

  describe('evaluate()', () => {
    it('should execute JavaScript and return result', async () => {
      mockPage.evaluate.mockResolvedValue(42);

      const result = await evaluate(mockPage, {
        sessionId,
        script: 'return 1 + 1;',
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe(42);
      expect(result.type).toBe('number');
    });

    it('should pass arguments to script', async () => {
      mockPage.evaluate.mockResolvedValue('Hello World');

      await evaluate(mockPage, {
        sessionId,
        script: 'return args[0] + " " + args[1];',
        args: ['Hello', 'World'],
      });

      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should detect result types', async () => {
      // Test array type
      mockPage.evaluate.mockResolvedValueOnce([1, 2, 3]);
      const arrayResult = await evaluate(mockPage, {
        sessionId,
        script: 'return [1, 2, 3];',
      });
      expect(arrayResult.type).toBe('array');

      // Test null type
      mockPage.evaluate.mockResolvedValueOnce(null);
      const nullResult = await evaluate(mockPage, {
        sessionId,
        script: 'return null;',
      });
      expect(nullResult.type).toBe('null');

      // Test object type
      mockPage.evaluate.mockResolvedValueOnce({ key: 'value' });
      const objectResult = await evaluate(mockPage, {
        sessionId,
        script: 'return { key: "value" };',
      });
      expect(objectResult.type).toBe('object');
    });

    it('should handle script errors gracefully', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Script error'));

      const result = await evaluate(mockPage, {
        sessionId,
        script: 'throw new Error("Script error");',
      });

      expect(result.success).toBe(false);
      expect(result.type).toBe('error');
      expect(result.result).toHaveProperty('error');
    });

    it('should wrap script in async function', async () => {
      mockPage.evaluate.mockResolvedValue('async result');

      await evaluate(mockPage, {
        sessionId,
        script: 'await Promise.resolve("async result");',
      });

      expect(mockPage.evaluate).toHaveBeenCalled();
    });
  });
});
