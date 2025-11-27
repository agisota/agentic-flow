/**
 * Shared context manager for browser sessions
 * @module utils/context
 */

import type { Browser, BrowserContext, Page } from 'playwright';
import { ContextError, PageError } from './errors.js';
import { logger } from './logger.js';

/**
 * Session information
 */
export interface SessionInfo {
  sessionId: string;
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  createdAt: Date;
  lastAccessedAt: Date;
}

/**
 * Shared context manager for tracking browser sessions
 * Implements singleton pattern for global state management
 */
class ContextManager {
  private static instance: ContextManager;
  private sessions: Map<string, SessionInfo> = new Map();
  private currentSessionId?: string;

  private constructor() {
    logger.debug('ContextManager initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  /**
   * Create a new session
   */
  createSession(sessionId: string, browser?: Browser): SessionInfo {
    const session: SessionInfo = {
      sessionId,
      browser,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    logger.debug(`Session created: ${sessionId}`);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionInfo | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessedAt = new Date();
    }
    return session;
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionInfo | undefined {
    if (!this.currentSessionId) {
      return undefined;
    }
    return this.getSession(this.currentSessionId);
  }

  /**
   * Set current session
   */
  setCurrentSession(sessionId: string): void {
    if (!this.sessions.has(sessionId)) {
      throw new ContextError(`Session not found: ${sessionId}`);
    }
    this.currentSessionId = sessionId;
    logger.debug(`Current session set to: ${sessionId}`);
  }

  /**
   * Update session context
   */
  setContext(sessionId: string, context: BrowserContext): void {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new ContextError(`Session not found: ${sessionId}`);
    }
    session.context = context;
    session.lastAccessedAt = new Date();
    logger.debug(`Context set for session: ${sessionId}`);
  }

  /**
   * Update session page
   */
  setPage(sessionId: string, page: Page): void {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new ContextError(`Session not found: ${sessionId}`);
    }
    session.page = page;
    session.lastAccessedAt = new Date();
    logger.debug(`Page set for session: ${sessionId}`);
  }

  /**
   * Get current page
   */
  getCurrentPage(): Page {
    const session = this.getCurrentSession();
    if (!session || !session.page) {
      throw new PageError('No active page. Please create a session and navigate to a page first.');
    }
    return session.page;
  }

  /**
   * Get current context
   */
  getCurrentContext(): BrowserContext {
    const session = this.getCurrentSession();
    if (!session || !session.context) {
      throw new ContextError('No active context. Please create a session first.');
    }
    return session.context;
  }

  /**
   * Get current browser
   */
  getCurrentBrowser(): Browser {
    const session = this.getCurrentSession();
    if (!session || !session.browser) {
      throw new ContextError('No active browser. Please create a session first.');
    }
    return session.browser;
  }

  /**
   * Remove a session
   */
  async removeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    // Close resources
    try {
      if (session.page) {
        await session.page.close();
      }
      if (session.context) {
        await session.context.close();
      }
      if (session.browser) {
        await session.browser.close();
      }
    } catch (error) {
      logger.error(`Error closing session resources: ${sessionId}`, error);
    }

    this.sessions.delete(sessionId);
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = undefined;
    }

    logger.debug(`Session removed: ${sessionId}`);
  }

  /**
   * Get all session IDs
   */
  getSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | undefined {
    return this.currentSessionId;
  }

  /**
   * Clear all sessions
   */
  async clearAll(): Promise<void> {
    const sessionIds = this.getSessionIds();
    await Promise.all(sessionIds.map(id => this.removeSession(id)));
    logger.debug('All sessions cleared');
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}

/**
 * Get singleton instance
 */
export function getContextManager(): ContextManager {
  return ContextManager.getInstance();
}

/**
 * Convenience function to get current page
 */
export function getCurrentPage(): Page {
  return getContextManager().getCurrentPage();
}

/**
 * Convenience function to get current context
 */
export function getCurrentContext(): BrowserContext {
  return getContextManager().getCurrentContext();
}

/**
 * Convenience function to get current browser
 */
export function getCurrentBrowser(): Browser {
  return getContextManager().getCurrentBrowser();
}
