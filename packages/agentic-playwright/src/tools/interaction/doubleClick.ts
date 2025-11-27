/**
 * Double click interaction tool
 * @module tools/interaction/doubleClick
 */

import type { ClickOptions, ClickResult } from './click.js';
import { click } from './click.js';
import { logger } from '../../utils/logger.js';

export interface DoubleClickOptions extends Omit<ClickOptions, 'clickCount'> {}

export interface DoubleClickResult extends ClickResult {}

/**
 * Double click an element
 */
export async function doubleClick(
  options: DoubleClickOptions
): Promise<DoubleClickResult> {
  logger.info(`Double clicking element: ${options.selector}`);

  return click({
    ...options,
    clickCount: 2,
  });
}
