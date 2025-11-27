/**
 * Extraction Tools - MCP tools for extracting data from web pages
 *
 * This module provides comprehensive data extraction capabilities:
 * - Text content extraction
 * - HTML content (inner/outer)
 * - Attribute values
 * - Form input values
 * - Screenshots (page/element)
 * - PDF generation
 * - Table data parsing
 * - JavaScript evaluation
 * - Multiple element information
 */

// Import all extraction functions and schemas
import { getText, GetTextInputSchema, GetTextOutputSchema } from './getText.js';
import { getAttribute, GetAttributeInputSchema, GetAttributeOutputSchema } from './getAttribute.js';
import { getValue, GetValueInputSchema, GetValueOutputSchema } from './getValue.js';
import { getInnerHtml, GetInnerHtmlInputSchema, GetInnerHtmlOutputSchema } from './getInnerHtml.js';
import { getOuterHtml, GetOuterHtmlInputSchema, GetOuterHtmlOutputSchema } from './getOuterHtml.js';
import { screenshot, ScreenshotInputSchema, ScreenshotOutputSchema } from './screenshot.js';
import { generatePdf as pdf, PdfInputSchema, PdfOutputSchema } from './pdf.js';
import { getTable, GetTableInputSchema, GetTableOutputSchema } from './getTable.js';
import { evaluate, EvaluateInputSchema, EvaluateOutputSchema } from './evaluate.js';
import { getElements, GetElementsInputSchema, GetElementsOutputSchema } from './getElements.js';

// Re-export all functions and types
export * from './getText.js';
export * from './getAttribute.js';
export * from './getValue.js';
export * from './getInnerHtml.js';
export * from './getOuterHtml.js';
export * from './screenshot.js';
export * from './pdf.js';
export * from './getTable.js';
export * from './evaluate.js';
export * from './getElements.js';

/**
 * Tool definition for MCP server registration
 */
export interface ExtractionToolDefinition {
  name: string;
  description: string;
  inputSchema: unknown;
  outputSchema: unknown;
  handler: (...args: unknown[]) => Promise<unknown>;
}

/**
 * Get text tool definition
 */
export const getTextTool: ExtractionToolDefinition = {
  name: 'playwright_get_text',
  description: 'Extract text content from an element',
  inputSchema: GetTextInputSchema,
  outputSchema: GetTextOutputSchema,
  handler: getText as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Get attribute tool definition
 */
export const getAttributeTool: ExtractionToolDefinition = {
  name: 'playwright_get_attribute',
  description: 'Get an attribute value from an element',
  inputSchema: GetAttributeInputSchema,
  outputSchema: GetAttributeOutputSchema,
  handler: getAttribute as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Get value tool definition
 */
export const getValueTool: ExtractionToolDefinition = {
  name: 'playwright_get_value',
  description: 'Get the value of an input element',
  inputSchema: GetValueInputSchema,
  outputSchema: GetValueOutputSchema,
  handler: getValue as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Get inner HTML tool definition
 */
export const getInnerHtmlTool: ExtractionToolDefinition = {
  name: 'playwright_get_inner_html',
  description: 'Get the inner HTML of an element',
  inputSchema: GetInnerHtmlInputSchema,
  outputSchema: GetInnerHtmlOutputSchema,
  handler: getInnerHtml as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Get outer HTML tool definition
 */
export const getOuterHtmlTool: ExtractionToolDefinition = {
  name: 'playwright_get_outer_html',
  description: 'Get the outer HTML of an element',
  inputSchema: GetOuterHtmlInputSchema,
  outputSchema: GetOuterHtmlOutputSchema,
  handler: getOuterHtml as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Screenshot tool definition
 */
export const screenshotTool: ExtractionToolDefinition = {
  name: 'playwright_screenshot',
  description: 'Take a screenshot of the page or an element',
  inputSchema: ScreenshotInputSchema,
  outputSchema: ScreenshotOutputSchema,
  handler: screenshot as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * PDF generation tool definition
 */
export const pdfTool: ExtractionToolDefinition = {
  name: 'playwright_generate_pdf',
  description: 'Generate a PDF of the current page',
  inputSchema: PdfInputSchema,
  outputSchema: PdfOutputSchema,
  handler: pdf as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Alias for pdf generation
 */
export { pdf };

/**
 * Get table tool definition
 */
export const getTableTool: ExtractionToolDefinition = {
  name: 'playwright_get_table',
  description: 'Extract structured data from an HTML table',
  inputSchema: GetTableInputSchema,
  outputSchema: GetTableOutputSchema,
  handler: getTable as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Evaluate JavaScript tool definition
 */
export const evaluateTool: ExtractionToolDefinition = {
  name: 'playwright_evaluate',
  description: 'Execute JavaScript in the page context',
  inputSchema: EvaluateInputSchema,
  outputSchema: EvaluateOutputSchema,
  handler: evaluate as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Get elements tool definition
 */
export const getElementsTool: ExtractionToolDefinition = {
  name: 'playwright_get_elements',
  description: 'Get information about multiple elements matching a selector',
  inputSchema: GetElementsInputSchema,
  outputSchema: GetElementsOutputSchema,
  handler: getElements as unknown as (...args: unknown[]) => Promise<unknown>,
};

/**
 * Array of all extraction tool definitions for easy registration
 */
export const extractionTools: ExtractionToolDefinition[] = [
  getTextTool,
  getAttributeTool,
  getValueTool,
  getInnerHtmlTool,
  getOuterHtmlTool,
  screenshotTool,
  pdfTool,
  getTableTool,
  evaluateTool,
  getElementsTool,
];

/**
 * Extraction tool names for type-safe reference
 */
export const EXTRACTION_TOOL_NAMES = {
  GET_TEXT: 'playwright_get_text',
  GET_ATTRIBUTE: 'playwright_get_attribute',
  GET_VALUE: 'playwright_get_value',
  GET_INNER_HTML: 'playwright_get_inner_html',
  GET_OUTER_HTML: 'playwright_get_outer_html',
  SCREENSHOT: 'playwright_screenshot',
  GENERATE_PDF: 'playwright_generate_pdf',
  GET_TABLE: 'playwright_get_table',
  EVALUATE: 'playwright_evaluate',
  GET_ELEMENTS: 'playwright_get_elements',
} as const;

export type ExtractionToolName = typeof EXTRACTION_TOOL_NAMES[keyof typeof EXTRACTION_TOOL_NAMES];
