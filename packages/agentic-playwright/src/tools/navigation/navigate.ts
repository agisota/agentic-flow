/**
 * Navigate to URL Tool
 * Navigates to a specified URL and waits for page load
 */

import { z } from 'zod';
import { NavigationContextManager } from './context.js';

// Input schema validation
export const navigateInputSchema = z.object({
  url: z.string().url({ message: 'Invalid URL format' }),
  sessionId: z.string().optional(),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).default('load'),
  timeout: z.number().min(1000).max(120000).default(30000),
  referer: z.string().optional(),
});

export type NavigateInput = z.infer<typeof navigateInputSchema>;

export interface NavigateOutput {
  success: boolean;
  url: string;
  title: string;
  loadTime: number;
  finalUrl?: string;
  status?: number;
  error?: string;
}

/**
 * Navigate to a URL
 */
export async function navigate(input: NavigateInput): Promise<NavigateOutput> {
  const startTime = Date.now();

  try {
    // Validate input
    const validated = navigateInputSchema.parse(input);
    const { url, sessionId, waitUntil, timeout, referer } = validated;

    // Get or create navigation context
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const ctx = NavigationContextManager.get(sessionId);
    if (!ctx || !ctx.page) {
      throw new Error(`No active page found for session: ${sessionId}`);
    }

    const page = ctx.page;

    // Setup navigation options
    const navOptions: any = {
      waitUntil,
      timeout,
    };

    if (referer) {
      navOptions.referer = referer;
    }

    // Perform navigation
    const response = await page.goto(url, navOptions);

    // Get page information after navigation
    const finalUrl = page.url();
    const title = await page.title();
    const loadTime = Date.now() - startTime;

    // Update context
    NavigationContextManager.updateCurrentUrl(sessionId, finalUrl);
    NavigationContextManager.updateCurrentTitle(sessionId, title);

    // Get response status
    const status = response?.status();

    return {
      success: true,
      url: finalUrl,
      title,
      loadTime,
      finalUrl,
      status,
    };
  } catch (error) {
    const loadTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      url: input.url,
      title: '',
      loadTime,
      error: errorMessage,
    };
  }
}

/**
 * Tool definition for MCP
 */
export const navigateTool = {
  name: 'navigate',
  description: 'Navigate to a URL and wait for page load',
  inputSchema: navigateInputSchema,
  handler: navigate,
};
