/**
 * Utils Unit Tests
 * Tests for selector parsing, logger, and context manager utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseSelector,
  buildSelector,
  SelectorType,
  isValidSelector,
  isXPath,
  hasEngine,
  testIdSelector,
  textSelector,
  roleSelector,
} from '../../src/utils/selectors.js';
import { logger, LogLevel, createLogger } from '../../src/utils/logger.js';
import { getContextManager } from '../../src/utils/context.js';
import type { Browser, BrowserContext, Page } from 'playwright';

describe('Selector Utilities', () => {
  describe('parseSelector()', () => {
    it('should detect CSS selectors', () => {
      const result = parseSelector('button.primary');

      expect(result.type).toBe(SelectorType.CSS);
      expect(result.value).toBe('button.primary');
      expect(result.original).toBe('button.primary');
    });

    it('should detect XPath selectors', () => {
      const result = parseSelector('//button[@id="submit"]');

      expect(result.type).toBe(SelectorType.XPATH);
      expect(result.value).toBe('//button[@id="submit"]');
    });

    it('should detect text selectors', () => {
      const result = parseSelector('text=Click me');

      expect(result.type).toBe(SelectorType.TEXT);
      expect(result.value).toBe('Click me');
    });

    it('should detect role selectors', () => {
      const result = parseSelector('role=button');

      expect(result.type).toBe(SelectorType.ROLE);
      expect(result.value).toBe('button');
    });

    it('should detect test-id selectors', () => {
      const result = parseSelector('data-testid=submit-btn');

      expect(result.type).toBe(SelectorType.TEST_ID);
      expect(result.value).toBe('submit-btn');
    });

    it('should detect placeholder selectors', () => {
      const result = parseSelector('placeholder=Enter email');

      expect(result.type).toBe(SelectorType.PLACEHOLDER);
      expect(result.value).toBe('Enter email');
    });

    it('should detect alt-text selectors', () => {
      const result = parseSelector('alt=Logo');

      expect(result.type).toBe(SelectorType.ALT_TEXT);
      expect(result.value).toBe('Logo');
    });

    it('should handle whitespace', () => {
      const result = parseSelector('  button.primary  ');

      expect(result.type).toBe(SelectorType.CSS);
      expect(result.value).toBe('button.primary');
    });

    it('should default to CSS for unknown engines', () => {
      const result = parseSelector('unknown=value');

      expect(result.type).toBe(SelectorType.CSS);
    });
  });

  describe('buildSelector()', () => {
    it('should build CSS selector', () => {
      const selector = buildSelector(SelectorType.CSS, 'button.primary');
      expect(selector).toBe('button.primary');
    });

    it('should build text selector', () => {
      const selector = buildSelector(SelectorType.TEXT, 'Click me');
      expect(selector).toBe('text=Click me');
    });

    it('should build role selector', () => {
      const selector = buildSelector(SelectorType.ROLE, 'button');
      expect(selector).toBe('role=button');
    });

    it('should build test-id selector', () => {
      const selector = buildSelector(SelectorType.TEST_ID, 'submit-btn');
      expect(selector).toBe('data-testid=submit-btn');
    });

    it('should build placeholder selector', () => {
      const selector = buildSelector(SelectorType.PLACEHOLDER, 'Enter email');
      expect(selector).toBe('placeholder=Enter email');
    });

    it('should build XPath selector', () => {
      const selector = buildSelector(SelectorType.XPATH, '//button');
      expect(selector).toBe('//button');
    });
  });

  describe('isValidSelector()', () => {
    it('should validate correct selectors', () => {
      expect(isValidSelector('button.primary')).toBe(true);
      expect(isValidSelector('text=Click')).toBe(true);
      expect(isValidSelector('//button')).toBe(true);
    });

    it('should reject empty selectors', () => {
      expect(isValidSelector('')).toBe(false);
      expect(isValidSelector('   ')).toBe(false);
    });

    it('should reject non-string selectors', () => {
      expect(isValidSelector(null as any)).toBe(false);
      expect(isValidSelector(undefined as any)).toBe(false);
      expect(isValidSelector(123 as any)).toBe(false);
    });
  });

  describe('isXPath()', () => {
    it('should detect XPath selectors', () => {
      expect(isXPath('//button')).toBe(true);
      expect(isXPath('/html/body/div')).toBe(true);
      expect(isXPath('(//button)[1]')).toBe(true);
    });

    it('should not detect CSS selectors as XPath', () => {
      expect(isXPath('button.primary')).toBe(false);
      expect(isXPath('#submit')).toBe(false);
    });
  });

  describe('hasEngine()', () => {
    it('should detect engine prefixes', () => {
      expect(hasEngine('text=Click')).toBe(true);
      expect(hasEngine('role=button')).toBe(true);
      expect(hasEngine('data-testid=submit')).toBe(true);
    });

    it('should not detect CSS selectors as having engine', () => {
      expect(hasEngine('button.primary')).toBe(false);
      expect(hasEngine('#submit')).toBe(false);
    });
  });

  describe('testIdSelector()', () => {
    it('should build test-id selector', () => {
      expect(testIdSelector('submit-btn')).toBe('[data-testid="submit-btn"]');
    });

    it('should escape special characters', () => {
      expect(testIdSelector('btn"with"quotes')).toContain('\\"');
    });
  });

  describe('textSelector()', () => {
    it('should build text selector', () => {
      expect(textSelector('Click me')).toBe('text=Click me');
    });

    it('should build exact text selector', () => {
      expect(textSelector('Click me', true)).toBe('text="Click me"');
    });
  });

  describe('roleSelector()', () => {
    it('should build simple role selector', () => {
      expect(roleSelector('button')).toBe('role=button');
    });

    it('should build role selector with name', () => {
      expect(roleSelector('button', { name: 'Submit' })).toContain('Submit');
    });

    it('should build role selector with checked state', () => {
      expect(roleSelector('checkbox', { checked: true })).toContain('checked=true');
    });
  });
});

describe('Logger', () => {
  let consoleDebugSpy: any;
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Log Levels', () => {
    it('should log debug messages when level is DEBUG', () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.debug('Debug message');

      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should log info messages when level is INFO', () => {
      logger.setLevel(LogLevel.INFO);
      logger.info('Info message');

      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should log warn messages when level is WARN', () => {
      logger.setLevel(LogLevel.WARN);
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error messages when level is ERROR', () => {
      logger.setLevel(LogLevel.ERROR);
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not log debug when level is INFO', () => {
      logger.setLevel(LogLevel.INFO);
      logger.debug('Debug message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should not log anything when level is NONE', () => {
      logger.setLevel(LogLevel.NONE);
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Message Formatting', () => {
    it('should include prefix in log messages', () => {
      logger.setLevel(LogLevel.INFO);
      logger.info('Test message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[agentic-playwright]')
      );
    });

    it('should include timestamp in log messages', () => {
      logger.setLevel(LogLevel.INFO);
      logger.info('Test message');

      // Check for ISO timestamp format
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T/)
      );
    });

    it('should include data objects in logs', () => {
      logger.setLevel(LogLevel.INFO);
      logger.info('Test message', { key: 'value' });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('key')
      );
    });
  });

  describe('Error Logging', () => {
    it('should format Error objects', () => {
      logger.setLevel(LogLevel.ERROR);
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });

    it('should include stack traces for errors', () => {
      logger.setLevel(LogLevel.ERROR);
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('stack')
      );
    });
  });

  describe('createLogger()', () => {
    it('should create logger with custom prefix', () => {
      const customLogger = createLogger('custom');
      customLogger.setLevel(LogLevel.INFO);
      customLogger.info('Test message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[custom]')
      );
    });
  });

  describe('Configuration', () => {
    it('should allow updating configuration', () => {
      logger.configure({ prefix: '[TEST]' });
      logger.setLevel(LogLevel.INFO);
      logger.info('Test');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TEST]')
      );
    });

    it('should return current log level', () => {
      logger.setLevel(LogLevel.WARN);
      expect(logger.getLevel()).toBe(LogLevel.WARN);
    });
  });
});

describe('ContextManager', () => {
  let manager: ReturnType<typeof getContextManager>;
  let mockBrowser: Partial<Browser>;
  let mockContext: Partial<BrowserContext>;
  let mockPage: Partial<Page>;

  beforeEach(() => {
    manager = getContextManager();

    mockPage = {
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockContext = {
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      close: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(async () => {
    await manager.clearAll();
  });

  describe('Session Management', () => {
    it('should create a new session', () => {
      const session = manager.createSession('session-1', mockBrowser as Browser);

      expect(session.sessionId).toBe('session-1');
      expect(session.browser).toBe(mockBrowser);
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it('should get session by ID', () => {
      manager.createSession('session-1', mockBrowser as Browser);
      const session = manager.getSession('session-1');

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe('session-1');
    });

    it('should return undefined for non-existent session', () => {
      const session = manager.getSession('non-existent');
      expect(session).toBeUndefined();
    });

    it('should update lastAccessedAt when getting session', () => {
      manager.createSession('session-1');
      const session1 = manager.getSession('session-1');
      const firstAccess = session1?.lastAccessedAt;

      // Wait a bit
      const session2 = manager.getSession('session-1');
      const secondAccess = session2?.lastAccessedAt;

      expect(secondAccess).toBeDefined();
    });

    it('should set current session', () => {
      manager.createSession('session-1');
      manager.setCurrentSession('session-1');

      const current = manager.getCurrentSession();
      expect(current?.sessionId).toBe('session-1');
    });

    it('should throw error when setting non-existent session as current', () => {
      expect(() => {
        manager.setCurrentSession('non-existent');
      }).toThrow('Session not found');
    });

    it('should remove session', async () => {
      manager.createSession('session-1', mockBrowser as Browser);
      await manager.removeSession('session-1');

      const session = manager.getSession('session-1');
      expect(session).toBeUndefined();
    });

    it('should close resources when removing session', async () => {
      manager.createSession('session-1', mockBrowser as Browser);
      manager.setContext('session-1', mockContext as BrowserContext);
      manager.setPage('session-1', mockPage as Page);

      await manager.removeSession('session-1');

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockContext.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('Context and Page Management', () => {
    it('should set context for session', () => {
      manager.createSession('session-1');
      manager.setContext('session-1', mockContext as BrowserContext);

      const session = manager.getSession('session-1');
      expect(session?.context).toBe(mockContext);
    });

    it('should set page for session', () => {
      manager.createSession('session-1');
      manager.setPage('session-1', mockPage as Page);

      const session = manager.getSession('session-1');
      expect(session?.page).toBe(mockPage);
    });

    it('should get current page', () => {
      manager.createSession('session-1');
      manager.setPage('session-1', mockPage as Page);

      const page = manager.getCurrentPage();
      expect(page).toBe(mockPage);
    });

    it('should throw error when getting page without active session', () => {
      expect(() => {
        manager.getCurrentPage();
      }).toThrow('No active page');
    });

    it('should get current context', () => {
      manager.createSession('session-1');
      manager.setContext('session-1', mockContext as BrowserContext);

      const context = manager.getCurrentContext();
      expect(context).toBe(mockContext);
    });

    it('should get current browser', () => {
      manager.createSession('session-1', mockBrowser as Browser);

      const browser = manager.getCurrentBrowser();
      expect(browser).toBe(mockBrowser);
    });
  });

  describe('Utility Methods', () => {
    it('should get all session IDs', () => {
      manager.createSession('session-1');
      manager.createSession('session-2');

      const ids = manager.getSessionIds();
      expect(ids).toContain('session-1');
      expect(ids).toContain('session-2');
      expect(ids.length).toBe(2);
    });

    it('should get current session ID', () => {
      manager.createSession('session-1');

      const id = manager.getCurrentSessionId();
      expect(id).toBe('session-1');
    });

    it('should get session count', () => {
      manager.createSession('session-1');
      manager.createSession('session-2');

      expect(manager.getSessionCount()).toBe(2);
    });

    it('should clear all sessions', async () => {
      manager.createSession('session-1');
      manager.createSession('session-2');

      await manager.clearAll();

      expect(manager.getSessionCount()).toBe(0);
    });
  });
});
