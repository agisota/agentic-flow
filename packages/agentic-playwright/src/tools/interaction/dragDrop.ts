/**
 * Drag and drop interaction tool
 * @module tools/interaction/dragDrop
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface DragDropOptions {
  sourceSelector: string;
  targetSelector: string;
  timeout?: number;
  force?: boolean;
  noWaitAfter?: boolean;
  sourcePosition?: { x: number; y: number };
  targetPosition?: { x: number; y: number };
}

export interface DragDropResult {
  success: boolean;
  sourceSelector: string;
  targetSelector: string;
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
 * Drag and drop an element
 */
export async function dragDrop(options: DragDropOptions): Promise<DragDropResult> {
  const {
    sourceSelector,
    targetSelector,
    timeout = DEFAULT_TIMEOUT,
    force = false,
    noWaitAfter = false,
    sourcePosition,
    targetPosition,
  } = options;

  logger.info(`Drag and drop: ${sourceSelector} -> ${targetSelector}`);

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      // Wait for both elements to be actionable
      await Promise.all([
        page.waitForSelector(sourceSelector, {
          state: 'visible',
          timeout,
        }),
        page.waitForSelector(targetSelector, {
          state: 'visible',
          timeout,
        }),
      ]);

      // Perform drag and drop
      const dragOptions: {
        timeout: number;
        force: boolean;
        noWaitAfter: boolean;
        sourcePosition?: { x: number; y: number };
        targetPosition?: { x: number; y: number };
      } = {
        timeout,
        force,
        noWaitAfter,
      };
      if (sourcePosition !== undefined) {
        dragOptions.sourcePosition = sourcePosition;
      }
      if (targetPosition !== undefined) {
        dragOptions.targetPosition = targetPosition;
      }
      await page.dragAndDrop(sourceSelector, targetSelector, dragOptions);

      logger.debug(`Drag and drop successful: ${sourceSelector} -> ${targetSelector}`);

      return {
        success: true,
        sourceSelector,
        targetSelector,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Drag and drop attempt ${attempt}/${MAX_RETRIES} failed`,
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
    throw new TimeoutError(
      `drag and drop ${sourceSelector} to ${targetSelector}`,
      timeout,
      { sourceSelector, targetSelector, lastError }
    );
  }

  throw new ElementNotFoundError(sourceSelector, {
    details: { targetSelector, lastError },
  });
}
