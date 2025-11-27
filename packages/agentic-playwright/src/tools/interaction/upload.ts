/**
 * File upload interaction tool
 * @module tools/interaction/upload
 */

import { getCurrentPage } from '../../utils/context.js';
import { ElementNotFoundError, TimeoutError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface UploadOptions {
  selector: string;
  filePaths: string | string[];
  timeout?: number;
  noWaitAfter?: boolean;
}

export interface UploadResult {
  success: boolean;
  selector: string;
  files: string[];
  fileCount: number;
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
 * Upload file(s) to an input element
 */
export async function upload(options: UploadOptions): Promise<UploadResult> {
  const {
    selector,
    filePaths,
    timeout = DEFAULT_TIMEOUT,
    noWaitAfter = false,
  } = options;

  const filePathsArray = Array.isArray(filePaths) ? filePaths : [filePaths];

  logger.info(`Uploading files to: ${selector}`, {
    fileCount: filePathsArray.length,
    files: filePathsArray,
  });

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const page = getCurrentPage();

      // Wait for element to be actionable
      await page.waitForSelector(selector, {
        state: 'attached',
        timeout,
      });

      // Set input files
      await page.setInputFiles(selector, filePathsArray, {
        timeout,
        noWaitAfter,
      });

      logger.debug(`Upload successful: ${selector}`, {
        fileCount: filePathsArray.length,
      });

      return {
        success: true,
        selector,
        files: filePathsArray,
        fileCount: filePathsArray.length,
      };
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Upload attempt ${attempt}/${MAX_RETRIES} failed: ${selector}`,
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
    throw new TimeoutError(`upload files to ${selector}`, timeout, {
      selector,
      filePaths: filePathsArray,
      lastError,
    });
  }

  throw new ElementNotFoundError(selector, { lastError });
}

/**
 * Clear uploaded files from an input element
 */
export async function clearUpload(
  options: Omit<UploadOptions, 'filePaths'>
): Promise<UploadResult> {
  logger.info(`Clearing uploaded files from: ${options.selector}`);

  return upload({
    ...options,
    filePaths: [],
  });
}
