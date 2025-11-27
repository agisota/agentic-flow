/**
 * Mock API responses
 * Mock network responses for testing and development
 */

import { Page, Route } from 'playwright';
import { z } from 'zod';

/**
 * Input schema for mock tool
 */
export const mockSchema = z.object({
  urlPattern: z.string().describe('URL pattern to mock'),
  response: z.object({
    status: z.number().min(100).max(599).default(200).describe('HTTP status code'),
    headers: z.record(z.string()).optional().describe('Response headers'),
    body: z.any().describe('Response body (JSON object or string)'),
    contentType: z.string().default('application/json').describe('Content-Type header'),
  }).describe('Mock response configuration'),
});

export type MockInput = z.infer<typeof mockSchema>;

/**
 * Output schema for mock tool
 */
export interface MockOutput {
  success: boolean;
  mockId: string;
  pattern: string;
}

/**
 * Store active mocks for cleanup
 */
const activeMocks = new Map<string, { page: Page; pattern: string }>();

/**
 * Mock API responses
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Mock configuration
 */
export async function mock(
  page: Page,
  input: MockInput
): Promise<MockOutput> {
  try {
    const mockId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await page.route(input.urlPattern, async (route: Route) => {
      const headers = input.response.headers || {};
      if (!headers['content-type']) {
        headers['content-type'] = input.response.contentType;
      }

      // Convert body to string if it's an object
      let body = input.response.body;
      if (typeof body === 'object' && body !== null) {
        body = JSON.stringify(body);
      }

      await route.fulfill({
        status: input.response.status,
        headers,
        body: body as string,
      });
    });

    // Store for cleanup
    activeMocks.set(mockId, {
      page,
      pattern: input.urlPattern,
    });

    return {
      success: true,
      mockId,
      pattern: input.urlPattern,
    };
  } catch (error) {
    throw new Error(
      `Failed to mock response: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Cleanup all mocks for a page
 */
export async function cleanupMocks(page: Page): Promise<void> {
  for (const [mockId, config] of activeMocks.entries()) {
    if (config.page === page) {
      try {
        await page.unroute(config.pattern);
        activeMocks.delete(mockId);
      } catch (error) {
        // Ignore cleanup errors
        console.error(`Failed to cleanup mock ${mockId}:`, error);
      }
    }
  }
}

/**
 * Tool metadata for MCP server
 */
export const mockTool = {
  name: 'playwright_mock_response',
  description: 'Mock API responses for testing and development',
  inputSchema: mockSchema,
  handler: mock,
};
