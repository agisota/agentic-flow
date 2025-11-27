/**
 * Context Manager for tracking current page/tab state
 * Provides a shared context for navigation tools
 */

import { Page, BrowserContext } from 'playwright';

export interface NavigationContext {
  sessionId: string;
  page: Page | null;
  context: BrowserContext | null;
  currentUrl: string | null;
  currentTitle: string | null;
  tabs: Map<string, Page>;
  activeTabId: string | null;
}

export class NavigationContextManager {
  private static contexts: Map<string, NavigationContext> = new Map();

  /**
   * Create or get a navigation context for a session
   */
  static getOrCreate(sessionId: string, context?: BrowserContext, page?: Page): NavigationContext {
    if (!this.contexts.has(sessionId)) {
      const ctx: NavigationContext = {
        sessionId,
        page: page || null,
        context: context || null,
        currentUrl: null,
        currentTitle: null,
        tabs: new Map(),
        activeTabId: null,
      };

      this.contexts.set(sessionId, ctx);

      // Register the initial page if provided
      if (page) {
        const tabId = this.generateTabId();
        ctx.tabs.set(tabId, page);
        ctx.activeTabId = tabId;
      }
    }

    return this.contexts.get(sessionId)!;
  }

  /**
   * Get navigation context for a session
   */
  static get(sessionId: string): NavigationContext | null {
    return this.contexts.get(sessionId) || null;
  }

  /**
   * Update the current page in the context
   */
  static updateCurrentPage(sessionId: string, page: Page): void {
    const ctx = this.contexts.get(sessionId);
    if (ctx) {
      ctx.page = page;
    }
  }

  /**
   * Update current URL in the context
   */
  static updateCurrentUrl(sessionId: string, url: string): void {
    const ctx = this.contexts.get(sessionId);
    if (ctx) {
      ctx.currentUrl = url;
    }
  }

  /**
   * Update current title in the context
   */
  static updateCurrentTitle(sessionId: string, title: string): void {
    const ctx = this.contexts.get(sessionId);
    if (ctx) {
      ctx.currentTitle = title;
    }
  }

  /**
   * Register a new tab
   */
  static registerTab(sessionId: string, page: Page): string {
    const ctx = this.contexts.get(sessionId);
    if (!ctx) {
      throw new Error(`Navigation context not found for session: ${sessionId}`);
    }

    const tabId = this.generateTabId();
    ctx.tabs.set(tabId, page);

    return tabId;
  }

  /**
   * Unregister a tab
   */
  static unregisterTab(sessionId: string, tabId: string): void {
    const ctx = this.contexts.get(sessionId);
    if (ctx) {
      ctx.tabs.delete(tabId);

      // If this was the active tab, switch to another or null
      if (ctx.activeTabId === tabId) {
        const remainingTabs = Array.from(ctx.tabs.keys());
        ctx.activeTabId = remainingTabs[0] || null;
        ctx.page = ctx.activeTabId ? ctx.tabs.get(ctx.activeTabId) || null : null;
      }
    }
  }

  /**
   * Set the active tab
   */
  static setActiveTab(sessionId: string, tabId: string): void {
    const ctx = this.contexts.get(sessionId);
    if (!ctx) {
      throw new Error(`Navigation context not found for session: ${sessionId}`);
    }

    const page = ctx.tabs.get(tabId);
    if (!page) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    ctx.activeTabId = tabId;
    ctx.page = page;
  }

  /**
   * Get all tabs for a session
   */
  static getTabs(sessionId: string): Map<string, Page> {
    const ctx = this.contexts.get(sessionId);
    return ctx ? ctx.tabs : new Map();
  }

  /**
   * Get the active tab ID
   */
  static getActiveTabId(sessionId: string): string | null {
    const ctx = this.contexts.get(sessionId);
    return ctx ? ctx.activeTabId : null;
  }

  /**
   * Clear navigation context for a session
   */
  static clear(sessionId: string): void {
    this.contexts.delete(sessionId);
  }

  /**
   * Clear all navigation contexts
   */
  static clearAll(): void {
    this.contexts.clear();
  }

  /**
   * Generate a unique tab ID
   */
  private static generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get current page for a session
   */
  static getCurrentPage(sessionId: string): Page | null {
    const ctx = this.contexts.get(sessionId);
    return ctx ? ctx.page : null;
  }

  /**
   * Get browser context for a session
   */
  static getBrowserContext(sessionId: string): BrowserContext | null {
    const ctx = this.contexts.get(sessionId);
    return ctx ? ctx.context : null;
  }
}
