/**
 * Selector utilities for parsing and building Playwright selectors
 * @module utils/selectors
 */

import { logger } from './logger.js';

/**
 * Supported selector types
 */
export enum SelectorType {
  CSS = 'css',
  XPATH = 'xpath',
  TEXT = 'text',
  ROLE = 'role',
  TEST_ID = 'test-id',
  PLACEHOLDER = 'placeholder',
  ALT_TEXT = 'alt-text',
  TITLE = 'title',
  LABEL = 'label',
}

/**
 * Parsed selector result
 */
export interface ParsedSelector {
  type: SelectorType;
  value: string;
  original: string;
}

/**
 * Parse a selector string to detect its type
 *
 * @param selector - The selector string to parse
 * @returns Parsed selector information
 *
 * @example
 * ```typescript
 * parseSelector('button.primary') // { type: 'css', value: 'button.primary' }
 * parseSelector('text=Click me') // { type: 'text', value: 'Click me' }
 * parseSelector('//button[@id="submit"]') // { type: 'xpath', value: '//button[@id="submit"]' }
 * ```
 */
export function parseSelector(selector: string): ParsedSelector {
  const trimmed = selector.trim();

  // Check for Playwright selector engines (text=, role=, etc.)
  const engineMatch = trimmed.match(/^(\w+(?:-\w+)*)=(.+)$/);
  if (engineMatch) {
    const [, engine, value] = engineMatch;

    switch (engine) {
      case 'text':
        return { type: SelectorType.TEXT, value: value || '', original: trimmed };
      case 'role':
        return { type: SelectorType.ROLE, value: value || '', original: trimmed };
      case 'data-testid':
      case 'testid':
        return { type: SelectorType.TEST_ID, value: value || '', original: trimmed };
      case 'placeholder':
        return { type: SelectorType.PLACEHOLDER, value: value || '', original: trimmed };
      case 'alt':
      case 'alt-text':
        return { type: SelectorType.ALT_TEXT, value: value || '', original: trimmed };
      case 'title':
        return { type: SelectorType.TITLE, value: value || '', original: trimmed };
      case 'label':
        return { type: SelectorType.LABEL, value: value || '', original: trimmed };
      default:
        // Unknown engine, treat as CSS
        logger.warn(`Unknown selector engine: ${engine}, treating as CSS`);
        return { type: SelectorType.CSS, value: trimmed, original: trimmed };
    }
  }

  // Check for XPath (starts with / or ( )
  if (trimmed.startsWith('/') || trimmed.startsWith('(')) {
    return { type: SelectorType.XPATH, value: trimmed, original: trimmed };
  }

  // Default to CSS selector
  return { type: SelectorType.CSS, value: trimmed, original: trimmed };
}

/**
 * Build a Playwright selector from type and value
 *
 * @param type - The selector type
 * @param value - The selector value
 * @returns Formatted Playwright selector
 *
 * @example
 * ```typescript
 * buildSelector(SelectorType.TEXT, 'Click me') // 'text=Click me'
 * buildSelector(SelectorType.ROLE, 'button') // 'role=button'
 * buildSelector(SelectorType.CSS, 'button.primary') // 'button.primary'
 * ```
 */
export function buildSelector(type: SelectorType, value: string): string {
  switch (type) {
    case SelectorType.CSS:
      return value;
    case SelectorType.XPATH:
      return value;
    case SelectorType.TEXT:
      return `text=${value}`;
    case SelectorType.ROLE:
      return `role=${value}`;
    case SelectorType.TEST_ID:
      return `data-testid=${value}`;
    case SelectorType.PLACEHOLDER:
      return `placeholder=${value}`;
    case SelectorType.ALT_TEXT:
      return `alt=${value}`;
    case SelectorType.TITLE:
      return `title=${value}`;
    case SelectorType.LABEL:
      return `label=${value}`;
    default:
      logger.warn(`Unknown selector type: ${type}, returning value as-is`);
      return value;
  }
}

/**
 * Validate if a selector is well-formed
 *
 * @param selector - The selector to validate
 * @returns True if selector is valid
 */
export function isValidSelector(selector: string): boolean {
  if (!selector || typeof selector !== 'string') {
    return false;
  }

  const trimmed = selector.trim();
  if (trimmed.length === 0) {
    return false;
  }

  try {
    parseSelector(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize a selector (trim, handle edge cases)
 *
 * @param selector - The selector to normalize
 * @returns Normalized selector
 */
export function normalizeSelector(selector: string): string {
  return selector.trim();
}

/**
 * Check if selector is an XPath
 *
 * @param selector - The selector to check
 * @returns True if selector is XPath
 */
export function isXPath(selector: string): boolean {
  const trimmed = selector.trim();
  return trimmed.startsWith('/') || trimmed.startsWith('(');
}

/**
 * Check if selector uses a Playwright engine
 *
 * @param selector - The selector to check
 * @returns True if selector uses an engine (text=, role=, etc.)
 */
export function hasEngine(selector: string): boolean {
  return /^\w+(?:-\w+)*=.+$/.test(selector.trim());
}

/**
 * Escape special characters in CSS selector
 *
 * @param value - The value to escape
 * @returns Escaped value
 */
export function escapeCSSSelector(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

/**
 * Build a data-testid selector
 *
 * @param testId - The test ID value
 * @returns Formatted selector
 */
export function testIdSelector(testId: string): string {
  return `[data-testid="${escapeCSSSelector(testId)}"]`;
}

/**
 * Build a text selector with options
 *
 * @param text - The text to match
 * @param exact - Whether to match exact text (default: false)
 * @returns Formatted selector
 */
export function textSelector(text: string, exact: boolean = false): string {
  if (exact) {
    return `text="${text}"`;
  }
  return `text=${text}`;
}

/**
 * Build a role selector with options
 *
 * @param role - The ARIA role
 * @param options - Additional options (name, checked, etc.)
 * @returns Formatted selector
 */
export function roleSelector(role: string, options?: { name?: string; checked?: boolean }): string {
  if (!options || Object.keys(options).length === 0) {
    return `role=${role}`;
  }

  const parts = [role];
  if (options.name) {
    parts.push(`[name="${escapeCSSSelector(options.name)}"]`);
  }
  if (options.checked !== undefined) {
    parts.push(`[checked=${options.checked}]`);
  }

  return `role=${parts.join('')}`;
}
