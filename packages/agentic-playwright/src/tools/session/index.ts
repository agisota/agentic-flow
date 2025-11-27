/**
 * Session Management Tools
 * Tools for managing cookies, storage, and session state
 */

export * from './getCookies';
export * from './setCookie';
export * from './deleteCookies';
export * from './getStorage';
export * from './setStorage';
export * from './saveSession';
export * from './restoreSession';

import { getCookiesTool } from './getCookies';
import { setCookieTool } from './setCookie';
import { deleteCookiesTool } from './deleteCookies';
import { getStorageTool } from './getStorage';
import { setStorageTool } from './setStorage';
import { saveSessionTool } from './saveSession';
import { restoreSessionTool } from './restoreSession';

/**
 * All session tools exported as array for MCP server registration
 */
export const sessionTools = [
  getCookiesTool,
  setCookieTool,
  deleteCookiesTool,
  getStorageTool,
  setStorageTool,
  saveSessionTool,
  restoreSessionTool,
];
