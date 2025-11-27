/**
 * Clear input field interaction tool
 * @module tools/interaction/clear
 */

import { fill, type FillOptions, type FillResult } from './fill.js';
import { logger } from '../../utils/logger.js';

export interface ClearOptions extends Omit<FillOptions, 'value'> {}

export interface ClearResult extends Omit<FillResult, 'value'> {
  cleared: boolean;
}

/**
 * Clear an input field
 */
export async function clear(options: ClearOptions): Promise<ClearResult> {
  logger.info(`Clearing element: ${options.selector}`);

  const result = await fill({
    ...options,
    value: '',
  });

  return {
    success: result.success,
    selector: result.selector,
    cleared: true,
  };
}
