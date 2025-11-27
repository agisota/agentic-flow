/**
 * Interaction Tools Unit Tests
 * Tests for click, fill, type, and select operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { click } from '../../../src/tools/interaction/click.js';
import { fill } from '../../../src/tools/interaction/fill.js';
import { type as typeText } from '../../../src/tools/interaction/type.js';
import { select } from '../../../src/tools/interaction/select.js';
import * as contextUtils from '../../../src/utils/context.js';

// Mock context utilities
vi.mock('../../../src/utils/context.js', () => ({
  getCurrentPage: vi.fn(),
  getContextManager: vi.fn(),
}));

// Create mock page
const createMockPage = () => ({
  waitForSelector: vi.fn().mockResolvedValue(undefined),
  click: vi.fn().mockResolvedValue(undefined),
  fill: vi.fn().mockResolvedValue(undefined),
  type: vi.fn().mockResolvedValue(undefined),
  focus: vi.fn().mockResolvedValue(undefined),
  selectOption: vi.fn().mockResolvedValue(['value1']),
  $: vi.fn().mockResolvedValue({}),
});

describe('Interaction Tools', () => {
  let mockPage: any;

  beforeEach(() => {
    mockPage = createMockPage();
    vi.mocked(contextUtils.getCurrentPage).mockReturnValue(mockPage as any);
  });

  describe('click()', () => {
    it('should click element successfully', async () => {
      const result = await click({
        selector: 'button.submit',
        button: 'left',
        clickCount: 1,
      });

      expect(result.success).toBe(true);
      expect(result.selector).toBe('button.submit');
      expect(result.button).toBe('left');
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        'button.submit',
        expect.objectContaining({ state: 'visible' })
      );
      expect(mockPage.click).toHaveBeenCalledWith(
        'button.submit',
        expect.objectContaining({
          button: 'left',
          clickCount: 1,
        })
      );
    });

    it('should click with modifiers', async () => {
      await click({
        selector: '#link',
        modifiers: ['Control', 'Shift'],
      });

      expect(mockPage.click).toHaveBeenCalledWith(
        '#link',
        expect.objectContaining({
          modifiers: ['Control', 'Shift'],
        })
      );
    });

    it('should handle double click', async () => {
      await click({
        selector: '.item',
        clickCount: 2,
      });

      expect(mockPage.click).toHaveBeenCalledWith(
        '.item',
        expect.objectContaining({
          clickCount: 2,
        })
      );
    });

    it('should retry on failure', async () => {
      mockPage.click
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce(undefined);

      const result = await click({
        selector: 'button',
      });

      expect(result.success).toBe(true);
      expect(mockPage.click).toHaveBeenCalledTimes(3);
    });

    it('should throw ElementNotFoundError after retries', async () => {
      mockPage.click.mockRejectedValue(new Error('Element not found'));

      await expect(
        click({ selector: '.non-existent' })
      ).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mockPage.waitForSelector.mockRejectedValue(new Error('Timeout waiting for selector'));

      await expect(
        click({ selector: 'button', timeout: 1000 })
      ).rejects.toThrow();
    });
  });

  describe('fill()', () => {
    it('should fill input field successfully', async () => {
      const result = await fill({
        selector: 'input[name="email"]',
        value: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.selector).toBe('input[name="email"]');
      expect(result.value).toBe('test@example.com');
      expect(mockPage.fill).toHaveBeenCalledWith(
        'input[name="email"]',
        'test@example.com',
        expect.any(Object)
      );
    });

    it('should fill with custom timeout', async () => {
      await fill({
        selector: 'input',
        value: 'test',
        timeout: 5000,
      });

      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        'input',
        expect.objectContaining({ timeout: 5000 })
      );
    });

    it('should fill with force option', async () => {
      await fill({
        selector: 'input',
        value: 'test',
        force: true,
      });

      expect(mockPage.fill).toHaveBeenCalledWith(
        'input',
        'test',
        expect.objectContaining({ force: true })
      );
    });

    it('should handle fill errors', async () => {
      mockPage.fill.mockRejectedValue(new Error('Element not editable'));

      await expect(
        fill({ selector: 'input', value: 'test' })
      ).rejects.toThrow();
    });

    it('should retry on failure', async () => {
      mockPage.fill
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(undefined);

      const result = await fill({
        selector: 'input',
        value: 'test',
      });

      expect(result.success).toBe(true);
      expect(mockPage.fill).toHaveBeenCalledTimes(2);
    });
  });

  describe('type()', () => {
    it('should type text with delay', async () => {
      const result = await typeText({
        selector: 'textarea',
        text: 'Hello World',
        delay: 50,
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('Hello World');
      expect(result.charactersTyped).toBe(11);
      expect(mockPage.focus).toHaveBeenCalledWith('textarea');
      expect(mockPage.type).toHaveBeenCalledWith(
        'textarea',
        'Hello World',
        expect.objectContaining({ delay: 50 })
      );
    });

    it('should type with default delay', async () => {
      await typeText({
        selector: 'input',
        text: 'test',
      });

      expect(mockPage.type).toHaveBeenCalledWith(
        'input',
        'test',
        expect.objectContaining({ delay: 50 })
      );
    });

    it('should focus element before typing', async () => {
      await typeText({
        selector: 'input',
        text: 'test',
      });

      expect(mockPage.focus).toHaveBeenCalledBefore(mockPage.type);
    });

    it('should handle typing errors', async () => {
      mockPage.type.mockRejectedValue(new Error('Element not editable'));

      await expect(
        typeText({ selector: 'input', text: 'test' })
      ).rejects.toThrow();
    });

    it('should retry on failure', async () => {
      mockPage.type
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(undefined);

      const result = await typeText({
        selector: 'input',
        text: 'test',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('select()', () => {
    it('should select by value', async () => {
      const result = await select({
        selector: 'select[name="country"]',
        value: 'us',
      });

      expect(result.success).toBe(true);
      expect(result.selector).toBe('select[name="country"]');
      expect(result.selected).toEqual(['value1']);
      expect(mockPage.selectOption).toHaveBeenCalledWith(
        'select[name="country"]',
        { value: 'us' },
        expect.any(Object)
      );
    });

    it('should select by label', async () => {
      await select({
        selector: 'select',
        label: 'United States',
      });

      expect(mockPage.selectOption).toHaveBeenCalledWith(
        'select',
        { label: 'United States' },
        expect.any(Object)
      );
    });

    it('should select by index', async () => {
      await select({
        selector: 'select',
        index: 2,
      });

      expect(mockPage.selectOption).toHaveBeenCalledWith(
        'select',
        { index: 2 },
        expect.any(Object)
      );
    });

    it('should select multiple values', async () => {
      await select({
        selector: 'select[multiple]',
        value: ['us', 'uk', 'ca'],
      });

      expect(mockPage.selectOption).toHaveBeenCalledWith(
        'select[multiple]',
        [{ value: 'us' }, { value: 'uk' }, { value: 'ca' }],
        expect.any(Object)
      );
    });

    it('should throw error when no option provided', async () => {
      // When no option is provided, it will first wait for selector then fail
      mockPage.selectOption.mockRejectedValue(new Error('Must provide value, label, or index option'));

      await expect(
        select({ selector: 'select' })
      ).rejects.toThrow();
    });

    it('should handle select errors', async () => {
      mockPage.selectOption.mockRejectedValue(new Error('Element not found'));

      await expect(
        select({ selector: 'select', value: 'test' })
      ).rejects.toThrow();
    });

    it('should retry on failure', async () => {
      mockPage.selectOption
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(['value1']);

      const result = await select({
        selector: 'select',
        value: 'test',
      });

      expect(result.success).toBe(true);
    });
  });
});
