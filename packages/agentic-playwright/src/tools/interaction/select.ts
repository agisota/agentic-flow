/**
 * Select dropdown option interaction tool
 * @module tools/interaction/select
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface SelectOptions {
  selector: string;
  value?: string | string[]; // Select by value attribute
  label?: string | string[]; // Select by visible text
  index?: number | number[]; // Select by index
  timeout?: number;
  force?: boolean;
  noWaitAfter?: boolean;
}

export interface SelectResult {
  success: boolean;
  selector: string;
  selected: string[];
  error?: string;
}

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Wait and retry helper
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Select dropdown option(s)
 */
export async function select(options: SelectOptions): Promise<SelectResult> {
  const {
    selector,
    value,
    label,
    index,
    timeout = DEFAULT_TIMEOUT,
    force = false,
    noWaitAfter = false,
  } = options;

  logger.info(`Selecting option in: ${selector}`, { value, label, index });

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      // Wait for element to be actionable
      await page.waitForSelector(selector, {
        state: 'visible',
        timeout,
      });

      let selected: string[] = [];

      // Select by value
      if (value !== undefined) {
        selected = await page.selectOption(
          selector,
          Array.isArray(value) ? value.map(v => ({ value: v })) : { value },
          { timeout, force, noWaitAfter }
        );
      }
      // Select by label
      else if (label !== undefined) {
        selected = await page.selectOption(
          selector,
          Array.isArray(label) ? label.map(l => ({ label: l })) : { label },
          { timeout, force, noWaitAfter }
        );
      }
      // Select by index
      else if (index !== undefined) {
        selected = await page.selectOption(
          selector,
          Array.isArray(index) ? index.map(i => ({ index: i })) : { index },
          { timeout, force, noWaitAfter }
        );
      } else {
        throw new Error('Must provide value, label, or index option');
      }

      logger.debug(`Select successful: ${selector}`, { selected });

      return {
        success: true,
        selector,
        selected,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Select attempt ${attempt}/${MAX_RETRIES} failed: ${selector}`,
        error
      );

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY);
      }
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || 'Unknown error';

  if (errorMessage.includes('Timeout') || errorMessage.includes('timeout')) {
    throw new TimeoutError(`select ${selector}`, timeout, {
      selector,
      lastError,
    });
  }

  throw new ElementNotFoundError(selector, { lastError });
}
