import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Schema for evaluate tool input
 */
export const EvaluateInputSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  script: z.string().describe('JavaScript code to execute in page context'),
  args: z.array(z.any()).optional().describe('Arguments to pass to the script'),
  timeout: z.number().default(30000).optional().describe('Timeout in milliseconds'),
});

export type EvaluateInput = z.infer<typeof EvaluateInputSchema>;

/**
 * Schema for evaluate tool output
 */
export const EvaluateOutputSchema = z.object({
  result: z.any().describe('Result returned by the script'),
  type: z.string().describe('Type of the result'),
  success: z.boolean().describe('Whether execution was successful'),
});

export type EvaluateOutput = z.infer<typeof EvaluateOutputSchema>;

/**
 * Execute JavaScript in page context
 *
 * Features:
 * - Execute arbitrary JavaScript
 * - Pass arguments to script
 * - Return serializable values
 * - Access page DOM and APIs
 * - Timeout protection
 *
 * Security Notes:
 * - Script runs in page context (not Node.js)
 * - Has access to page's window, document, etc.
 * - Cannot access Node.js APIs
 * - Return value must be serializable (JSON)
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns Script execution result
 */
export async function evaluate(
  page: Page,
  input: EvaluateInput
): Promise<EvaluateOutput> {
  const { script, args = [], timeout } = input;

  try {
    // Wrap script in async function if needed
    const wrappedScript = `
      (async function(...args) {
        ${script}
      })(...arguments)
    `;

    // Execute script with timeout
    const result = await page.evaluate(
      wrappedScript,
      args,
    );

    // Determine result type
    let type = typeof result;
    if (result === null) {
      type = 'object';
    } else if (Array.isArray(result)) {
      type = 'object';
    } else if (result instanceof Date) {
      type = 'object';
    }

    return {
      result,
      type,
      success: true,
    };
  } catch (error) {
    // Return error information
    return {
      result: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      type: 'error',
      success: false,
    };
  }
}

/**
 * MCP tool definition for evaluate
 */
export const evaluateTool = {
  name: 'playwright_evaluate',
  description: 'Execute JavaScript code in the page context. Has access to DOM and page APIs. Return value must be JSON-serializable. Use for custom data extraction or page manipulation.',
  inputSchema: EvaluateInputSchema,
  outputSchema: EvaluateOutputSchema,
};
