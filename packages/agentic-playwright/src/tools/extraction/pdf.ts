import { Page } from 'playwright';
import { z } from 'zod';

/**
 * Schema for PDF tool input
 */
export const PdfInputSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  path: z.string().describe('File path to save PDF'),
  format: z.enum(['A4', 'Letter', 'Legal', 'A3', 'Tabloid']).default('A4').optional().describe('Paper format'),
  landscape: z.boolean().default(false).optional().describe('Use landscape orientation'),
  printBackground: z.boolean().default(true).optional().describe('Print background graphics'),
  scale: z.number().min(0.1).max(2).default(1).optional().describe('Scale of the page rendering (0.1-2)'),
  displayHeaderFooter: z.boolean().default(false).optional().describe('Display header and footer'),
  headerTemplate: z.string().optional().describe('HTML template for header'),
  footerTemplate: z.string().optional().describe('HTML template for footer'),
  margin: z.object({
    top: z.string().optional(),
    right: z.string().optional(),
    bottom: z.string().optional(),
    left: z.string().optional(),
  }).optional().describe('Page margins (e.g., "10mm", "1in")'),
  pageRanges: z.string().optional().describe('Paper ranges to print (e.g., "1-5, 8, 11-13")'),
  preferCSSPageSize: z.boolean().default(false).optional().describe('Use CSS-defined page size'),
  timeout: z.number().default(30000).optional().describe('Timeout in milliseconds'),
});

export type PdfInput = z.infer<typeof PdfInputSchema>;

/**
 * Schema for PDF tool output
 */
export const PdfOutputSchema = z.object({
  success: z.boolean().describe('Whether PDF generation was successful'),
  path: z.string().describe('File path where PDF was saved'),
  pages: z.number().describe('Number of pages in PDF'),
  format: z.string().describe('Paper format used'),
});

export type PdfOutput = z.infer<typeof PdfOutputSchema>;

/**
 * Generate PDF from current page
 *
 * Features:
 * - Multiple paper formats
 * - Portrait/landscape orientation
 * - Custom margins and scaling
 * - Header/footer support
 * - Background graphics control
 * - Page range selection
 *
 * @param page - Playwright page instance
 * @param input - Tool input parameters
 * @returns PDF metadata
 */
export async function generatePdf(
  page: Page,
  input: PdfInput
): Promise<PdfOutput> {
  const {
    path,
    format,
    landscape,
    printBackground,
    scale,
    displayHeaderFooter,
    headerTemplate,
    footerTemplate,
    margin,
    pageRanges,
    preferCSSPageSize,
    timeout,
  } = input;

  try {
    // Wait for page to be ready
    await page.waitForLoadState('networkidle', { timeout });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      path,
      format,
      landscape,
      printBackground,
      scale,
      displayHeaderFooter,
      headerTemplate,
      footerTemplate,
      margin,
      pageRanges,
      preferCSSPageSize,
    });

    // Estimate page count based on buffer size and format
    // This is approximate, as actual page count depends on content
    const estimatedPages = await page.evaluate(() => {
      const bodyHeight = document.body.scrollHeight;
      const pageHeight = 842; // A4 height in pixels at 72dpi
      return Math.ceil(bodyHeight / pageHeight);
    });

    return {
      success: true,
      path,
      pages: estimatedPages,
      format: format || 'A4',
    };
  } catch (error) {
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * MCP tool definition for PDF generation
 */
export const pdfTool = {
  name: 'playwright_generate_pdf',
  description: 'Generate PDF from current page. Supports various paper formats, orientations, margins, and headers/footers. Only works with Chromium browser.',
  inputSchema: PdfInputSchema,
  outputSchema: PdfOutputSchema,
};
